output "web_url" {
  description = "The configured (var.web_url) URL — should match actual_urls.web once that variable is correctly set."
  value       = var.web_url
}

output "api_url" {
  description = "The configured (var.api_url) URL — should match actual_urls.api once that variable is correctly set."
  value       = var.api_url
}

output "actual_urls" {
  description = "The real, AWS-assigned URLs read back from the services themselves. If these don't match web_url/api_url above, update var.web_url/var.api_url in terraform.tfvars (or the defaults in variables.tf) and re-apply."
  value = {
    # ingress_paths[0].endpoint already includes the https:// scheme.
    web = aws_ecs_express_gateway_service.web.ingress_paths[0].endpoint
    api = aws_ecs_express_gateway_service.api.ingress_paths[0].endpoint
  }
}

output "ecr_web_repository_url" {
  value = aws_ecr_repository.web.repository_url
}

output "ecr_api_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "github_actions_deploy_role_arn" {
  description = "Set as the AWS_DEPLOY_ROLE_ARN GitHub Actions variable."
  value       = aws_iam_role.github_actions_deploy.arn
}

output "ecs_task_execution_role_arn" {
  value = aws_iam_role.ecs_task_execution.arn
}

output "ecs_express_infrastructure_role_arn" {
  value = aws_iam_role.ecs_express_infrastructure.arn
}

output "api_task_role_arn" {
  value = aws_iam_role.api_task.arn
}

output "github_actions_variables" {
  description = "Paste these into GitHub repo Settings -> Secrets and variables -> Actions -> Variables tab."
  value = {
    AWS_REGION                  = var.aws_region
    AWS_DEPLOY_ROLE_ARN         = aws_iam_role.github_actions_deploy.arn
    ECR_WEB_REPOSITORY          = aws_ecr_repository.web.repository_url
    ECR_API_REPOSITORY          = aws_ecr_repository.api.repository_url
    ECS_TASK_EXECUTION_ROLE_ARN = aws_iam_role.ecs_task_execution.arn
    ECS_INFRASTRUCTURE_ROLE_ARN = aws_iam_role.ecs_express_infrastructure.arn
    API_TASK_ROLE_ARN           = aws_iam_role.api_task.arn
    WEB_SERVICE_NAME            = aws_ecs_express_gateway_service.web.service_name
    API_SERVICE_NAME            = aws_ecs_express_gateway_service.api.service_name
  }
}
