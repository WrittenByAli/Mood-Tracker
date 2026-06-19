require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pgPool = new Pool({
  connectionString,
  ssl: connectionString?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function query(sql, params = []) {
  let text = convertPlaceholders(sql);
  const upper = sql.trim().toUpperCase();

  if (upper.startsWith('INSERT') && !/RETURNING/i.test(text)) {
    text = `${text.replace(/;?\s*$/, '')} RETURNING id`;
  }

  const result = await pgPool.query(text, params);

  if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
    return [result.rows, result.fields];
  }

  return [
    {
      insertId: result.rows[0]?.id ?? null,
      affectedRows: result.rowCount,
    },
    undefined,
  ];
}

const pool = {
  query,
  end: () => pgPool.end(),
};

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      profile_pic VARCHAR(255),
      bio TEXT,
      xp INT NOT NULL DEFAULT 0,
      level INT NOT NULL DEFAULT 1,
      streak INT NOT NULL DEFAULT 0,
      longest_streak INT NOT NULL DEFAULT 0,
      total_entries INT NOT NULL DEFAULT 0,
      is_verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mood VARCHAR(50) NOT NULL,
      mood_score INT NOT NULL DEFAULT 5,
      energy SMALLINT,
      stress SMALLINT,
      sleep_hours DECIMAL(4,1),
      activities JSONB DEFAULT '[]'::jsonb,
      note TEXT,
      entry_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, entry_date)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_key VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, achievement_key)
    )
  `);
}

module.exports = { pool, initSchema, pgPool };
