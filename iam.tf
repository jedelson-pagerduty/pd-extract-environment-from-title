resource "aws_iam_user" "events" {
  name = var.event_source
}

resource "aws_iam_access_key" "events" {
  user = aws_iam_user.events.name
}

resource "aws_iam_user_policy" "events" {
  name = "write-events"
  user = aws_iam_user.events.name

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : "events:PutEvents",
        "Resource" : "${module.eventbridge.eventbridge_bus_arn}"
      }
    ]
  })
}