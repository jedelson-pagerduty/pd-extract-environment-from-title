import { ErrorWrapper, setCustomFieldValues } from './client';
import { Env } from './env';
import verifier from './verifySignature';
import { WebhookEventPayload } from './webhook_data';

const TYPE = 'incident.triggered';

function createInvalidError(msg: string): Response {
  console.log(msg);
  return new Response(msg, {
    status: 400,
    statusText: msg,
  });
}

async function handle(request: Request, env: Env): Promise<Response> {
  const mappings = env.MAPPINGS.split(',').map((m) => m.split('='));
  const mapEnvironment = (s: string): string | undefined => {
    const mapping = mappings.find((m) => m[0] === s);
    if (mapping) {
      return mapping[1];
    }
    return undefined;
  };

  const payload = await request.json<WebhookEventPayload>();
  if (payload.event && payload.event.data && payload.event.data.id && payload.event.data.title) {
    if (payload.event.event_type !== TYPE) {
      return createInvalidError(`Wrong event type received. Was ${payload.event.event_type}`);
    }

    const regexes = env.REGEXES.split(',');

    const match = regexes.map((regex) => payload.event!.data!.title!.match(regex)).find((m) => m && m.length > 0);

    if (match) {
      let environment = match[1];
      environment = mapEnvironment(environment) || environment;

      const setResponse = await setCustomFieldValues(env, payload.event!.data!.id!, [{
        namespace: 'incidents',
        name: 'environment',
        value: environment,
      }]);

      if (!setResponse.ok) {
        const error = await setResponse.json<ErrorWrapper>();
        const errorMsg = (error?.error?.errors && error.error.errors.length > 0) ? error.error.errors.join('; ') : error.error?.message;
        const msg = `could not set environment to ${environment}: ${errorMsg}`;
        console.log(msg);
        return new Response(msg);
      }
      return new Response(environment);
    }
    return new Response('Did not match any pattern');
  }
  return createInvalidError('Malformed payload');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { method } = request;
    if (method !== 'POST') {
      return createInvalidError(`Unexpected method ${method}`);
    }

    if (!request.body) {
      return createInvalidError('No body received');
    }

    const verified = await verifier.verifySignature(await request.clone().text(), env.PD_WEBHOOK_SECRET, request.headers);
    if (!verified) {
      return createInvalidError('Signature did not match');
    }

    return handle(request, env);
  },
};
