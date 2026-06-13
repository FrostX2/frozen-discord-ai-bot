import { PermissionsBitField } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { askAI } from './ai.js';

const CONFIG_PATH = path.resolve('guild-config.json');
let guildConfig = {};

function loadGuildConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      guildConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load guild config:', err);
  }
}

function saveGuildConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(guildConfig, null, 2));
  } catch (err) {
    console.error('Failed to save guild config:', err);
  }
}

const channels = new Map();

function getChannel(id) {
  if (!channels.has(id)) {
    channels.set(id, {
      systemPrompt: config.ai.systemPrompt,
      model: config.ai.model,
      messages: [],
    });
  }
  return channels.get(id);
}

export function setupDiscordHandlers(client) {
  client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
    loadGuildConfig();
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const channel = getChannel(interaction.channelId);

    switch (interaction.commandName) {
      case 'ping':
        await interaction.reply(`Pong! Latency: ${client.ws.ping}ms`);
        break;

      case 'clear':
        channel.messages = [];
        await interaction.reply('Conversation history cleared.');
        break;

      case 'system':
        channel.systemPrompt = interaction.options.getString('prompt');
        channel.messages = [];
        await interaction.reply('System prompt updated and history cleared.');
        break;

      case 'model':
        channel.model = interaction.options.getString('name');
        await interaction.reply(`Model changed to \`${channel.model}\``);
        break;

      case 'setup':
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
          return interaction.reply({ content: 'You need the Manage Channels permission to use this command.', ephemeral: true });
        }
        const targetChannel = interaction.options.getChannel('channel');
        if (!guildConfig[interaction.guildId]) {
          guildConfig[interaction.guildId] = {};
        }
        guildConfig[interaction.guildId].channelId = targetChannel.id;
        saveGuildConfig();
        await interaction.reply(`✅ Bot will now automatically respond in ${targetChannel} — no need to @mention me!`);
        break;
    }
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.channel.isTextBased?.()) return;

    const aiMentioned = message.mentions.users.has(client.user.id);

    const replyToBot = message.reference?.messageId
      ? (await message.channel.messages.fetch(message.reference.messageId).catch(() => null))?.author?.id === client.user.id
      : false;

    const isConfiguredChannel = message.guildId && guildConfig[message.guildId]?.channelId === message.channelId;

    if (!aiMentioned && !replyToBot && !isConfiguredChannel) return;

    const channel = getChannel(message.channelId);

    const cleanContent = message.content.replace(new RegExp(`<@!?${client.user.id}>`), '').trim();
    channel.messages.push({ role: 'user', content: cleanContent || message.content });

    const systemMessage = { role: 'system', content: channel.systemPrompt };

    await message.channel.sendTyping();

    try {
      const reply = await askAI(
        [systemMessage, ...channel.messages.slice(-20)],
        channel.model,
      );

      channel.messages.push({ role: 'assistant', content: reply });

      if (reply.length > 2000) {
        const chunks = reply.match(/[\s\S]{1,1990}/g) || [];
        for (const chunk of chunks) {
          await message.channel.send(chunk);
        }
      } else {
        await message.channel.send(reply);
      }
    } catch (err) {
      console.error('AI error:', err);
      await message.channel.send(`Error: ${err.message}`);
    }
  });
}
