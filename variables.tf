variable "aws_region" {
  type = string
}

variable "event_source" {
  type = string
}

variable "log_retention_in_days" {
  type    = number
  default = 14
}
