import {
  InvokeModelCommand,
  InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';

export class BedrockClientMock {
  async send(_: InvokeModelCommand): Promise<InvokeModelCommandOutput> {
    const body = JSON.stringify({
      completions: [
        {
          data: {
            prompt: 'prompt',
          },
        },
      ],
    });

    return {
      body: {
        transformToString: async () => body,
      } as any,
      contentType: 'application/json',
      $metadata: {
        httpStatusCode: 200,
      },
    } as InvokeModelCommandOutput;
  }
}
