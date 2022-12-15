package helpers

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
