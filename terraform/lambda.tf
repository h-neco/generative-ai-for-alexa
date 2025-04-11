resource "aws_lambda_function_url" "alexa_bedrock_responder" {
  function_name      = aws_lambda_function.alexa_bedrock_responder.function_name
  authorization_type = "NONE"
}

resource "aws_lambda_function" "alexa_bedrock_responder" {
  function_name     = "${var.alexa_bedrock_responder.function_name}_${var.env.name}"
  handler           = var.alexa_bedrock_responder.handler
  runtime           = var.alexa_bedrock_responder.runtime
  memory_size       = var.alexa_bedrock_responder.memory_size
  timeout           = var.alexa_bedrock_responder.timeout
  architectures     = ["arm64"]
  s3_bucket         = data.aws_s3_object.alexa_bedrock_responder.bucket
  s3_key            = data.aws_s3_object.alexa_bedrock_responder.key
  s3_object_version = data.aws_s3_object.alexa_bedrock_responder.version_id
  role              = aws_iam_role.alexa_bedrock_responder_role.arn
  environment {
    variables = {
      TARGET_ENV = var.env.name,
      TOKEN      = var.alexa_bedrock_responder.token
    }
  }
  tags = {
    Name = var.alexa_bedrock_responder.function_name
  }
}

resource "aws_cloudwatch_log_group" "alexa_bedrock_responder" {
  name              = "/aws/lambda/${var.env.pj_name}-${var.env.name}"
  retention_in_days = 1
}

# assumeRole
data "aws_iam_policy_document" "assume_role_lambda_api" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "alexa_bedrock_responder_role" {
  name               = "${var.alexa_bedrock_responder.function_name}-${var.env.name}-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_lambda_api.json
}

# bedrock
data "aws_iam_policy_document" "generate_prompt_lambda_bedrock" {
  statement {
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "alexa_bedrock_responder_bedrock_policy" {
  name   = "${var.alexa_bedrock_responder.function_name}-${var.env.name}-bedrock-policy"
  policy = data.aws_iam_policy_document.generate_prompt_lambda_bedrock.json
}

resource "aws_iam_role_policy_attachment" "alexa_bedrock_responder_bedrock_policys" {
  role       = aws_iam_role.alexa_bedrock_responder_role.name
  policy_arn = aws_iam_policy.alexa_bedrock_responder_bedrock_policy.arn
}

# basic execution
resource "aws_iam_role_policy_attachment" "generate_prompt_lambda_basic_execution" {
  role       = aws_iam_role.alexa_bedrock_responder_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
