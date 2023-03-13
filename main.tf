terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.58.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  tag = var.event_source
}

module "log_groups" {
  for_each = toset(["dev", "prod"])
  source   = "./infra/log-group"

  environment           = each.key
  event_source          = var.event_source
  log_retention_in_days = var.log_retention_in_days
  tag                   = local.tag
  aws_region            = var.aws_region
}

module "eventbridge" {
  source = "terraform-aws-modules/eventbridge/aws"

  bus_name = var.event_source

  attach_cloudwatch_policy = true
  cloudwatch_target_arns   = [module.log_groups["dev"].event_log_group_arn, module.log_groups["prod"].event_log_group_arn]

  attach_sqs_policy = true
  sqs_target_arns = [
    aws_sqs_queue.dlq.arn
  ]

  tags = {
    Name = local.tag
  }

  rules = {
    dev = {
      description = "dev logs"
      event_pattern = jsonencode({ "source" : [{
        "prefix" : module.log_groups["dev"].event_source_name
      }] })
    }
    prod = {
      description = "prod logs"
      event_pattern = jsonencode({ "source" : [{
        "prefix" : module.log_groups["prod"].event_source_name
      }] })
    }
  }

  targets = {
    dev = [
      {
        name            = "send-logs-to-cloudwatch-dev"
        arn             = module.log_groups["dev"].event_log_group_arn,
        dead_letter_arn = aws_sqs_queue.dlq.arn
      }
    ]
    prod = [
      {
        name = "send-logs-to-cloudwatch-prod"
        arn  = module.log_groups["prod"].event_log_group_arn,
        dead_letter_arn = aws_sqs_queue.dlq.arn
      }
    ]
  }
}

data "aws_iam_policy_document" "eventbridge" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream"
    ]

    resources = [
      "${module.log_groups["dev"].event_log_group_arn}:*",
      "${module.log_groups["prod"].event_log_group_arn}:*"
    ]

    principals {
      type = "Service"
      identifiers = [
        "events.amazonaws.com"
      ]
    }
  }
  statement {
    effect = "Allow"
    actions = [
      "logs:PutLogEvents"
    ]

    resources = [
      "${module.log_groups["dev"].event_log_group_arn}:*:*",
      "${module.log_groups["prod"].event_log_group_arn}:*:*"
    ]

    principals {
      type = "Service"
      identifiers = [
        "events.amazonaws.com"
      ]
    }
  }
}

resource "aws_cloudwatch_log_resource_policy" "eventbridge" {
  policy_document = data.aws_iam_policy_document.eventbridge.json
  policy_name     = "${var.event_source}-resource-policy"
}

resource "aws_sqs_queue" "dlq" {
  name = "${var.event_source}-dlq"

  tags = {
    Name = local.tag
  }
}
