/* eslint-disable max-classes-per-file */
export class WebhookEventPayload {
  event: WebhookEvent | undefined;
}

export class WebhookEvent {
  event_type!: string;

  data!: WebhookData;
}

export class WebhookData {
  id!: string;

  self!: string;

  title!: string;

  service!: ServiceReference;
}

export class ServiceReference {
  id!: string;

  summary!: string;
}
