terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Local state for now — fine for a single-developer project. If this ever
  # needs to be applied from CI or shared with collaborators, switch to an
  # S3 backend (with a DynamoDB table for locking) so state isn't only on
  # one machine:
  #
  # backend "s3" {
  #   bucket = "<some-bucket-you-create-first>"
  #   key    = "contextid/terraform.tfstate"
  #   region = "us-west-2"
  # }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  # Belt-and-suspenders: refuses to run at all if the profile above somehow
  # resolves to a different AWS account than expected.
  allowed_account_ids = [var.aws_account_id]
}
