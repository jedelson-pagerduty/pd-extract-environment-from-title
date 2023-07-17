import { ErrorWrapper, setCustomFieldValues } from "./client";
import { Environment } from "./environment";
import logger, { LogEvent } from "./logger";
import verifier from "./verify-signature";
import { WebhookEventPayload } from "./webhook-data";

const TEST_TYPE = "pagey.ping";
const TYPE = "incident.triggered";

function createInvalidError(message: string): Response {
  console.log(message);
  return new Response(message, {
    status: 400,
    statusText: message,
  });
}

async function handle(
  request: Request,
  environment_: Environment,
  context: ExecutionContext,
): Promise<Response> {
  const mappings = environment_.MAPPINGS.split(",").map((m) => m.split("="));
  const mapEnvironment = (s: string): string | undefined => {
    const mapping = mappings.find((m) => m[0] === s);
    if (mapping) {
      return mapping[1];
    }
    return undefined;
  };

  const payload = await request.json<WebhookEventPayload>();
  if (payload.event && payload.event.event_type === TEST_TYPE) {
    return new Response(undefined, {
      status: 200,
    });
  }

  if (
    payload.event &&
    payload.event.data &&
    payload.event.data.id &&
    payload.event.data.title
  ) {
    if (payload.event.event_type !== TYPE) {
      return createInvalidError(
        `Wrong event type received. Was ${payload.event.event_type}`,
      );
    }

    const incidentId = payload.event.data.id;
    const incidentTitle = payload.event.data.title;

    const logDetail: LogEvent = {
      incidentId,
      serviceId: payload.event.data.service.id,
      serviceName: payload.event.data.service.summary,
      incidentTitle,
    };

    const regexes = environment_.REGEXES.split(",");

    const match = regexes
      .map((regex) => incidentTitle.match(regex))
      .find((m) => m && m.length > 0);

    if (match) {
      let environment = match[1].toLowerCase();
      environment = mapEnvironment(environment) || environment;

      logDetail.environment = environment;

      console.log(
        `Attempting to set environment for ${incidentId} to ${environment}`,
      );

      const setResponse = await setCustomFieldValues(
        environment_,
        payload.event.data.self,
        [
          {
            name: "environment",
            value: environment,
          },
        ],
      );

      if (!setResponse.ok) {
        const error = await setResponse.json<ErrorWrapper>();

        logDetail.error = error;

        const errorMessage =
          error?.error?.errors && error.error.errors.length > 0
            ? error.error.errors.join("; ")
            : error.error?.message;
        const message = `could not set environment to ${environment}: ${errorMessage}`;
        console.log(message);

        logDetail.success = false;
        context.waitUntil(logger.log(environment_, logDetail));

        return new Response(message);
      }

      logDetail.success = true;
      context.waitUntil(logger.log(environment_, logDetail));
      return new Response(environment);
    }

    logDetail.success = false;
    logDetail.error = {
      error: {
        code: 404,
        message: "did not match any pattern",
      },
    };
    context.waitUntil(logger.log(environment_, logDetail));
    return new Response("Did not match any pattern");
  }
  return createInvalidError("Malformed payload");
}

export default {
  async fetch(
    request: Request,
    environment: Environment,
    context: ExecutionContext,
  ): Promise<Response> {
    const { method, body, headers } = request;
    if (method !== "POST") {
      return createInvalidError(`Unexpected method ${method}`);
    }

    if (!body) {
      return createInvalidError("No body received");
    }

    const verified = await verifier.verifySignature(
      await request.clone().text(),
      environment.PD_WEBHOOK_SECRET,
      headers,
    );
    if (!verified) {
      return createInvalidError("Signature did not match");
    }

    return handle(request, environment, context);
  },
};
