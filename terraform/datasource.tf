data "aws_caller_identity" "myself" {}
data "aws_region" "current" {}

# Lambda Code
data "aws_s3_object" "alexa_bedrock_responder" {
  bucket = var.alexa_bedrock_responder.s3_bucket
  key    = var.alexa_bedrock_responder.s3_key
}
