# ─── GitHub Actions OIDC ────────────────────────────────────────────────────
# Lets GitHub Actions assume an AWS role using short-lived tokens instead of
# long-lived access keys stored as secrets.

data "tls_certificate" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github_actions.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Restrict to this repo. ":*" allows any ref (branches, tags, PRs) from
    # it — tighten to "repo:${var.github_repository}:ref:refs/tags/*" if you
    # want to *only* ever allow tag-triggered runs to assume this role.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:*"]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "${var.project_name}-github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
}

data "aws_iam_policy_document" "github_actions_permissions" {
  statement {
    sid       = "ECRAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "ECRPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = [
      aws_ecr_repository.web.arn,
      aws_ecr_repository.api.arn,
    ]
  }

  # aws-actions/amazon-ecs-deploy-express-service calls UpdateExpressGatewayService
  # (falling back to Create/RegisterTaskDefinition if the service doesn't exist
  # yet, which won't happen here since Terraform creates it first).
  statement {
    sid    = "ECSExpressDeploy"
    effect = "Allow"
    actions = [
      "ecs:CreateExpressGatewayService",
      "ecs:UpdateExpressGatewayService",
      "ecs:DescribeExpressGatewayService",
      "ecs:DescribeClusters",
      "ecs:DescribeServices",
      "ecs:ListServiceDeployments",
      "ecs:DescribeServiceDeployments",
      "ecs:RegisterTaskDefinition",
      "ecs:TagResource",
      "ecs:UntagResource",
    ]
    resources = ["*"] # several of these (e.g. RegisterTaskDefinition, DescribeClusters) don't support resource-level scoping
  }

  statement {
    sid     = "PassAppRoles"
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      aws_iam_role.ecs_task_execution.arn,
      aws_iam_role.ecs_express_infrastructure.arn,
      aws_iam_role.api_task.arn,
    ]
  }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name   = "${var.project_name}-deploy"
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.github_actions_permissions.json
}

# ─── ECS Express Mode roles ─────────────────────────────────────────────────
# Shared by both services. See:
# https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-getting-started.html

data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  # Project-scoped name (not the generic "ecsTaskExecutionRole") — this AWS
  # account already has a role by that name in use by an unrelated project.
  name               = "${var.project_name}-ecs-task-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "ecs_express_infrastructure_assume" {
  statement {
    sid     = "AllowAccessInfrastructureForECSExpressServices"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_express_infrastructure" {
  # Project-scoped name — same reasoning as ecs_task_execution above; this
  # account already has a role named ecsInfrastructureRoleForExpressServices.
  name               = "${var.project_name}-ecs-express-infra"
  assume_role_policy = data.aws_iam_policy_document.ecs_express_infrastructure_assume.json
}

resource "aws_iam_role_policy_attachment" "ecs_express_infrastructure" {
  role       = aws_iam_role.ecs_express_infrastructure.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSInfrastructureRoleforExpressGatewayServices"
}

# ─── api task role ───────────────────────────────────────────────────────────
# Runtime permissions for the api container itself (S3 head-image uploads).
# The AWS SDK in apps/api already uses the default credential provider chain
# (no static keys passed to S3Client), so it picks this up automatically —
# no application code change needed.

resource "aws_iam_role" "api_task" {
  name               = "${var.project_name}-api-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

data "aws_iam_policy_document" "api_task_permissions" {
  statement {
    sid       = "IdentityHeadImageUploads"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = ["arn:aws:s3:::${var.s3_bucket_name}/*"]
  }
}

resource "aws_iam_role_policy" "api_task" {
  name   = "${var.project_name}-api-task-s3"
  role   = aws_iam_role.api_task.id
  policy = data.aws_iam_policy_document.api_task_permissions.json
}
