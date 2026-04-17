/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Activity, Share2, ShieldCheck, Database, Rocket, Terminal, Copy, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [scriptCode, setScriptCode] = useState('print("Hello from ShieldAPI!")');
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCreateScript = async () => {
    setLoading(true);
    // 😈 DONT FETCH TO VERCEL (SELF) - MUST GO TO RAILWAY
    const API_BASE = import.meta.env.VITE_API_URL || '';
    
    try {
      const response = await fetch(`${API_BASE}/api/create-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: scriptCode }),
      });
      
      const data = await response.json();
      if (data.loaderUrl) {
        setCreatedUrl(data.loaderUrl);
      }
    } catch (err) {
      console.error('Failed to create script:', err);
      // Optional: Inform user about JSON parse error from HTML response
      alert('Connection Error: Make sure VITE_API_URL is correctly set to your Railway URL.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdUrl) {
      navigator.clipboard.writeText(createdUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-sidebar border-r border-brand-border p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-2 text-white font-bold text-lg mb-12">
          <Shield className="text-brand-accent h-6 w-6" />
          <span>SHIELD_API.ts</span>
        </div>
        
        <nav className="space-y-4 flex-1">
          <NavItem icon={<Activity size={16} />} label="Monitoring" active />
          <NavItem icon={<Terminal size={16} />} label="API Endpoints" />
          <NavItem icon={<ShieldCheck size={16} />} label="CORS Policies" />
          <NavItem icon={<Database size={16} />} label="Logs & Metrics" />
          <NavItem icon={<Rocket size={16} />} label="Deployment" />
        </nav>

        <div className="mt-auto pt-5 border-t border-brand-border">
          <div className="text-[10px] text-brand-subtle uppercase tracking-wider mb-2">Uptime</div>
          <div className="text-white text-sm font-mono">14d 2h 14m 03s</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-brand-bg">
        {/* Header */}
        <header className="h-16 border-b border-brand-border flex items-center justify-between px-8 bg-brand-bg/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-brand-subtle text-sm">Environment:</span>
            <span className="text-white font-semibold text-sm">production-v1.4.2</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-brand-muted text-xs hidden sm:inline">Vercel ⇄ Railway Bridge Active</span>
            <div className="status-badge">Healthy</div>
          </div>
        </header>

        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Requests (24h)" value="142,892" meta="+12.4% from yesterday" />
            <StatCard title="CORS Preflights (OPTIONS)" value="24,105" meta="Avg Latency: 4ms" metaColor="text-white opacity-60" />
            <StatCard title="Blocked Replays" value="1,402" meta="High-Risk Activity Detected" metaColor="text-red-500" />
          </div>

          {/* Interactive Script Builder */}
          <section className="bg-brand-card border border-brand-border rounded-lg overflow-hidden">
            <div className="bg-[#1D1D1F] px-6 py-3 border-b border-brand-border flex items-center justify-between">
              <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Live Script Deployment</span>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] text-brand-subtle uppercase block font-bold">Lua Source Code</label>
                <textarea 
                  value={scriptCode}
                  onChange={(e) => setScriptCode(e.target.value)}
                  className="w-full h-48 bg-black border border-brand-border p-4 font-mono text-sm text-[#A9B7C6] rounded focus:outline-none focus:border-brand-accent transition-colors"
                  spellCheck={false}
                />
                <button 
                  onClick={handleCreateScript}
                  disabled={loading}
                  className="w-full bg-brand-accent hover:bg-emerald-600 text-brand-bg font-bold py-3 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Rocket size={18} />
                  {loading ? 'DEPLOYING...' : 'DEPLOY TO SHIELD_API'}
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-brand-subtle uppercase block font-bold">Deployment Output</label>
                <div className="h-48 bg-black border-l-4 border-brand-blue p-6 flex flex-col justify-center items-center text-center space-y-4 rounded-r">
                  {createdUrl ? (
                    <>
                      <div className="text-brand-blue font-mono text-xs break-all px-4">{createdUrl}</div>
                      <div className="flex gap-3">
                        <button 
                          onClick={copyToClipboard}
                          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs transition-colors"
                        >
                          {copySuccess ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                          {copySuccess ? 'COPIED' : 'COPY URL'}
                        </button>
                        <a 
                          href={createdUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent px-4 py-2 rounded-full text-xs transition-colors"
                        >
                          <Share2 size={14} />
                          OPEN LOADER
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-brand-muted text-sm italic py-10">
                      Wait for deployment to generate endpoint...
                    </div>
                  )}
                </div>
                <div className="bg-[#1D1D1F]/50 p-4 rounded text-[11px] text-brand-subtle font-mono">
                  Tip: Use `game:HttpGet("{createdUrl || '<LoaderURL>'}")` to fetch this script in-game.
                </div>
              </div>
            </div>
          </section>

          {/* Endpoint Table */}
          <div className="bg-brand-card border border-brand-border rounded-lg overflow-hidden">
            <div className="bg-[#1D1D1F] px-6 py-3 text-[10px] text-brand-muted uppercase font-bold tracking-widest grid grid-cols-4 md:grid-cols-6 items-center">
              <div className="col-span-1">Method</div>
              <div className="col-span-1 md:col-span-3">Endpoint Path</div>
              <div className="hidden md:block">Security</div>
              <div className="text-right">Status</div>
            </div>
            
            <div className="divide-y divide-brand-border">
              <EndpointRow method="POST" path="/api/create-script" security="nanoid / static-json" status="201 Created" methodClass="method-post" />
              <EndpointRow method="GET" path="/loader?id=...&ts=...&nonce=..." security="anti-replay / 10s-exp" status="200 text/plain" methodClass="method-get" />
              <EndpointRow method="OPTIONS" path="* (Global Preflight)" security="cors-middleware" status="204 No Content" methodClass="bg-white/5 text-gray-500" />
            </div>
          </div>

          {/* Code Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            <div className="space-y-2">
              <label className="text-[10px] text-brand-subtle uppercase font-bold tracking-wider">CORS Policy Configuration</label>
              <pre className="code-box">
{`app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Instant Preflight Handler
app.options('*', (req, res) => {
  res.sendStatus(204);
});`}
              </pre>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-brand-subtle uppercase font-bold tracking-wider">Security Engine Log</label>
              <pre className="code-box !border-brand-blue !text-brand-muted">
{`[06:02:11] 240 OPTIONS /api/create-script
[06:02:11] 201 POST /api/create-script - id: jT4kL2
[06:02:14] 200 GET /loader?id=jT4kL2... (VALID)
[06:02:15] 403 GET /loader (BLOCK: INVALID_UA)
[06:02:16] 403 GET /loader (REPLAYED NONCE)`}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-colors ${active ? 'text-brand-accent font-semibold' : 'text-brand-muted hover:text-white'}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatCard({ title, value, meta, metaColor = 'text-brand-accent' }: { title: string, value: string, meta: string, metaColor?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-brand-card border border-brand-border p-6 rounded-lg space-y-2"
    >
      <div className="text-[10px] text-brand-subtle uppercase tracking-widest font-bold">{title}</div>
      <div className="text-3xl font-bold text-white font-mono tracking-tight">{value}</div>
      <div className={`text-[11px] font-medium ${metaColor}`}>{meta}</div>
    </motion.div>
  );
}

function EndpointRow({ method, path, security, status, methodClass }: { method: string, path: string, security: string, status: string, methodClass: string }) {
  return (
    <div className="px-6 py-4 grid grid-cols-4 md:grid-cols-6 items-center hover:bg-white/[0.02] transition-colors border-t border-brand-border">
      <div className="col-span-1">
        <span className={`method-badge ${methodClass}`}>{method}</span>
      </div>
      <div className="col-span-1 md:col-span-3 font-mono text-xs text-[#CCC] truncate">{path}</div>
      <div className="hidden md:block">
        <span className="security-pill">{security}</span>
      </div>
      <div className="text-right font-mono text-xs text-brand-accent">{status}</div>
    </div>
  );
}

