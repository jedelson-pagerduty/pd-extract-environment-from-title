import { Env } from "./env"

class CustomFieldValue {
	namespace!: string
	name!: string
	value: any
}

export class ErrorWrapper {
	error?: ErrorContent
}

export class ErrorContent {
	code?: number
	message?: string
	errors?: string[]
}

export async function setCustomFieldValues(env: Env, incidentId: string, values: CustomFieldValue[]): Promise<Response> {
	const init: RequestInit<RequestInitCfProperties> = {
		method: 'PUT',
		body: JSON.stringify({ field_values: values }),
    headers: {
      Accept: 'application/vnd.pagerduty+json;version=2',
      'Content-Type': 'application/json',
      'X-Early-Access': 'flex-service-early-access',
      Authorization: `Token token=${env.PD_API_KEY}`
    }
	}

	return await fetch(`https://api.pagerduty.com/incidents/${incidentId}/field_values`, init)
}