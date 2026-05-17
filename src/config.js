import 'dotenv/config';

function required(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  discord: {
    token: required('DISCORD_TOKEN'),
    clientId: required('CLIENT_ID'),
  },
  ai: {
    baseURL: required('AI_BASE_URL'),
    apiKey: required('AI_API_KEY'),
    model: process.env.AI_MODEL || 'gpt-4o',
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 1024,
    systemPrompt: process.env.AI_SYSTEM_PROMPT || 'You are a helpful assistant in a Discord server. Be concise, friendly, and engaging.',
  },
};
