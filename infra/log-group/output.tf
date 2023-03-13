output "event_source_name" {
  value = local.event_source_name
}

output "event_log_group_arn" {
  value = aws_cloudwatch_log_group.logs.arn
}