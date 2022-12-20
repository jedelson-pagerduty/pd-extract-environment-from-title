export class WebhookEventPayload {
	event: WebhookEvent | undefined
}

export class WebhookEvent {
	event_type: string | undefined
	data: WebhookData | undefined
}

export class WebhookData {
	id: string | undefined
	title: string | undefined
}