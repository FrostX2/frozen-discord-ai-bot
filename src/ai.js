import OpenAI from 'openai';
import { config } from './config.js';

function getProviderForModel(model) {
  for (const p of config.ai.providers) {
    if (p.models?.includes(model)) return p;
  }
  return null;
}

export async function askAI(messages, modelOverride) {
  const model = modelOverride || config.ai.model;
  const provider = getProviderForModel(model);

  const client = new OpenAI({
    baseURL: provider?.baseURL || config.ai.baseURL,
    apiKey: provider?.apiKey || config.ai.apiKey,
  });

  const response = await client.chat.completions.create({
    model,
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

export function getAvailableModels() {
  const models = [config.ai.model];
  for (const p of config.ai.providers) {
    if (p.models) models.push(...p.models);
  }
  return [...new Set(models)];
}
