import { PermissionsBitField } from 'discord.js';
import { config } from './config.js';
import { askAI, getAvailableModels } from './ai.js';
import { initDB, getGuildConfig, setGuildConfig, getChannelConfig, setChannelConfig } from './db.js';

initDB();

const channels = new Map();

function getChannel(id) {
  if (!channels.has(id)) {
    const saved = getChannelConfig(id);
    channels.set(id, {
      systemPrompt: saved?.system_prompt || config.ai.systemPrompt,
      model: saved?.model || config.ai.model,
      messages: [],
    });
  }
  return channels.get(id);
}

function persistChannel(id) {
  const ch = channels.get(id);
  if (ch) {
    setChannelConfig(id, { systemPrompt: ch.systemPrompt, model: ch.model });
  }
}

function getAllProviderModels() {
  const models = [config.ai.model];
  for (const p of config.ai.providers) {
    if (p.models) models.push(...p.models);
  }
  return [...new Set(models)];
}

export function setupDiscordHandlers(client) {
  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
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
        persistChannel(interaction.channelId);
        await interaction.reply('System prompt updated and history cleared.');
        break;

      case 'model': {
        const model = interaction.options.getString('name');
        channel.model = model;
        persistChannel(interaction.channelId);
        await interaction.reply(`Model changed to \`${channel.model}\``);
        break;
      }

      case 'models':
        await interaction.reply(`Available models: ${getAllProviderModels().join(', ')}`);
        break;

      case 'setup':
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
          return interaction.reply({ content: 'You need the Manage Channels permission to use this command.', ephemeral: true });
        }
        const targetChannel = interaction.options.getChannel('channel');
        setGuildConfig(interaction.guildId, targetChannel.id);
        await interaction.reply(`Bot will now automatically respond in ${targetChannel} — no need to @mention me!`);
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

    const guildCfg = message.guildId ? getGuildConfig(message.guildId) : null;
    const isConfiguredChannel = guildCfg?.channelId === message.channelId;

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
