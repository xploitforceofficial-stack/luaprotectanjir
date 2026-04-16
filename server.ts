/**
 * Production-ready Full-Stack Backend API System
 * Designed for stability, security, and zero CORS errors.
 * Optimized for Railway (Express) and Roblox game:HttpGet.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Derive __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- IN-MEMORY STORAGE ---
const scriptStorage = new Map<string, string>();
const usedNonces = new Set<string>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // --- SECURITY HELPERS ---

  // Block tools like curl, postman, etc.
  const userAgentFilter = (req: Request, res: Response, next: NextFunction) => {
    const ua = req.get('User-Agent') || '';
    const blockedUAs = ['curl', 'postman', 'insomnia', 'python-requests'];
    
    if (blockedUAs.some(blocked => ua.toLowerCase().includes(blocked))) {
      return res.status(200).send('-- Access Denied: Unauthorized Environment');
    }
    next();
  };

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // --- MIDDLEWARE ---

  app.use(limiter);
  app.use(userAgentFilter);
  app.use(express.json());

  // CORS Configuration
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));

  // Logger
  app.use((req, res, next) => {
    if (!req.path.startsWith('/@') && !req.path.includes('.')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
  });

  // --- API ROUTES ---

  app.post('/api/create-script', (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== 'string' || code.length === 0) {
        return res.status(400).json({ error: 'Invalid script content' });
      }
      if (code.length > 50000) {
        return res.status(400).json({ error: 'Script too large (max 50KB)' });
      }
      const id = nanoid(12);
      scriptStorage.set(id, code);
      const host = req.get('host');
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const loaderUrl = `${protocol}://${host}/loader?id=${id}`;
      return res.json({ id, loaderUrl });
    } catch (err) {
      console.error('Create script error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/loader', (req: Request, res: Response) => {
    try {
      const { id, ts, nonce } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(200).send('-- Error: Missing ID');
      }
      if (ts && nonce && typeof ts === 'string' && typeof nonce === 'string') {
        const timestamp = parseInt(ts);
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > 10) {
          return res.status(200).send('-- Error: Request Expired');
        }
        if (usedNonces.has(nonce)) {
          return res.status(200).send('-- Error: Request Replayed');
        }
        usedNonces.add(nonce);
        setTimeout(() => usedNonces.delete(nonce), 60000);
      }
      const script = scriptStorage.get(id);
      if (!script) {
        return res.status(200).send('-- Error: Script Not Found');
      }
      res.set('Content-Type', 'text/plain');
      return res.send(script);
    } catch (err) {
      console.error('Loader error:', err);
      return res.status(200).send('-- Error: Internal Processing Fault');
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'stable', timestamp: new Date().toISOString() });
  });

  // --- VITE / STATIC SERVING ---

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    // SPA Fallback: Serve index.html for unknown non-API routes
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint not defined' });
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Global Handler Caught:', err);
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
    res.status(200).send('-- Process Terminated: Fault Detected');
  });

  // Start Server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 ShieldAPI System Online
📍 Port: ${PORT}
🛡️ Mode: ${process.env.NODE_ENV || 'development'}
    `);
  });
}

startServer();
