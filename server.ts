/**
 * 🛡️ SHIELD_API.ts - PURE BACKEND API
 * Production-ready, zero CORS issues, Railway optimized.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// 🔥 FIX SIGTERM: Railway akan mengisi process.env.PORT secara otomatis.
const PORT = process.env.PORT || 8080; 

// --- IN-MEMORY STORAGE ---
const scriptStorage = new Map<string, string>();
const usedNonces = new Set<string>();

// --- 1️⃣ CORS & OPTIONS (STRICT & PRIORITIZED) ---
const allowedOrigins = ['https://luaprotectanjir.vercel.app', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or matching our domains
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', (req, res) => {
  const origin = req.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res.sendStatus(204);
});

// --- 2️⃣ PARSERS & SECURITY MIDDLEWARE ---
app.use(express.json());

// Rate Limiting (30 req/min)
app.use(rateLimit({
  windowMs: 60000,
  max: 30,
  message: { error: 'Quota exceeded' }
}));

// User-Agent Filter (Anti-curl/Anti-postman)
app.use((req, res, next) => {
  // 🔥 PROTECT OPTIONS: Jangan blokir preflight
  if (req.method === 'OPTIONS') return next();

  const ua = req.get('User-Agent') || '';
  const blocked = ['curl', 'postman', 'insomnia', 'python-requests'];
  if (blocked.some(b => ua.toLowerCase().includes(b))) {
    return res.status(200).send('-- ShieldAPI: Environment Restricted');
  }
  next();
});

// Request Logger
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

// --- 3️⃣ API ROUTES ---

// Root Status
app.get('/', (req, res) => {
  res.send('🛡️ SHIELD_API ONLINE | DEPLOYMENT ACTIVE');
});

// API Health
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'stable', 
    uptime: process.uptime(),
    port: PORT 
  });
});

// Create Script
app.post('/api/create-script', (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Code required' });
    
    const id = nanoid(12);
    scriptStorage.set(id, code);
    
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const loaderUrl = `${protocol}://${host}/loader?id=${id}`;
    
    // Explicitly set CORS for this response too
    const origin = req.get('origin');
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.json({ id, loaderUrl });
  } catch (err) {
    res.status(500).json({ error: 'Fault' });
  }
});

// Loader (Lua Plain Text)
app.get('/loader', (req: Request, res: Response) => {
  const { id, ts, nonce } = req.query;
  if (!id || typeof id !== 'string') return res.send('-- Error: ID required');

  // Timestamp & Nonce Validation
  if (ts && nonce && typeof ts === 'string' && typeof nonce === 'string') {
    const timestamp = parseInt(ts);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 10) return res.send('-- Error: Expired');
    if (usedNonces.has(nonce)) return res.send('-- Error: Replayed');
    usedNonces.add(nonce);
    setTimeout(() => usedNonces.delete(nonce), 60000);
  }

  const script = scriptStorage.get(id);
  if (!script) return res.send('-- Error: 404');

  res.set('Content-Type', 'text/plain');
  return res.send(script);
});

// --- 4️⃣ FALLBACKS ---
app.all('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('SERVER_FAULT:', err.message);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'System error' });
  }
  res.status(200).send('-- Process Terminated: Fault Detected');
});

// --- 5️⃣ START ---
app.listen(PORT, () => {
  console.log(`
  🚀 API IS PURE AND RUNNING
  📍 Target Port: ${PORT}
  🌍 Origin: https://luaprotectanjir.vercel.app
  `);
});
