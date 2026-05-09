import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { upsertRegistration, initDb } from './db';
import { sendTelegramMessage, formatMessage } from './telegram';
import { startPoller } from './poller';
import type { NotifyPayload } from './types';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const app = express();
app.use(cors());
app.use(express.json());

app.post('/register', async (req, res) => {
  const { walletAddress, chatId, brandAddresses } = req.body;
  if (!walletAddress || !chatId || !Array.isArray(brandAddresses)) {
    res.status(400).json({ error: 'walletAddress, chatId, brandAddresses[] required' });
    return;
  }
  try {
    await upsertRegistration({ walletAddress, chatId, brandAddresses });
    console.log(`[register] wallet=${walletAddress} chatId=${chatId} brands=${brandAddresses.length}`);
    res.json({ ok: true });
  } catch (e) {
    console.error('[register] failed:', e);
    res.status(500).json({ error: 'internal' });
  }
});

app.post('/notify', async (req, res) => {
  const { chatId, event, data } = req.body as NotifyPayload;
  if (!chatId || !event) {
    res.status(400).json({ error: 'chatId and event required' });
    return;
  }
  const text = formatMessage(event, data);
  await sendTelegramMessage(chatId, text);
  console.log(`[notify] event=${event} chatId=${chatId}`);
  res.json({ ok: true });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

async function main(): Promise<void> {
  await initDb();
  app.listen(PORT, () => {
    console.log(`[server] Listening on port ${PORT}`);
    startPoller();
  });
}

main().catch((e) => {
  console.error('[server] Fatal startup error:', e);
  process.exit(1);
});
