const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');

const router = express.Router();

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    profile_pic: user.profile_pic,
    bio: user.bio,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    longest_streak: user.longest_streak,
    total_entries: user.total_entries,
    is_verified: Boolean(user.is_verified),
    created_at: user.created_at,
  };
}

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isVerified = true;

    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash, is_verified)
       VALUES (?, ?, ?, ?)`,
      [username.trim(), email.trim().toLowerCase(), passwordHash, isVerified]
    );

    req.session.userId = result.insertId;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json({ user: sanitizeUser(users[0]) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [
      email.trim().toLowerCase(),
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    if (process.env.NODE_ENV === 'production' && !user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Legacy plain-text passwords from older schema
      if (user.password_hash === password) {
        const hash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
      } else {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    req.session.userId = user.id;
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: sanitizeUser(users[0]) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
