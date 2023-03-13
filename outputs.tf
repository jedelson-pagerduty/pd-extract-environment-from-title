output "aws_region" {
  value = var.aws_region
}

output "event_bus_arn" {
  value = module.eventbridge.eventbridge_bus_arn
}

output "event_access_key" {
  value = aws_iam_access_key.events.id
}

output "event_secret_key" {
  value     = aws_iam_access_key.events.secret
  sensitive = true
}

output "event_source_name_dev" {
  value = module.log_groups["dev"].event_source_name
}

output "event_source_name_prod" {
  value = module.log_groups["prod"].event_source_name
}
