import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Deploying slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands.map(c => c.toJSON()) },
    );
    console.log('Commands deployed successfully.');
  } catch (err) {
    console.error('Failed to deploy commands:', err);
  }
})();
