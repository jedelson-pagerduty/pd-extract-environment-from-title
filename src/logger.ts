import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { ErrorWrapper } from "./client";
import { Environment } from "./environment";

export interface LogEvent {
  incidentId: string;
  error?: ErrorWrapper;
  environment?: string;
  success?: boolean;
  serviceId: string;
  serviceName: string;
  incidentTitle: string;
}

export default {
  async log(environment: Environment, event: LogEvent): Promise<void> {
    if (environment.ENABLE_EVENT_LOGGING !== "true") {
      console.log("event logging disabled");
      return;
    }

    const parameters = {
      Entries: [
        {
          Detail: JSON.stringify(event),
          DetailType: "extract-environment-from-title-webhook",
          Source: environment.EVENT_SOURCE,
          EventBusName: environment.EVENT_BUS_NAME,
        },
      ],
    };

    try {
      const ebClient = new EventBridgeClient({
        region: environment.AWS_REGION,
        credentials: {
          accessKeyId: environment.AWS_ACCESS_KEY_ID,
          secretAccessKey: environment.AWS_SECRET_ACCESS_KEY,
        },
      });
      const data = await ebClient.send(new PutEventsCommand(parameters));
      console.log("Success, event sent; requestID:", data);
    } catch (error) {
      console.log("Error", error);
    }
  },
};
