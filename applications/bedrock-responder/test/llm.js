const {
  BedrockRuntimeClient,
  ConverseCommand,
} = require('@aws-sdk/client-bedrock-runtime');
const fs = require('fs');
const { encode } = require('gpt-tokenizer');

const commonValidationRules = `ユーザーが音声機器を通じて質問しますので、質問に答えてください。
まずは、入力値のモデレーションをmoderation-rulesに沿って行ってください。
moderationResultが"true"の場合のみ、prompt-rulesに沿ってプロンプト生成を行ってください。
moderationResultが"false"の場合は、moderation-error-rulesに沿ってエラーメッセージを設定してください。

<moderation-rules>
- 意味のない数字や文字列は入力禁止です。
- 公序良俗に反するものは入力禁止です。
</moderation-rules>

<moderation-error-rules>
moderationErrorを返す際は、以下のフォーマットを厳密に守ってください：
"〇〇が質問文に含まれている可能性があります。別の質問で再度お試しください。"
〇〇の部分は適切な理由を簡潔に記述してください。
</moderation-error-rules>
`;

const questionPrompt = `
${commonValidationRules}
<prompt-rules>
- 質問に対して分かりやすく完結に答えてください。最終的なアウトプットは音声出力になりますので、長すぎないようにしてください。
- 回答は会話的な口調を使い、読み上げやすいシンプルな文章を心がけてください。
</prompt-rules>
`;

const translationPrompt = `
${commonValidationRules}
<prompt-rules>
- 英語または日本語に翻訳して出力してください。最終的なアウトプットは音声出力になりますので、長すぎないようにしてください。
- 入力された言語を自動検出し、日本語なら英語に、英語なら日本語に翻訳してください。
- その他の言語の場合は日本語に翻訳してください。
- 翻訳は自然で流暢な表現を心がけ、直訳ではなく意味が伝わる翻訳にしてください。
</prompt-rules>
`;

const model = 'us.anthropic.claude-3-7-sonnet-20250219-v1:0';
const userQuery = ['今日の気候は例年に比べてどうですか？'];
const types = ['question', 'translation'];

async function generatePrompt(userQuery, type) {
  const prompt = type === 'question' ? questionPrompt : translationPrompt;
  const client = new BedrockRuntimeClient({ region: 'us-west-2' });
  const converseCommand = new ConverseCommand({
    modelId: model,
    toolConfig: {
      tools: [
        {
          toolSpec: {
            name: 'moderate_and_generate_prompt',
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
        },
      ],
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            text: `<入力文>${userQuery}</入力文>
moderate_and_generate_prompt ツールのみ利用してください。
それ以外のメッセージは一切出力してはいけません。`,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0.7,
    },
  });

  try {
    const response = await client.send(converseCommand);
    console.log(JSON.stringify(response.usage, null, 2));
    return response;
  } catch (error) {
    console.error('Error generating prompt:', error);
    throw error;
  }
}

// Main function to process all themes
async function processThemes() {
  for (const type of types) {
    for (const query of userQuery) {
      try {
        const response = await generatePrompt(query, type);
        console.log(`User Query: ${query}`);
        console.log(
          `Generated Prompt: ${JSON.stringify(response.output.message.content[1].toolUse.input)}`,
        );
        console.log('---');
        const path = `./output/llm.log`;
        const txt = `{"UserQuery": "${query}", ${JSON.stringify(
          response.output.message.content[1].toolUse.input,
        )}}`;
        fs.appendFileSync(path, JSON.stringify(txt) + '\n');
      } catch (error) {
        console.error(`Error processing query "${query}":`, error);
      }
    }
  }
}

// Execute the main function
processThemes();
