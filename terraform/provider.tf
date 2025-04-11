terraform {
  required_version = ">= 1.8.0"
  backend "s3" {
    region = "ap-northeast-1"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.94.1"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
  default_tags {
    tags = {
      project = var.env.pj_name
      env     = var.env.name
    }
  }
}
