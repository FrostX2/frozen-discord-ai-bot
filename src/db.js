import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve('aibot.db');
let db;

export function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT
    );

    CREATE TABLE IF NOT EXISTS channel_config (
      channel_id TEXT PRIMARY KEY,
      system_prompt TEXT,
      model TEXT
    );
  `);

  return db;
}

export function getDB() {
  if (!db) initDB();
  return db;
}

export function getGuildConfig(guildId) {
  const row = getDB().prepare('SELECT channel_id FROM guild_config WHERE guild_id = ?').get(guildId);
  return row ? { channelId: row.channel_id } : null;
}

export function setGuildConfig(guildId, channelId) {
  getDB().prepare(`
    INSERT INTO guild_config (guild_id, channel_id)
    VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET channel_id = excluded.channel_id
  `).run(guildId, channelId);
}

export function getChannelConfig(channelId) {
  const row = getDB().prepare('SELECT system_prompt, model FROM channel_config WHERE channel_id = ?').get(channelId);
  return row || null;
}

export function setChannelConfig(channelId, { systemPrompt, model }) {
  getDB().prepare(`
    INSERT INTO channel_config (channel_id, system_prompt, model)
    VALUES (?, ?, ?)
    ON CONFLICT(channel_id) DO UPDATE SET system_prompt = excluded.system_prompt, model = excluded.model
  `).run(channelId, systemPrompt || null, model || null);
}
