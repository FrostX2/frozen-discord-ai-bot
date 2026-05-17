import OpenAI from 'openai';
import { config } from './config.js';

const openai = new OpenAI({
  baseURL: config.ai.baseURL,
  apiKey: config.ai.apiKey,
});

export async function askAI(messages, modelOverride) {
  const response = await openai.chat.completions.create({
    model: modelOverride || config.ai.model,
    messages,
    temperature: config.ai.temperature,
    max_tokens: config.ai.maxTokens,
  });

  const choice = response.choices?.[0];
  if (!choice?.message?.content) {
    throw new Error('AI returned no content');
  }
  return choice.message.content;
}
