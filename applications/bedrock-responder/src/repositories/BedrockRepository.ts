import {
  BedrockRuntimeClient,
  ConverseCommand,
  ToolSpecification,
  ConverseCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

export class BedrockRepository {
  constructor(private readonly client: BedrockRuntimeClient) {}

  async generate(
    userQuery: string,
    prompt: string,
    model: string,
  ): Promise<BedrockResponse> {
    const bodyJson = this.createRequestBody(userQuery, prompt);
    const params = this.createCommandParams(bodyJson, model);
    try {
      const result = await this.converse(params);
      console.log(
        JSON.stringify({
          level: 'INFO',
          message: `Generate Prompt : ${JSON.stringify(result)}`,
        }),
      );
      return result;
    } catch (error: any) {
      console.error(`Generate error: ${error}`);
      if (error.response && error.response.data) {
        console.error('Error response data:', error.response.data);
      }
      throw new Error(`Generate error: ${error}`);
    }
  }

  private createRequestBody(userQuery: string, prompt: string): BedrockRequest {
    return {
      toolSpec: {
        name: 'moderate_and_genetate_prompt',
        description: prompt,
        inputSchema: {
          json: {
            type: 'object',
            properties: {
              moderationResult: {
                type: 'boolean',
                description:
                  '不適切な入力の場合はfalse、適切な入力の場合はtrueを設定する',
              },
              moderationError: {
                type: 'string',
                description:
                  '不適切な入力だった場合、なぜそれが不適切なのかを説明する',
              },
              prompt: {
                type: 'string',
                description: 'プロンプトを設定する',
              },
            },
            required: ['moderationResult'],
          },
        },
      },
      prompt: `<入力文章>${userQuery}</入力文章>
moderate_and_genetate_promptツールのみ利用してください。
それ以外のメッセージは一切出力してはいけません。`,
    };
  }

  private createCommandParams(
    bodyJson: BedrockRequest,
    model: string,
  ): ConverseCommandInput {
    return {
      modelId: model,
      toolConfig: {
        tools: [
          {
            toolSpec: bodyJson.toolSpec as ToolSpecification,
          },
        ],
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              text: bodyJson.prompt,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 1024, // 生成するトークンの最大数
        temperature: 0.7, // ランダム性 0から1の間で設定（デフォルトは0.7）高いほどランダム性が増す
      },
    };
  }

  private async converse(
    params: ConverseCommandInput,
  ): Promise<BedrockResponse> {
    const command = new ConverseCommand(params);
    const response = await this.client.send(command);

    if (
      !response.output?.message?.content ||
      response.output.message.content.length === 0
    ) {
      throw new Error(
        'Failed to generate prompt: ' + JSON.stringify(response.output),
      );
    } else if (
      !response.output.message.content[1]?.toolUse ||
      !response.output.message.content[1].toolUse.input
    ) {
      throw new Error(
        'Unexpected response format: ' + JSON.stringify(response.output),
      );
    }
    return response.output.message.content[1].toolUse.input as BedrockResponse;
  }
}
