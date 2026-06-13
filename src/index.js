import express from 'express';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { config } from './config.js';
import { setupDiscordHandlers } from './discord.js';
import { commands } from './commands.js';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive and running!');
});

app.listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const rest = new REST({ version: '10' }).setToken(config.discord.token);
    await rest.put(
      Routes.applicationCommands(config.discord.clientId),
      { body: commands.map(c => c.toJSON()) },
    );
    console.log('Slash commands deployed.');
  } catch (err) {
    console.error('Failed to deploy slash commands:', err);
  }
});

setupDiscordHandlers(client);

client.login(config.discord.token);
