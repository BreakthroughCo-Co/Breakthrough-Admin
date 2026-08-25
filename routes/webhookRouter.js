import express from 'express';
import { processChatTurn } from '../services/chatService.js';

const router = express.Router();

router.post('/api/webhooks/17hats', async (req, res) => {
  const event = req.body;

  // Immediately acknowledge receipt to 17hats
  res.status(200).send({ received: true });

  try {
    // Construct prompt payload from webhook payload for Gemini background processing
    const prompt = `Webhook Alert (17hats): Event "${event.event_name}" received. Client Data: ${JSON.stringify(event.data)}. Execute any necessary sync tasks.`;
    
    const aiResponse = await processChatTurn('system-automation', prompt);
    console.log('Automated Processing Result:', aiResponse);
  } catch (error) {
    console.error('Failed to process 17hats webhook:', error);
  }
});

export default router;
