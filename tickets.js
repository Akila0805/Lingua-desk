// Replaces the artifact-only window.storage API with real persistence.
// Uses Upstash Redis (via Vercel's Marketplace integration) so all visitors
// share the same live ticket queue. Falls back to a plain in-memory array
// if no Redis integration is configured yet, so the app still works for a
// single session before you set up storage — data just won't survive a
// serverless cold start in that fallback mode.

import { Redis } from '@upstash/redis';

const KEY = 'linguadesk-tickets-v1';
let memoryFallback = [];
let redis = null;

function getRedis() {
  if (redis) return redis;
  // Vercel's Upstash integration sets KV_REST_API_URL/TOKEN on older
  // connections and UPSTASH_REDIS_REST_URL/TOKEN on newer ones — support both.
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export default async function handler(req, res) {
  const store = getRedis();

  if (req.method === 'GET') {
    try {
      const value = store ? await store.get(KEY) : memoryFallback;
      res.status(200).json(value || []);
    } catch (e) {
      res.status(200).json(memoryFallback);
    }
    return;
  }

  if (req.method === 'POST') {
    const tickets = req.body;
    if (!Array.isArray(tickets)) {
      res.status(400).json({ error: 'Request body must be an array of tickets' });
      return;
    }
    try {
      if (store) await store.set(KEY, tickets);
      memoryFallback = tickets;
      res.status(200).json({ ok: true, persisted: !!store });
    } catch (e) {
      memoryFallback = tickets;
      res.status(200).json({ ok: true, persisted: false, warning: e.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
