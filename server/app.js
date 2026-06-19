require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { pool, initSchema, pgPool } = require('./db');

const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/moods');
const statsRoutes = require('./routes/stats');
const profileRoutes = require('./routes/profile');
const achievementsRoutes = require('./routes/achievements');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = Boolean(process.env.VERCEL);

app.set('trust proxy', 1);

const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const corsOrigins = isProduction
  ? [process.env.CLIENT_URL, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function createSessionStore() {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return new pgSession({
      pool: pgPool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    });
  }
  return undefined;
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    store: isProduction || isVercel || process.env.DATABASE_URL ? createSessionStore() : undefined,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction || isVercel,
      httpOnly: true,
      sameSite: isProduction || isVercel ? 'lax' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/achievements', achievementsRoutes);

app.get('/api/quote', async (_req, res) => {
  try {
    const response = await fetch('https://zenquotes.io/api/random');
    const data = await response.json();
    res.json(data[0]);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    if (!initialized) {
      await initApp();
    }
    res.json({
      status: 'ok',
      database: initialized ? 'connected' : 'pending',
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'unavailable',
      message: err.message,
    });
  }
});

if (isProduction || isVercel) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

let initialized = false;

async function initApp() {
  if (initialized) return app;
  await initSchema();
  initialized = true;
  return app;
}

module.exports = { app, initApp, pool };
