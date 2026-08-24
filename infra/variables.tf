variable "aws_region" {
  description = "AWS region to deploy into. Matches the existing S3 bucket's region."
  type        = string
  default     = "us-west-2"
}

variable "aws_profile" {
  description = "AWS CLI profile (from ~/.aws/config) Terraform authenticates with. Set explicitly here so it's always used regardless of any AWS_PROFILE env var in your shell."
  type        = string
  default     = "wzhe-aws-amazon-com"
}

variable "aws_account_id" {
  description = "Expected AWS account ID — Terraform refuses to run if the profile above resolves to a different account."
  type        = string
  default     = "391422395203"
}

variable "project_name" {
  description = "Short name prefixed onto all created resources."
  type        = string
  default     = "contextid"
}

variable "domain_name" {
  description = "Custom domain (registered at GoDaddy) served via CloudFront in front of the contextid-web ECS Express service. See cdn.tf."
  type        = string
  default     = "contextid.app"
}

variable "github_repository" {
  description = "GitHub repo in \"owner/name\" form. Scopes the OIDC trust policy so only workflows from this repo can assume the deploy role."
  type        = string
  default     = "shawnwz/context-name-card"
}

variable "s3_bucket_name" {
  description = "Existing S3 bucket used for identity head-image uploads (created outside Terraform). Only referenced here to scope the api task role's S3 policy."
  type        = string
  default     = "cm3070-contextual-identity-head-images"
}

variable "web_url" {
  description = "The canonical public URL for the web app. Used as AUTH_URL so Auth.js builds correct OAuth callback URLs, and matches what users actually reach — the custom domain (see cdn.tf), specifically www, not the bare apex, since contextid.app only 301s to www via GoDaddy forwarding and never actually reaches this app."
  type        = string
  default     = "https://www.contextid.app"
}

variable "web_origin_url" {
  description = "The contextid-web service's actual AWS-assigned URL (from `terraform output actual_urls` — it's a hash, not derived from service_name). This is CloudFront's origin in cdn.tf — deliberately a separate variable from web_url, which is the public-facing custom domain; pointing CloudFront's origin at web_url would be circular (CloudFront fronting itself)."
  type        = string
  default     = "https://co-f2332c4b2797480d98115e41e1153792.ecs.us-west-2.on.aws"
}

variable "api_url" {
  description = "The contextid-api service's actual AWS-assigned URL. Used as API_URL so web's server-side proxy can reach it."
  type        = string
  default     = "https://co-0b389e4000024b958f713a47138b3b77.ecs.us-west-2.on.aws"
}

variable "database_url" {
  description = "Postgres connection string (this project keeps using the existing Aiven Postgres, not RDS)."
  type        = string
  sensitive   = true
}

variable "auth_secret" {
  description = "Auth.js AUTH_SECRET."
  type        = string
  sensitive   = true
}

variable "auth_google_id" {
  type      = string
  sensitive = true
}

variable "auth_google_secret" {
  type      = string
  sensitive = true
}

variable "auth_github_id" {
  type      = string
  sensitive = true
}

variable "auth_github_secret" {
  type      = string
  sensitive = true
}

variable "auth_resend_key" {
  type      = string
  sensitive = true
}

variable "bootstrap_image" {
  description = <<-EOT
    Placeholder public image used only the very first time each Express
    service is created, before any real image has been pushed to ECR
    (ECS Express Mode requires an image to exist at creation time). CI/CD
    overwrites this with the real image on the first deploy, and Terraform
    is configured to ignore that drift afterwards.
  EOT
  type        = string
  default     = "public.ecr.aws/nginx/nginx:latest"
}
