import fetchRetry, { RequestInitWithRetry } from 'fetch-retry';
import { Env } from './env';

class CustomFieldValue {
  name!: string;

  value: any;
}

export class ErrorWrapper {
  error?: ErrorContent;
}

export class ErrorContent {
  code?: number;

  message?: string;

  errors?: string[];
}

export async function setCustomFieldValues(env: Env, self: string, values: CustomFieldValue[]): Promise<Response> {
  const init: RequestInitWithRetry = {
    method: 'PUT',
    body: JSON.stringify({ custom_fields: values }),
    headers: {
      Accept: 'application/vnd.pagerduty+json;version=2',
      'Content-Type': 'application/json',
      'X-Early-Access': 'flex-service-early-access',
      Authorization: `Token token=${env.PD_API_KEY}`,
    },
    retries: 3,
    retryDelay: 1000,
    retryOn: [500, 429],
  };

  return fetchRetry(fetch)(`${self}/custom_fields/values`, init);
}
