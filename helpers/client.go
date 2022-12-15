package helpers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

type fieldValuesPayload struct {
	FieldValues []FieldValue `json:"field_values"`
}

type FieldValue struct {
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	Value     string `json:"value"`
}

type Client struct {
	Token string
}

func (c Client) SetCustomFieldValues(ctx context.Context, incidentID string, values ...FieldValue) error {
	payload := fieldValuesPayload{
		FieldValues: values,
	}

	url := fmt.Sprintf("https://api.pagerduty.com/incidents/%s/field_values", incidentID)

	buf := new(bytes.Buffer)
	err := json.NewEncoder(buf).Encode(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "PUT", url, buf)
	if err != nil {
		return err
	}

	req.Header.Add("Accept", "application/vnd.pagerduty+json;version=2")
	req.Header.Add("Authorization", fmt.Sprintf("Token token=%s", c.Token))
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("X-Early-Access", "flex-service-early-access")

	_, err = http.DefaultClient.Do(req)
	return err
}
