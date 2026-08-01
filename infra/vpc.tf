# ECS Express Mode needs a VPC with public subnets to place its ALB in.
# This account has no default VPC (it has other, unrelated VPCs from other
# projects). aws_default_vpc/aws_default_subnet either adopt the account's
# default VPC if one exists, or create it if it doesn't — same thing you'd
# get from `aws ec2 create-default-vpc`, just declared here instead of run
# as a one-off CLI command.

resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}

resource "aws_default_subnet" "a" {
  availability_zone = "${var.aws_region}a"

  # Creating a default VPC auto-creates a default subnet in every AZ as
  # part of that same operation — without this, Terraform runs these in
  # parallel with aws_default_vpc and hits a race (subnet created before
  # the VPC exists, or after AWS already auto-created it).
  depends_on = [aws_default_vpc.default]
}

resource "aws_default_subnet" "b" {
  availability_zone = "${var.aws_region}b"
  depends_on        = [aws_default_vpc.default]
}
