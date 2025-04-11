import { APIGatewayProxyResultV2, APIGatewayProxyEventV2 } from 'aws-lambda';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { BedrockResponseService } from './services/BedrockResponseService';
import { BedrockRepository } from './repositories/BedrockRepository';
import { BedrockClientMock } from './mock/BedrockClientMock';

const env = getEnv();
const bedrockClient = initBedrockClient(env);

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  if (!event.body) {
    return respondError(400, 1, 'Body is required');
  }
  const body = JSON.parse(event.body);
  if (!isValidBody(body)) {
    return respondError(400, 2, 'Invalid body');
  }

  const bedrockResponseService = new BedrockResponseService(
    new BedrockRepository(bedrockClient),
  );

  try {
    console.log(`userQuery: ${body.userQuery}, type: ${body.type}`);
    const bedrockResponse = await bedrockResponseService.get(
      body.userQuery,
      body.type,
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: bedrockResponse,
      }),
    };
  } catch (err) {
    console.error(err);
  }
  return respondError(500, 1, 'internal server error');
}

function getEnv(): Env {
  const requiredEnvVars = ['TARGET_ENV', 'TOKEN'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`${envVar} is not specified`);
      throw new Error('Environment variable is not defined');
    }
  }
  return {
    targetEnv: process.env.TARGET_ENV!,
    token: process.env.TOKEN!,
    isLocal: process.env.TARGET_ENV === 'local',
  };
}

function initBedrockClient(env: Env): BedrockRuntimeClient {
  if (env.isLocal) {
    return new BedrockClientMock() as unknown as BedrockRuntimeClient;
  }
  return new BedrockRuntimeClient({
    region: 'us-west-2',
  });
}

function respondError(
  statusCode: number,
  errorCode: number,
  errorMessage: string,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    body: JSON.stringify({
      errorCode,
      message: errorMessage,
    }),
  };
}

export const isValidBody = (param: unknown): param is RequestBody => {
  const body = param as RequestBody;

  if (!body) {
    console.error('body is undefined');
    return false;
  }
  if (body.userQuery === undefined || typeof body.userQuery !== 'string') {
    console.error('userQuery is invalid');
    return false;
  }
  if (body.type === undefined || typeof body.type !== 'string') {
    console.error('type is invalid');
    return false;
  }
  if (body.token === undefined || typeof body.token !== 'string') {
    console.error('token is invalid');
    return false;
  }
  if (body.token !== process.env.TOKEN) {
    console.error('token is invalid');
    return false;
  }
  return true;
};
