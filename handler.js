"use strict";

const { api } = require('@pagerduty/pdjs')

const regex = /.*in (\w+) (in|\[)/

module.exports.extractTitle = async (event) => {
  const payload = JSON.parse(event.body)
  if (!payload.event) {
    console.error("payload was missing event")

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid payload received"
      })
    }
  }

  const eventType = payload.event.event_type
  if (eventType !== "incident.triggered") {
    console.error(`Wrong event type received. Was ${eventType}`)

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid payload received"
      })
    }
  }

  const incident = payload.event.data
  const id = incident.id
  const title = incident.title

  const matches = regex.exec(title)
  if (!matches) {
    console.error(`Title did not match regex: ${title}`)

    return {
      statusCode: 200,
      body: "unknown"
    }
  }

  const environment = matches[1]

  const pd = api({ token: process.env.PD_API_KEY })

  try {
    await pd.put(`/incidents/${id}/field_values`, {
      headers: {
        "X-Early-Access": "flex-service-early-access"
      },
      data: {
        field_values: [
          {
            namespace: "incidents",
            name: "environment",
            value: environment
          }
        ]
      }
    })
  } catch (e) {
    if (e.response) {
      return {
        statusCode: e.response.status,
        body: e.response.statusText
      }
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify(e)
      }
    }
  }

  return {
    statusCode: 200,
    body: environment
  }

}
