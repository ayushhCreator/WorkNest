import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redis = null;

// Only connect to Redis if URL is provided
if (process.env.REDIS_URI) {
  const redisUrl = process.env.REDIS_URI;
  
  redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
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
} else {
  console.log('Redis not configured - running without cache');
}

export default redis;
