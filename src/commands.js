import { ChannelType, SlashCommandBuilder } from 'discord.js';

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

  new SlashCommandBuilder()
    .setName('models')
    .setDescription('List all available AI models from all providers'),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set the channel where the bot will auto-respond (no @mention needed)')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('The text channel for the bot to live in')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
];
