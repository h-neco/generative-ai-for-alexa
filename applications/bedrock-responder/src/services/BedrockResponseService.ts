import { BedrockRepository } from '../repositories/BedrockRepository';
import { questionPrompt, translationPrompt, model } from '../llm';

export class BedrockResponseService {
  constructor(private readonly bedrockRepository: BedrockRepository) {}

  async get(userQuery: string, type: string): Promise<BedrockResponse> {
    try {
      let prompt;
      switch (type) {
        case 'question':
          prompt = questionPrompt;
          break;
        case 'translation':
          prompt = translationPrompt;
          break;
        default:
          throw new Error('Invalid type');
      }
      return await this.bedrockRepository.generate(userQuery, prompt, model);
    } catch (error) {
      console.error(`Error getting prompt: ${error}`);
      throw new Error(`Failed to get prompt: ${error}`);
    }
  }
}
