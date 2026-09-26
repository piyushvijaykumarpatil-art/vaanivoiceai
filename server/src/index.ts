import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { chatRouter } from './routes/chat.js';
import { ttsRouter } from './routes/tts.js';
import { sessionsRouter } from './routes/sessions.js';
import { syncRouter } from './routes/sync.js';
import { metaRouter } from './routes/feedback.js';
import { localDb } from './db/acidEngine.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[VAANI SERVER] ${req.method} ${req.url}`);
  next();
});

// Mount API routes
app.use('/api/chat', chatRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/sync', syncRouter);
app.use('/api', metaRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const db = await localDb.readDatabase();
    res.json({
      status: 'online',
      edition: 'Vaani — Imperial Edition (The Sovereign Voice AI Experience)',
      creator: 'Piyush • NIAT 1st Year Student',
      timestamp: new Date().toISOString(),
      stats: {
        sessionCount: db.sessions.length,
        memoryCount: db.memories.length,
        feedbackCount: db.feedbacks.length,
        knowledgeCount: db.knowledge.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'degraded', error: err.message });
  }
});

// WebSocket real-time connection handler
wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] Sovereign client connected');

  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to Vaani Imperial Neural Engine',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch {
      // Ignore unformatted socket messages
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Sovereign client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ═══════════════════════════════════════════════════════════════
  👑 VAANI • IMPERIAL EDITION — "The Sovereign Voice AI Experience"
  🚀 Made by Piyush • NIAT 1st Year Student
  ═══════════════════════════════════════════════════════════════
  📡 Backend Server running on http://localhost:${PORT}
  🔊 Neural TTS Pipeline: Active (msedge-tts + Google Fallback)
  💾 Dual-Layer Persistence: Local ACID JSON Engine active
  🌐 Supabase Cloud: Ready (https://zjqkcyrsqkzkvztgrcnx.supabase.co)
  ═══════════════════════════════════════════════════════════════
  `);
});
