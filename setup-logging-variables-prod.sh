#!/bin/sh

VAR=`terraform output -raw aws_region`
wrangler secret put AWS_REGION <<< $VAR

VAR=`terraform output -raw event_access_key`
wrangler secret put AWS_ACCESS_KEY_ID <<< $VAR

VAR=`terraform output -raw event_secret_key`
wrangler secret put AWS_SECRET_ACCESS_KEY <<< $VAR

VAR=`terraform output -raw event_source_name_prod`
wrangler secret put EVENT_SOURCE <<< $VAR

VAR=`terraform output -raw event_bus_arn`
wrangler secret put EVENT_BUS_NAME <<< $VAR

wrangler secret put ENABLE_EVENT_LOGGING <<< "true"