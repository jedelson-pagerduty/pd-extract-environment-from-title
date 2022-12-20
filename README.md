# PagerDuty - Extract Environment from Incident Title

This repository contains two webhooks, implemented as [CloudFlare Workers](https://workers.cloudflare.com/), which will extract an environment value from the incident title upon incident creation and store the value in a custom field named `environment`.

The two webhooks are:

1. `<baseurl>/regex` - extracts the value from the title using a list of regular expressions, defined in the `EXTRACT_REGEXES` environment variable.
2. `<baseurl>/map` - extracts the value from the title using a regular expression (the `MAP_REGEX` environment variable) and then maps that value using the `MAPPINGS` environment variable.

## Installation

1. Ensure that you have a Custom Field set up with the name `environment`, a Schema created containing that Field and that the Schema is assigned to the relevant Services in your PagerDuty account.
2. Create a read-write PagerDuty [REST API Key](https://support.pagerduty.com/docs/api-access-keys).
3. Create two webhooks, one with the URL `https://<baseurl>/regex` and one with the URL `https://<baseurl>/map`, e.g. `https://pd-extract-environment-from-title.yourname.workers.dev/regex` and `https://pd-extract-environment-from-title.yourname.workers.dev/map`. Make a note of **both** secrets.
4. Deploy the worker by running `npm run deploy:production`
5. Use wrangler to set these three secrets:

* `PD_API_KEY` - The REST API Key
* `PD_WEBHOOK_SECRET_MAP` - The secret for the "map" webhook
* `PD_WEBHOOK_SECRET_REGEX` - The secret for the "regex" webhook

For example:
```
$ wrangler secret put PD_API_KEY
```

Once done, `wrangler secret list` should show the following:

```
[
  {
    "name": "PD_API_KEY",
    "type": "secret_text"
  },
  {
    "name": "PD_WEBHOOK_SECRET_MAP",
    "type": "secret_text"
  },
  {
    "name": "PD_WEBHOOK_SECRET_REGEX",
    "type": "secret_text"
  }
]
```