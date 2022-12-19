package main

import (
	"context"
	"encoding/json"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jedelson-pagerduty/pd-extract-environment-from-title/helpers"
	"log"
	"os"
	"regexp"
	"strings"
)

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	token := os.Getenv("PD_API_KEY")
	c := helpers.Client{Token: token}

	secret := os.Getenv("PD_WEBHOOK_SECRET_MAP")

	rex := regexp.MustCompile(os.Getenv("MAP_REGEX"))

	err := helpers.VerifySignature(request.Headers, request.Body, secret)
	if err != nil {
		return events.APIGatewayProxyResponse{Body: err.Error(), StatusCode: 400}, nil
	}

	payload := helpers.WebhookEventPayload{}

	err = json.Unmarshal([]byte(request.Body), &payload)
	if err != nil {
		log.Printf("body could not be unmarshalled")
		return events.APIGatewayProxyResponse{Body: err.Error(), StatusCode: 404}, nil
	}

	if payload.Event.Type != "incident.triggered" {
		log.Printf("wrong error type received. Was %s", payload.Event.Type)
		return events.APIGatewayProxyResponse{Body: err.Error(), StatusCode: 400}, nil
	}

	match := rex.FindStringSubmatch(payload.Event.Data.Title)
	if match == nil {
		log.Printf("Title did not match regex: %s", payload.Event.Data.Title)

		return events.APIGatewayProxyResponse{Body: "unknown", StatusCode: 200}, nil
	}

	environment := match[1]
	mapped := mapEnvironment(environment)
	if mapped == nil {
		log.Printf("Unknown environment %s", environment)
		return events.APIGatewayProxyResponse{Body: "unknown environment", StatusCode: 200}, nil
	}

	err = c.SetCustomFieldValues(ctx, payload.Event.Data.ID, helpers.FieldValue{
		Namespace: "incidents",
		Name:      "environment",
		Value:     *mapped,
	})

	if err != nil {
		log.Printf("error in setting environment")
		return events.APIGatewayProxyResponse{Body: err.Error(), StatusCode: 500}, nil
	}

	return events.APIGatewayProxyResponse{
		Body:       *mapped,
		StatusCode: 200,
	}, nil
}

func mapEnvironment(environment string) *string {
	mapping := os.Getenv("MAPPING")
	for _, one := range strings.Split(mapping, ",") {
		parts := strings.Split(one, "=")
		if environment == parts[0] {
			return &parts[1]
		}
	}
	return nil
}

func main() {
	lambda.Start(Handler)
}
