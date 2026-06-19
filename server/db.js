require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moodtrack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function ensureColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${column} ${definition}`);
  }
}

async function migrateUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      profile_pic VARCHAR(255) DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      xp INT NOT NULL DEFAULT 0,
      level INT NOT NULL DEFAULT 1,
      streak INT NOT NULL DEFAULT 0,
      longest_streak INT NOT NULL DEFAULT 0,
      total_entries INT NOT NULL DEFAULT 0,
      is_verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn('users', 'password_hash', 'VARCHAR(255) NULL');
  await ensureColumn('users', 'profile_pic', 'VARCHAR(255) DEFAULT NULL');
  await ensureColumn('users', 'bio', 'TEXT DEFAULT NULL');
  await ensureColumn('users', 'xp', 'INT NOT NULL DEFAULT 0');
  await ensureColumn('users', 'level', 'INT NOT NULL DEFAULT 1');
  await ensureColumn('users', 'streak', 'INT NOT NULL DEFAULT 0');
  await ensureColumn('users', 'longest_streak', 'INT NOT NULL DEFAULT 0');
  await ensureColumn('users', 'total_entries', 'INT NOT NULL DEFAULT 0');

  if (await columnExists('users', 'password') && !(await columnExists('users', 'password_hash'))) {
    await pool.query('ALTER TABLE users CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL');
  } else   if (await columnExists('users', 'password')) {
    await pool.query(
      'UPDATE users SET password_hash = password WHERE password_hash IS NULL OR password_hash = ""'
    );
    try {
      await pool.query('ALTER TABLE users DROP COLUMN password');
    } catch {
      await pool.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL DEFAULT NULL');
    }
  }

  if (await columnExists('users', 'verification_token')) {
    try {
      await pool.query('ALTER TABLE users DROP COLUMN verification_token');
    } catch {
      /* column may be referenced; leave in place */
    }
  }

  if (await columnExists('users', 'profilePic')) {
    await pool.query(
      'UPDATE users SET profile_pic = profilePic WHERE profile_pic IS NULL AND profilePic IS NOT NULL'
    );
  }

  if (!(await columnExists('users', 'id'))) {
    await ensureColumn('users', 'id', 'INT AUTO_INCREMENT PRIMARY KEY FIRST');
  }
}

async function migrateMoodEntriesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      mood VARCHAR(50) NOT NULL,
      mood_score INT NOT NULL DEFAULT 5,
      energy TINYINT DEFAULT NULL,
      stress TINYINT DEFAULT NULL,
      sleep_hours DECIMAL(4,1) DEFAULT NULL,
      activities JSON DEFAULT NULL,
      note TEXT DEFAULT NULL,
      entry_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_entry_date (user_id, entry_date),
      CONSTRAINT fk_mood_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const hasUserId = await columnExists('mood_entries', 'user_id');
  const hasEmail = await columnExists('mood_entries', 'email');

  await ensureColumn('mood_entries', 'user_id', 'INT NULL');
  await ensureColumn('mood_entries', 'mood_score', 'INT NOT NULL DEFAULT 5');
  await ensureColumn('mood_entries', 'energy', 'TINYINT DEFAULT NULL');
  await ensureColumn('mood_entries', 'stress', 'TINYINT DEFAULT NULL');
  await ensureColumn('mood_entries', 'sleep_hours', 'DECIMAL(4,1) DEFAULT NULL');
  await ensureColumn('mood_entries', 'activities', 'JSON DEFAULT NULL');
  await ensureColumn('mood_entries', 'entry_date', 'DATE NULL');

  if (hasEmail && hasUserId) {
    await pool.query(`
      UPDATE mood_entries me
      JOIN users u ON u.email = me.email
      SET me.user_id = u.id
      WHERE me.user_id IS NULL
    `);
    await pool.query(`
      UPDATE mood_entries
      SET entry_date = DATE(created_at)
      WHERE entry_date IS NULL
    `);
  }

  if (await columnExists('mood_entries', 'email')) {
    try {
      await pool.query('ALTER TABLE mood_entries DROP COLUMN email');
    } catch {
      await pool.query('ALTER TABLE mood_entries MODIFY COLUMN email VARCHAR(100) NULL DEFAULT NULL');
    }
  }

  if (!(await columnExists('mood_entries', 'id'))) {
    await ensureColumn('mood_entries', 'id', 'INT AUTO_INCREMENT PRIMARY KEY FIRST');
  }

  try {
    await pool.query(`
      ALTER TABLE mood_entries
      ADD UNIQUE KEY unique_user_entry_date (user_id, entry_date)
    `);
  } catch (err) {
    if (err.code !== 'ER_DUP_KEYNAME') throw err;
  }
}

async function migrateAchievementsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      achievement_key VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_achievement (user_id, achievement_key),
      CONSTRAINT fk_achievement_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

async function initSchema() {
  await migrateUsersTable();
  await migrateMoodEntriesTable();
  await migrateAchievementsTable();
}

module.exports = { pool, initSchema };
