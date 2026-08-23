# Custom domain (contextid.app, registered at GoDaddy) in front of the
# contextid-web ECS Express service's AWS-assigned URL.
#
# ECS Express Mode's shared ALB (see the note at the top of ecs.tf) issues
# its own ACM certificate scoped to exactly the auto-generated hostname,
# and isn't tracked in this Terraform state at all — it's AWS-managed
# infrastructure shared across every Express service in the account/region,
# not something safe to bolt a custom domain onto directly. CloudFront in
# front of it, with its own ACM certificate for contextid.app, is the
# supported way to get a custom domain without touching that shared ALB.
#
# Two-phase apply, same idea as web_url/api_url in ecs.tf:
#   1. terraform apply -target=aws_acm_certificate.web
#      terraform output cert_validation_records
#      -> add those as CNAME records at your DNS host (GoDaddy). ACM
#         validation can take a few minutes to a few hours to see them.
#   2. terraform apply
#      -> waits for the certificate to validate, then creates the
#         CloudFront distribution using it.
#
# Then at GoDaddy (this part isn't Terraform's to manage — GoDaddy's DNS
# isn't a supported provider here):
#   - CNAME  www  ->  (terraform output cloudfront_domain_name)
#   - the bare apex (contextid.app) can't be a CNAME (DNS spec forbids a
#     CNAME coexisting with other records at the zone apex) — either use
#     GoDaddy's "Forwarding" feature to redirect the apex to
#     https://www.contextid.app, or delegate contextid.app's nameservers
#     to a Route 53 hosted zone, which supports a true ALIAS record at the
#     apex pointing straight at CloudFront (no redirect needed).

# CloudFront requires the certificate to exist in us-east-1, regardless of
# which region the origin (or anything else in this project) lives in.
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile

  allowed_account_ids = [var.aws_account_id]
}

resource "aws_acm_certificate" "web" {
  provider = aws.us_east_1

  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "web" {
  provider = aws.us_east_1

  certificate_arn = aws_acm_certificate.web.arn

  timeouts {
    create = "45m"
  }
}

# Forward everything to the origin except the Host header: the origin is
# ECS Express Mode's shared ALB, which routes purely by matching the Host
# header against each service's own auto-generated hostname (see ecs.tf).
# Forwarding CloudFront's own Host header (contextid.app) would make the
# ALB fall through to its default 404 instead of reaching the web service.
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host_header" {
  name = "Managed-AllViewerExceptHostHeader"
}

# This is a fully dynamic, cookie-authenticated app (Next.js pages, server
# actions, an API proxy) — nothing here should be cached by CloudFront.
data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

resource "aws_cloudfront_distribution" "web" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.project_name} custom domain (${var.domain_name}) in front of the ECS Express web service"
  aliases         = [var.domain_name, "www.${var.domain_name}"]
  http_version    = "http2and3"

  origin {
    origin_id   = "ecs-express-web"
    domain_name = trimprefix(var.web_url, "https://")

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "ecs-express-web"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host_header.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.web.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
