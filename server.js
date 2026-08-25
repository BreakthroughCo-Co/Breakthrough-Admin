// server.js
import express from 'express';
import xeroRouter from './routes/xeroRouter.js';
import webhookRouter from './routes/webhookRouter.js';
import { processChatTurn } from './services/chatService.js';

const app = express();
app.use(express.json());

// Mount Routers
app.use(xeroRouter);
app.use(webhookRouter);

// Endpoint for conversational UI interactions
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  try {
    const reply = await processChatTurn(sessionId || 'default-user', message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
