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
const PORT = Number(process.env.PORT) || 3000;

// --- IN-MEMORY STORAGE ---
const scriptStorage = new Map<string, string>();
const usedNonces = new Set<string>();

// --- 1️⃣ CORS & OPTIONS (MUST BE FIRST) ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
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
  // 🔥 BONUS FIX: Jangan blokir preflight!
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
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// --- 3️⃣ API ROUTES ---

// Root Status
app.get('/', (req, res) => {
  res.send('🛡️ SHIELD_API ONLINE | DEPLOYMENT ACTIVE');
});

// API Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'stable', uptime: process.uptime() });
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
  res.send(script);
});

// --- 4️⃣ FALLBACKS ---
app.all('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ status: 'internal_error' });
});

// --- 5️⃣ START ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 API IS PURE AND RUNNING
  📍 Port: ${PORT}
  🛡️ User: cellofinda@gmail.com
  `);
});
