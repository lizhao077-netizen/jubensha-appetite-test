import { MongoClient } from 'mongodb';

const allowedEvents = new Set(['page_view', 'test_started', 'answer_selected', 'test_completed', 'result_view', 'share_prompt_shown', 'image_generated', 'image_shared', 'share_card_view']);
const globalMongo = globalThis as typeof globalThis & { mongoClientPromise?: Promise<MongoClient> };

function client() {
  if (!globalMongo.mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not configured');
    globalMongo.mongoClientPromise = new MongoClient(uri).connect();
  }
  return globalMongo.mongoClientPromise;
}

function cors(req: any, res: any) {
  const origin = req.headers.origin;
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((value: string) => value.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: any, res: any) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const { event, payload = {}, visitorId, sentAt } = req.body || {};
  if (!allowedEvents.has(event) || typeof visitorId !== 'string' || visitorId.length > 128) return res.status(400).json({ error: 'invalid_event' });
  const serialized = JSON.stringify(payload);
  if (serialized.length > 4096) return res.status(413).json({ error: 'payload_too_large' });
  try {
    const mongo = await client();
    await mongo.db(process.env.MONGODB_DB || 'jubensha_appetite').collection('analytics_events').insertOne({
      event, visitorId, payload, sentAt: typeof sentAt === 'string' ? new Date(sentAt) : new Date(), createdAt: new Date(),
    });
    return res.status(204).end();
  } catch (error) {
    console.error('analytics insert failed', error);
    return res.status(503).json({ error: 'analytics_unavailable' });
  }
}
