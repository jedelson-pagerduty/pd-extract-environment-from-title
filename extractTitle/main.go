package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type WebhookEventPayload struct {
	Event WebhookEvent `json:"event"`
}

type WebhookEvent struct {
	Type string `json:"event_type"`
	Data Data   `json:"data"`
}

type Data struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type FieldValuesPayload struct {
	FieldValues []FieldValue `json:"field_values"`
}

type FieldValue struct {
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	Value     string `json:"value"`
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	token := os.Getenv("PD_API_KEY")

	rex := regexp.MustCompile(".*in (\\w+) (in|\\[)")

	payload := WebhookEventPayload{}

	err := json.Unmarshal([]byte(request.Body), &payload)
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

	requestPayload := FieldValuesPayload{
		FieldValues: []FieldValue{
			{
				Namespace: "incidents",
				Name:      "environment",
				Value:     environment,
			},
		},
	}

	url := fmt.Sprintf("https://api.pagerduty.com/incidents/%s/field_values", payload.Event.Data.ID)

	err = put(ctx, url, token, &requestPayload)
	if err != nil {
		log.Printf("error in put")
		return events.APIGatewayProxyResponse{Body: err.Error(), StatusCode: 500}, nil
	}

	return events.APIGatewayProxyResponse{
		Body:       environment,
		StatusCode: 200,
	}, nil
}

func put(ctx context.Context, url, token string, payload *FieldValuesPayload) error {
	var buf io.ReadWriter
	if payload != nil {
		buf = new(bytes.Buffer)
		err := json.NewEncoder(buf).Encode(payload)
		if err != nil {
			return err
		}
	}

	req, err := http.NewRequestWithContext(ctx, "PUT", url, buf)
	if err != nil {
		return err
	}

	req.Header.Add("Accept", "application/vnd.pagerduty+json;version=2")
	req.Header.Add("Authorization", fmt.Sprintf("Token token=%s", token))
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("X-Early-Access", "flex-service-early-access")

	_, err = http.DefaultClient.Do(req)
	return err
}

func main() {
	lambda.Start(Handler)
}
