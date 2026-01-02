import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URI || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    // Retry connection with exponential backoff
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;
