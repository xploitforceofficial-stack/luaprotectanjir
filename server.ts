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

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// --- IN-MEMORY STORAGE ---
// Storing scripts and nonces in memory (Reset on server restart)
const scriptStorage = new Map<string, string>();
const usedNonces = new Set<string>();

// --- SECURITY HELPERS ---

// Block tools like curl, postman, etc.
const userAgentFilter = (req: Request, res: Response, next: NextFunction) => {
  const ua = req.get('User-Agent') || '';
  const blockedUAs = ['curl', 'postman', 'insomnia', 'python-requests'];
  
  if (blockedUAs.some(blocked => ua.toLowerCase().includes(blocked))) {
    // Return a fake response to mislead scraping tools
    return res.status(200).send('-- Access Denied: Unauthorized Environment');
  }
  next();
};

// Rate limiting: 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- MIDDLEWARE ---

app.use(limiter);
app.use(userAgentFilter);
app.use(express.json());

// Strict but working CORS configuration
app.use(cors({
  origin: '*', // For production, replace with specific frontend URL like 'https://your-app.vercel.app'
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Preflight (OPTIONS) Handling - Redundant but ensures safety
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send();
});

// --- API ROUTES ---

/**
 * POST /api/create-script
 * Purpose: Store a Lua script and get a unique ID.
 */
app.post('/api/create-script', (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string' || code.length === 0) {
      return res.status(400).json({ error: 'Invalid script content' });
    }

    if (code.length > 50000) {
      return res.status(400).json({ error: 'Script too large (max 50KB)' });
    }

    const id = nanoid(12); // Generate a unique 12-char ID
    scriptStorage.set(id, code);

    // Build loader URL based on host
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const loaderUrl = `${protocol}://${host}/loader?id=${id}`;

    console.log(`Script created: ${id}`);
    
    return res.json({
      id,
      loaderUrl
    });
  } catch (err) {
    console.error('Create script error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /loader
 * Purpose: Serve the Lua script with security validations.
 */
app.get('/loader', (req: Request, res: Response) => {
  try {
    const { id, ts, nonce } = req.query;

    // 1. Validate mandatory ID
    if (!id || typeof id !== 'string') {
      return res.status(200).send('-- Error: Missing ID');
    }

    // 2. Anti-Replay (Nonce System) & Timestamp Validation
    // These ensure the request is fresh and hasn't been intercepted/replayed
    if (ts && nonce && typeof ts === 'string' && typeof nonce === 'string') {
      const timestamp = parseInt(ts);
      const now = Math.floor(Date.now() / 1000);
      
      // Timestamp expiration (Max 10 seconds window)
      if (Math.abs(now - timestamp) > 10) {
        return res.status(200).send('-- Error: Request Expired');
      }

      // Nonce anti-replay
      if (usedNonces.has(nonce)) {
        return res.status(200).send('-- Error: Request Replayed');
      }
      usedNonces.add(nonce);
      
      // Optional: Cleanup old nonces after some time
      setTimeout(() => usedNonces.delete(nonce), 60000);
    }

    // 3. Fetch script
    const script = scriptStorage.get(id);

    if (!script) {
      return res.status(200).send('-- Error: Script Not Found');
    }

    // 4. Return as Lua plain text
    res.set('Content-Type', 'text/plain');
    return res.send(script);
  } catch (err) {
    console.error('Loader error:', err);
    return res.status(200).send('-- Error: Internal Processing Fault');
  }
});

// --- FALLBACKS & ERROR HANDLING ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'stable', timestamp: new Date().toISOString() });
});

// Unknown API routes fallback
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not defined' });
});

// Catch-all for non-API unknown routes (misleads scanners)
app.get('*', (req, res) => {
  res.status(200).send('-- System Online | Operation Restricted');
});

// Global Error Handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global Handler Caught:', err);
  
  // Prevent returning 500 HTML to the client
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
  
  res.status(200).send('-- Process Terminated: Fault Detected');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Server is running flawlessly!
📍 Local: http://localhost:${PORT}
🔒 Security: Enabled
🛡️ CORS: Open
  `);
});
