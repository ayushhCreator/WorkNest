import redis from '../config/redis.js';

/**
 * Cache middleware
 * @param {number} duration - Cache duration in seconds
 */
export const cache = (duration) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const userId = req.user ? req.user._id.toString() : 'public';
    const key = `cache:${userId}:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redis.get(key);

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      // Store original send function
      const originalSend = res.json;

      // Override send function to cache response
      res.json = (body) => {
        // Restore original send
        res.json = originalSend;

        // Cache the response
        redis.set(key, JSON.stringify(body), 'EX', duration).catch((err) => {
          console.error('Redis cache error:', err);
        });

        // Send response
        return res.json(body);
      };

      next();
    } catch (error) {
      console.error('Redis cache middleware error:', error);
      next();
    }
  };
};

export const clearCache = async (pattern) => {
  try {
    const keys = await redis.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Redis clear cache error:', error);
  }
};
