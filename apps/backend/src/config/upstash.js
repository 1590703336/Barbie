import { Redis } from '@upstash/redis';
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NODE_ENV } from './env.js';

let redis = null;

if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('[UPSTASH] Redis client initialized');
} else if (NODE_ENV === 'development') {
  console.warn('[UPSTASH] Redis credentials not configured. Using in-memory fallback for development.');
} else {
  console.error('[UPSTASH] Redis credentials required in production!');
}

export default redis;
