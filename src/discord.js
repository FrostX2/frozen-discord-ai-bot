import { config } from './config.js';
import { askAI } from './ai.js';

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
    }
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.channel.isTextBased?.()) return;

    const aiMentioned = message.mentions.users.has(client.user.id);

    const replyToBot = message.reference?.messageId
      ? (await message.channel.messages.fetch(message.reference.messageId).catch(() => null))?.author?.id === client.user.id
      : false;

    if (!aiMentioned && !replyToBot) return;

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
