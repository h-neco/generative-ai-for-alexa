variable "env" {
  description = "Environment details"
  type = object({
    name    = string
    pj_name = string
  })
}

variable "alexa_bedrock_responder" {
  description = "Configuration for the Alexa Bedrock Responder lambda"
  type = object({
    memory_size   = number
    function_name = string
    handler       = string
    runtime       = string
    timeout       = number
    s3_bucket     = string
    s3_key        = string
    token         = string
  })
}
