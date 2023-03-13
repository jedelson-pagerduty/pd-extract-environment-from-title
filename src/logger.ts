import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { ErrorWrapper } from './client';
import { Env } from './env';

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
  async log(env: Env, obj: LogEvent): Promise<void> {
    if (env.ENABLE_EVENT_LOGGING !== 'true') {
      console.log('event logging disabled');
      return;
    }

    const params = {
      Entries: [
        {
          Detail: JSON.stringify(obj),
          DetailType: 'extract-environment-from-title-webhook',
          Source: env.EVENT_SOURCE,
          EventBusName: env.EVENT_BUS_NAME,
        },
      ],
    };

    try {
      const ebClient = new EventBridgeClient({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });
      const data = await ebClient.send(new PutEventsCommand(params));
      console.log('Success, event sent; requestID:', data);
    } catch (err) {
      console.log('Error', err);
    }
  },
};
