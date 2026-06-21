import express from 'express';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { config } from './config.js';
import { setupDiscordHandlers } from './discord.js';
import { commands } from './commands.js';

const mutableSettings = { ...config.ai };

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot is alive and running!');
});

app.get('/api/status', (req, res) => {
  const ready = client?.isReady?.();
  res.json({
    type: 'ai',
    status: ready ? 'online' : 'connecting',
    ready: !!ready,
    uptime: process.uptime(),
    guilds: client?.guilds?.cache?.size || 0,
    latency: client?.ws?.ping || 0,
    model: mutableSettings.model,
    version: '2.0.1',
  });
});

app.get('/api/stats', (req, res) => {
  const ready = client?.isReady?.();
  if (!ready) return res.json({ error: 'not ready' });

  const guilds = client.guilds.cache.map(g => ({
    id: g.id,
    name: g.name,
    memberCount: g.memberCount,
  }));

  res.json({
    guildCount: guilds.length,
    guilds,
    model: mutableSettings.model,
    uptime: process.uptime(),
    latency: client.ws.ping,
  });
});

app.get('/api/guilds', (req, res) => {
  const ready = client?.isReady?.();
  if (!ready) return res.json({ error: 'not ready' });
  const guilds = client.guilds.cache.map(g => ({
    id: g.id,
    name: g.name,
    memberCount: g.memberCount,
    icon: g.icon,
    ownerId: g.ownerId,
  }));
  const botUser = client.user;
  res.json({ guilds, count: guilds.length, bot: { tag: botUser?.tag, id: botUser?.id, avatar: botUser?.displayAvatarURL() } });
});

app.get('/api/settings', (req, res) => {
  res.json({
    model: mutableSettings.model,
    temperature: mutableSettings.temperature,
    maxTokens: mutableSettings.maxTokens,
    systemPrompt: mutableSettings.systemPrompt,
    baseURL: mutableSettings.baseURL,
  });
});

app.post('/api/settings', express.json(), (req, res) => {
  const { model, temperature, maxTokens, systemPrompt } = req.body;
  if (model) mutableSettings.model = model;
  if (temperature != null) mutableSettings.temperature = parseFloat(temperature);
  if (maxTokens != null) mutableSettings.maxTokens = parseInt(maxTokens);
  if (systemPrompt) mutableSettings.systemPrompt = systemPrompt;
  res.json({ ok: true, settings: mutableSettings });
});

app.listen(port, '0.0.0.0', () => {
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

client.login(config.discord.token).catch(err => {
  console.error('LOGIN ERROR:', err.message);
});
// Add this after app.listen(...)
console.log('Env check:', ['DISCORD_TOKEN','CLIENT_ID','AI_BASE_URL','AI_API_KEY']
  .map(k => `${k}=${process.env[k] ? '✓' : '✗ MISSING'}`)
  .join(', '));
