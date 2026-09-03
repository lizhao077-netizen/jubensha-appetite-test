import { MongoClient } from 'mongodb';

const globalMongo = globalThis as typeof globalThis & { metricsMongoClientPromise?: Promise<MongoClient> };
function client() {
  if (!globalMongo.metricsMongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not configured');
    globalMongo.metricsMongoClientPromise = new MongoClient(uri).connect();
  }
  return globalMongo.metricsMongoClientPromise;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  if (!process.env.ANALYTICS_ADMIN_TOKEN || req.headers.authorization !== `Bearer ${process.env.ANALYTICS_ADMIN_TOKEN}`) return res.status(401).json({ error: 'unauthorized' });
  try {
    const mongo = await client();
    const [summary] = await mongo.db(process.env.MONGODB_DB || 'jubensha_appetite').collection('analytics_events').aggregate([
      { $facet: {
        visitors: [{ $group: { _id: '$visitorId' } }, { $count: 'value' }],
        eventCounts: [{ $group: { _id: '$event', value: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        resultLevels: [{ $match: { event: 'result_view' } }, { $group: { _id: '$payload.level', value: { $sum: 1 } } }, { $sort: { value: -1 } }],
        answerDistribution: [{ $match: { event: 'answer_selected' } }, { $group: { _id: { questionId: '$payload.questionId', answer: '$payload.answer' }, value: { $sum: 1 } } }, { $sort: { '_id.questionId': 1 } }],
      } },
    ]).toArray();
    return res.status(200).json({ visitors: summary.visitors[0]?.value || 0, eventCounts: summary.eventCounts, resultLevels: summary.resultLevels, answerDistribution: summary.answerDistribution });
  } catch (error) {
    console.error('metrics query failed', error);
    return res.status(503).json({ error: 'metrics_unavailable' });
  }
}
