#!/bin/sh

VAR=`terraform output -raw aws_region`
wrangler secret put AWS_REGION --env dev <<< $VAR

VAR=`terraform output -raw event_access_key`
wrangler secret put AWS_ACCESS_KEY_ID --env dev <<< $VAR

VAR=`terraform output -raw event_secret_key`
wrangler secret put AWS_SECRET_ACCESS_KEY --env dev <<< $VAR

VAR=`terraform output -raw event_source_name_dev`
wrangler secret put EVENT_SOURCE --env dev <<< $VAR

VAR=`terraform output -raw event_bus_arn`
wrangler secret put EVENT_BUS_NAME --env dev <<< $VAR

wrangler secret put ENABLE_EVENT_LOGGING --env dev <<< "true"