import { SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear conversation history in this channel'),

  new SlashCommandBuilder()
    .setName('system')
    .setDescription('Set a custom system prompt for this channel')
    .addStringOption(opt =>
      opt.setName('prompt')
        .setDescription('The system prompt')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('model')
    .setDescription('Change the AI model for this channel')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Model name (e.g. gpt-4o, claude-3-opus-20240229)')
        .setRequired(true)
    ),
];
