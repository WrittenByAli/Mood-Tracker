const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

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

router.get('/', requireAuth, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: sanitizeUser(users[0]) });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { username, email, bio, current_password, new_password } = req.body;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const updates = [];
    const values = [];

    if (username?.trim()) {
      updates.push('username = ?');
      values.push(username.trim());
    }

    if (email?.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [
          normalizedEmail,
          userId,
        ]);
        if (existing.length > 0) {
          return res.status(409).json({ error: 'Email is already in use' });
        }
        updates.push('email = ?');
        values.push(normalizedEmail);
      }
    }

    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio?.trim() || null);
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      const valid = await bcrypt.compare(current_password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      const hash = await bcrypt.hash(new_password, 10);
      updates.push('password_hash = ?');
      values.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    res.json({ user: sanitizeUser(updated[0]) });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/avatar', requireAuth, (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const userId = req.session.userId;
      const profilePic = `/uploads/${req.file.filename}`;

      const [users] = await pool.query('SELECT profile_pic FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const oldPic = users[0].profile_pic;
      if (oldPic && oldPic.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '../../public', oldPic);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      await pool.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profilePic, userId]);

      const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      res.json({ user: sanitizeUser(updated[0]) });
    } catch (uploadErr) {
      console.error('Avatar upload error:', uploadErr);
      res.status(500).json({ error: 'Failed to update avatar' });
    }
  });
});

module.exports = router;
