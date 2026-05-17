import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { setupDiscordHandlers } from './discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

setupDiscordHandlers(client);

client.login(config.discord.token);
