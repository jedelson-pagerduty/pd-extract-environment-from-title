import fetchRetry, { RequestInitWithRetry } from "fetch-retry";
import { Environment } from "./environment";

type CustomFieldValue = {
  name: string;
  value: string;
};

export class ErrorWrapper {
  error?: ErrorContent;
}

export class ErrorContent {
  code?: number;

  message?: string;

  errors?: string[];
}

export async function setCustomFieldValues(
  environment: Environment,
  self: string,
  values: CustomFieldValue[],
): Promise<Response> {
  const init: RequestInitWithRetry = {
    method: "PUT",
    body: JSON.stringify({ custom_fields: values }),
    headers: {
      Accept: "application/vnd.pagerduty+json;version=2",
      "Content-Type": "application/json",
      "X-Early-Access": "flex-service-early-access",
      Authorization: `Token token=${environment.PD_API_KEY}`,
    },
    retries: 3,
    retryDelay: 1000,
    retryOn: [500, 429],
  };

  return fetchRetry(fetch)(`${self}/custom_fields/values`, init);
}
