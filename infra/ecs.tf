# ECS Express Mode gives us the same "just a URL, HTTPS included" simplicity
# App Runner used to offer — App Runner is closed to new customers as of
# late 2025, so this is AWS's own recommended replacement. Each service gets
# its own ALB + Fargate service + auto scaling, and a default URL with
# AWS-managed TLS, no domain or ACM certificate required.
#
# That URL is NOT "<service_name>.ecs.<region>.on.aws" (an earlier version of
# this file assumed that from a loose reading of AWS's docs — wrong). It's a
# hash AWS assigns at creation time, e.g.
# "co-f2332c4b2797480d98115e41e1153792.ecs.us-west-2.on.aws", only knowable
# after the service exists — and unusable here anyway, since a service can't
# reference its own computed output in its own resource block (both web_url
# and api_url are needed as env vars *on* these two resources). So they're
# plain variables instead: apply once with placeholder defaults, read the
# real endpoints with `terraform output actual_urls`, then update
# terraform.tfvars (or the defaults below) and apply again.
#
# Terraform owns the shape of these services (roles, sizing, health checks,
# env vars). The image is deliberately excluded from that — CI/CD swaps it
# on every tag push via `aws-actions/amazon-ecs-deploy-express-service`, and
# `ignore_changes` here stops a later `terraform apply` from reverting that
# back to the bootstrap placeholder.

locals {
  s3_public_base_url = "https://${var.s3_bucket_name}.s3.${var.aws_region}.amazonaws.com"
}

resource "aws_ecs_express_gateway_service" "api" {
  service_name            = "${var.project_name}-api"
  execution_role_arn      = aws_iam_role.ecs_task_execution.arn
  infrastructure_role_arn = aws_iam_role.ecs_express_infrastructure.arn
  task_role_arn           = aws_iam_role.api_task.arn
  health_check_path       = "/health"
  cpu                     = "512"
  memory                  = "1024"

  # Skip waiting for the bootstrap placeholder to pass health checks — it
  # won't (it's not the real app). CI's first deploy supersedes it quickly.
  wait_for_steady_state = false

  primary_container {
    image          = var.bootstrap_image
    container_port = 4000

    environment {
      name  = "DATABASE_URL"
      value = var.database_url
    }
    environment {
      name  = "AWS_REGION"
      value = var.aws_region
    }
    environment {
      name  = "S3_BUCKET_NAME"
      value = var.s3_bucket_name
    }
    environment {
      name  = "S3_PUBLIC_BASE_URL"
      value = local.s3_public_base_url
    }
  }

  network_configuration {
    subnets = [aws_default_subnet.a.id, aws_default_subnet.b.id]
  }

  scaling_target {
    min_task_count            = 1
    max_task_count            = 2
    auto_scaling_metric       = "AVERAGE_CPU"
    auto_scaling_target_value = 70
  }

  lifecycle {
    ignore_changes = [primary_container[0].image]
  }

  depends_on = [
    aws_iam_role_policy_attachment.ecs_task_execution,
    aws_iam_role_policy_attachment.ecs_express_infrastructure,
    aws_iam_role_policy.api_task,
  ]
}

resource "aws_ecs_express_gateway_service" "web" {
  service_name            = "${var.project_name}-web"
  execution_role_arn      = aws_iam_role.ecs_task_execution.arn
  infrastructure_role_arn = aws_iam_role.ecs_express_infrastructure.arn
  health_check_path       = "/"
  cpu                     = "512"
  memory                  = "1024"
  wait_for_steady_state   = false

  primary_container {
    image          = var.bootstrap_image
    container_port = 3000

    environment {
      name  = "DATABASE_URL"
      value = var.database_url
    }
    environment {
      name  = "API_URL"
      value = var.api_url
    }
    environment {
      # Pins the canonical URL Auth.js uses for OAuth callbacks — see
      # apps/web/auth.ts (trustHost) for why this matters.
      name  = "AUTH_URL"
      value = var.web_url
    }
    environment {
      name  = "AUTH_SECRET"
      value = var.auth_secret
    }
    environment {
      name  = "AUTH_GOOGLE_ID"
      value = var.auth_google_id
    }
    environment {
      name  = "AUTH_GOOGLE_SECRET"
      value = var.auth_google_secret
    }
    environment {
      name  = "AUTH_GITHUB_ID"
      value = var.auth_github_id
    }
    environment {
      name  = "AUTH_GITHUB_SECRET"
      value = var.auth_github_secret
    }
    environment {
      name  = "AUTH_RESEND_KEY"
      value = var.auth_resend_key
    }
  }

  network_configuration {
    subnets = [aws_default_subnet.a.id, aws_default_subnet.b.id]
  }

  scaling_target {
    min_task_count            = 1
    max_task_count            = 2
    auto_scaling_metric       = "AVERAGE_CPU"
    auto_scaling_target_value = 70
  }

  lifecycle {
    ignore_changes = [primary_container[0].image]
  }

  depends_on = [
    aws_iam_role_policy_attachment.ecs_task_execution,
    aws_iam_role_policy_attachment.ecs_express_infrastructure,
  ]
}
