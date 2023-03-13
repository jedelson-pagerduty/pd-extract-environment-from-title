locals {
  event_source_name    = "${var.event_source}.${var.environment}"
  event_log_group_name = "/aws/events/${local.event_source_name}"
}

resource "aws_cloudwatch_log_group" "logs" {
  name              = local.event_log_group_name
  retention_in_days = var.log_retention_in_days
  tags = {
    "Name" = var.tag
  }
}
