package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"regexp"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jedelson-pagerduty/pd-extract-environment-from-title/helpers"
)

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	token := os.Getenv("PD_API_KEY")
	c := helpers.Client{Token: token}

	regexes := os.Getenv("EXTRACT_REGEXES")
	regexSlice := strings.Split(regexes, ",")

	payload := helpers.WebhookEventPayload{}

	err := json.Unmarshal([]byte(request.Body), &payload)
	if err != nil {
		log.Printf("body could not be unmarshalled")
		return events.APIGatewayProxyResponse{Body: err.Error(), StatusCode: 404}, nil
	}

	if payload.Event.Type != "incident.triggered" {
		log.Printf("wrong error type received. Was %s", payload.Event.Type)
		return events.APIGatewayProxyResponse{Body: err.Error(), StatusCode: 400}, nil
	}

	for _, regexStr := range regexSlice {
		rex := regexp.MustCompile(regexStr)
		match := rex.FindStringSubmatch(payload.Event.Data.Title)

		if match != nil {

			environment := match[1]

			err = c.SetCustomFieldValues(ctx, payload.Event.Data.ID, helpers.FieldValue{
				Namespace: "incidents",
				Name:      "environment",
				Value:     environment,
			})

			if err != nil {
				log.Printf("error in setting environment")
				return events.APIGatewayProxyResponse{Body: err.Error(), StatusCode: 500}, nil
			}

			return events.APIGatewayProxyResponse{
				Body:       environment,
				StatusCode: 200,
			}, nil
		}
	}

	log.Printf("Title did not match any of the configured regex: %s", payload.Event.Data.Title)

	return events.APIGatewayProxyResponse{Body: "unknown pattern", StatusCode: 200}, nil
}

func main() {
	lambda.Start(Handler)
}
