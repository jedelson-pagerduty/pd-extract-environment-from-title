import { setCustomFieldValues } from "./client"
import { Env } from "./env"
import { verifySignature } from "./verifySignature"
import { WebhookEventPayload } from "./webhook_data"

const TYPE = 'incident.triggered'

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const method = request.method
		if (method !== 'POST') {
			return createInvalidError(`Unexpected method ${method}`)
		}

		if (!request.body) {
			return createInvalidError('No body received')
		}

		if (request.url.endsWith('/regex')) {
			return handleRegex(request, env)
		} else if (request.url.endsWith('/map')) {
			return handleMap(request, env)
		} else {
			return createInvalidError(`Unexpected url ${request.url}`)
		}
	},
}

async function handleRegex(request: Request, env: Env): Promise<Response> {
	const verified = await verifySignature(await request.clone().text(), env.PD_WEBHOOK_SECRET_REGEX, request.headers)
	if (!verified) {
		return createInvalidError('Signature did not match')
	}

	const payload = await request.json<WebhookEventPayload>()
	if (payload.event && payload.event.data && payload.event.data.id && payload.event.data.title) {
		if (payload.event.event_type !== TYPE) {
			return createInvalidError(`Wrong event type received. Was ${payload.event.event_type}`)
		}

		const regexes = env.EXTRACT_REGEXES.split(',')
		for (const r of regexes) {
			const match = payload.event!.data!.title!.match(r)
			if (match && match.length > 0) {
				const environment = match[1]

				await setCustomFieldValues(env, payload.event!.data!.id!, [{
					namespace: 'incidents',
					name: 'environment',
					value: environment
				}])

				return new Response(environment)
			}
		}
		return new Response('Did not match pattern')

	} else {
		return createInvalidError('Malformed payload')
	}

}

async function handleMap(request: Request, env: Env): Promise<Response> {
	const verified = await verifySignature(await request.clone().text(), env.PD_WEBHOOK_SECRET_MAP, request.headers)
	if (!verified) {
		return createInvalidError('Signature did not match')
	}

	const mapEnvironment = (s: string): string | undefined => {
		const mapping = env.MAPPINGS.split(',').map(m => m.split('=')).find(m => m[0] === s)
		if (mapping) {
			return mapping[1]
		}
		return undefined
	}


	const payload = await request.json<WebhookEventPayload>()
	if (payload.event && payload.event.data && payload.event.data.id && payload.event.data.title) {
		if (payload.event.event_type !== TYPE) {
			return createInvalidError(`Wrong event type received. Was ${payload.event.event_type}`)
		}

		const match = payload.event!.data!.title!.match(env.MAP_REGEX)
		if (match && match.length > 0) {
			const environment: string = match[1]
			const mapped = mapEnvironment(environment)
			if (mapped) {
				await setCustomFieldValues(env, payload.event!.data!.id!, [{
					namespace: 'incidents',
					name: 'environment',
					value: mapped
				}])
				return new Response(mapped)
			} else {
				return new Response(`Unmapped value ${environment}`)
			}
		}
		return new Response('Did not match pattern')

	} else {
		return createInvalidError('Malformed payload')
	}
}

function createInvalidError(msg: string): Response {
	console.log(msg)
	return new Response(msg, {
		status: 400,
		statusText: msg
	})
}




