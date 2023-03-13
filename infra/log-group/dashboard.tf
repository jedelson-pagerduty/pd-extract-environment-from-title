resource "aws_cloudwatch_dashboard" "events" {
  dashboard_name = "${var.event_source}-${var.environment}-example"

  dashboard_body = jsonencode({
    widgets = [
      {
        height = 6
        width  = 24
        y      = 21
        x      = 0
        type   = "log"
        properties = {
          query   = "SOURCE '${local.event_log_group_name}' | filter detail.error.error.code > 0\n| stats count(*) as errorCount by detail.error.error.code, detail.error.error.message"
          region  = var.aws_region
          stacked = false
          view    = "table"
        }
      },
      {
        height = 6
        width  = 24
        y      = 1
        x      = 0
        type   = "log"
        properties = {
          query   = "SOURCE '${local.event_log_group_name}' | stats count() by bin(1h)"
          region  = var.aws_region
          stacked = false
          title   = "Log group: ${local.event_log_group_name}"
          view    = "timeSeries"
        }
      },
      {
        height = 5
        width  = 7
        y      = 8
        x      = 0
        type   = "log"
        properties = {
          query   = "SOURCE '${local.event_log_group_name}' | stats count(*) by detail.success"
          region  = var.aws_region
          stacked = false
          title   = "Log group: ${local.event_log_group_name}"
          view    = "table"
        }
      },
      {
        height = 5
        width  = 10
        y      = 8
        x      = 7
        type   = "log"
        properties = {
          query   = "SOURCE '${local.event_log_group_name}' | filter detail.success == 1\n| stats count(*) by detail.serviceName"
          region  = var.aws_region
          stacked = false
          title   = "Log group: ${local.event_log_group_name}"
          view    = "table"
        }
      },
      {
        height = 6
        width  = 24
        y      = 14
        x      = 0
        type   = "log"
        properties = {
          query   = "SOURCE '${local.event_log_group_name}' | filter detail.error.error.message == \"Field Schema assigned to Service not found\"\n| stats count(*) as errorCount by detail.serviceName detail.environment"
          region  = var.aws_region
          stacked = false
          title   = "Log group: ${local.event_log_group_name}"
          view    = "table"
        }
      },
      {
        height = 1
        width  = 24
        y      = 0
        x      = 0
        type   = "text"
        properties = {
          markdown = "# All Requests"
        }
      },
      {
        height = 1
        width  = 7
        y      = 7
        x      = 0
        type   = "text"
        properties = {
          markdown = "# Results"
        }
      },
      {
        height = 1
        width  = 10
        y      = 7
        x      = 7
        type   = "text"
        properties = {
          markdown = "# Successes by Service"
        }
      },
      {
        height = 1
        width  = 24
        y      = 13
        x      = 0
        type   = "text"
        properties = {
          markdown = "# No Schema Assigned Errors by Service"
        }
      },
      {
        height = 1
        width  = 24
        y      = 20
        x      = 0
        type   = "text"
        properties = {
          markdown = "# Errors"
        }
      },
      {
        height = 5
        width  = 7
        y      = 8
        x      = 17
        type   = "log"
        properties = {
          query   = "SOURCE '${local.event_log_group_name}' | filter detail.success == 1\n| stats count(*) by detail.environment"
          region  = var.aws_region
          stacked = false
          title   = "Log group: ${local.event_log_group_name}"
          view    = "table"
        }
      },
      {
        height = 1
        width  = 7
        y      = 7
        x      = 17
        type   = "text"
        properties = {
          markdown = "# Successes by Environment"
        }
      }
    ]
  })
}
