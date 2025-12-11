import { createClient, RedisClientType } from 'redis';

// Global Redis client instance
let redisClient: RedisClientType | null = null;

// Initialize Redis client
const initializeRedis = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    // Return a mock client for development if Redis is not available
    return createMockRedisClient();
  }
};

// Mock Redis client for development when Redis is not available
const createMockRedisClient = (): RedisClientType => {
  const cache = new Map<string, { value: string; expires: number }>();
  
  return {
    get: async (key: string) => {
      const item = cache.get(key);
      if (!item) return null;
      
      if (Date.now() > item.expires) {
        cache.delete(key);
        return null;
      }
      
      return item.value;
    },
    set: async (key: string, value: string, options?: { EX?: number }) => {
      const expires = options?.EX ? Date.now() + (options.EX * 1000) : Date.now() + (600 * 1000); // Default 10 minutes
      cache.set(key, { value, expires });
      return 'OK';
    },
    del: async (key: string) => {
      cache.delete(key);
      return 1;
    },
    disconnect: async () => {
      cache.clear();
    },
    // Add other required methods as no-ops
    connect: async () => {},
    on: () => {},
    off: () => {},
    quit: async () => {},
    ping: async () => 'PONG',
    flushAll: async () => 'OK',
    exists: async () => 0,
    expire: async () => 0,
    ttl: async () => -1,
    keys: async () => [],
    mGet: async () => [],
    mSet: async () => 'OK',
    hGet: async () => null,
    hSet: async () => 0,
    hGetAll: async () => ({}),
    hDel: async () => 0,
    lPush: async () => 0,
    rPush: async () => 0,
    lPop: async () => null,
    rPop: async () => null,
    lLen: async () => 0,
    sAdd: async () => 0,
    sRem: async () => 0,
    sMembers: async () => [],
    sIsMember: async () => false,
    zAdd: async () => 0,
    zRem: async () => 0,
    zRange: async () => [],
    zRangeByScore: async () => [],
    zScore: async () => null,
    zRank: async () => null,
    zRevRank: async () => null,
    zCount: async () => 0,
    zCard: async () => 0,
    publish: async () => 0,
    subscribe: async () => {},
    unsubscribe: async () => {},
    pSubscribe: async () => {},
    pUnsubscribe: async () => {},
    isOpen: true,
    isReady: true,
    v4: {
      sendCommand: async () => null,
    },
  } as RedisClientType;
};

// Cache utility functions
export const cache = {
  /**
   * Get a value from cache
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const client = await initializeRedis();
      const value = await client.get(key);
      
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set a value in cache with TTL
   */
  set: async <T>(key: string, value: T, ttlSeconds: number = 600): Promise<boolean> => {
    try {
      const client = await initializeRedis();
      const serialized = JSON.stringify(value);
      await client.set(key, serialized, { EX: ttlSeconds });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Delete a value from cache
   */
  del: async (key: string): Promise<boolean> => {
    try {
      const client = await initializeRedis();
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  /**
   * Clear all cache entries with a specific prefix
   */
  clearByPrefix: async (prefix: string): Promise<boolean> => {
    try {
      const client = await initializeRedis();
      const keys = await client.keys(`${prefix}*`);
      
      if (keys.length > 0) {
        await client.del(keys);
      }
      
      return true;
    } catch (error) {
      console.error('Cache clear by prefix error:', error);
      return false;
    }
  }
};

// Cache key constants
export const CACHE_KEYS = {
  COMMUNITY_HUB_DATA: 'community_hub_data',
  FEATURED_STORY: 'featured_story',
  LATEST_STORIES: 'latest_stories',
  TRENDING_TAGS: 'trending_tags',
  TOP_AUTHORS: 'top_authors',
  COMMUNITY_STATS: 'community_stats',
} as const;

export default cache;
