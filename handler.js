"use strict";

const { api } = require('@pagerduty/pdjs')

const regex = /.*in (\w+) \[/;

module.exports.extractTitle = async (event) => {
  const payload = JSON.parse(event.body)
  if (payload.event && payload.event.event_type === "incident.triggered") {
    const incident = payload.event.data
    const id = incident.id
    const title = incident.title

    const matches = regex.exec(title)
    if (matches) {
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

  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Invalid payload received"
    })
  }
}
