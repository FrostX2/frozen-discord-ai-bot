import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { setupDiscordHandlers } from './discord.js';

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

setupDiscordHandlers(client);

client.login(config.discord.token);
