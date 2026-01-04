// @ts-expect-error - ioredis may not be installed
import Redis from 'ioredis'

import { logger } from '~/libs/logger'

// Redis connection URL from environment
const REDIS_URL = process.env.REDIS_URL

if (!REDIS_URL) {
  throw new Error('REDIS_URL environment variable is not set')
}

// Create Redis client with connection string
export const redis = new Redis(REDIS_URL, {
  // Reconnect strategy
  retryStrategy: (times: number) => {
    if (times > 10) {
      logger.error('Redis: Max reconnection attempts reached')
      return null // Stop retrying
    }
    const delay = Math.min(times * 100, 3000)
    logger.warn(`Redis: Reconnecting in ${delay}ms (attempt ${times})`)
    return delay
  },

  // Connection options
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,

  // TLS settings for Redis Cloud (auto-detected from rediss:// protocol)
  // If using rediss:// protocol, TLS is automatically enabled
})

// Connection event handlers
redis.on('connect', () => {
  logger.info('Redis: Connected to server')
})

redis.on('ready', () => {
  logger.info('Redis: Ready to accept commands')
})

redis.on('error', (error: Error) => {
  logger.error('Redis: Connection error', { error: error.message })
})

redis.on('close', () => {
  logger.warn('Redis: Connection closed')
})

redis.on('reconnecting', () => {
  logger.info('Redis: Reconnecting...')
})

// Graceful shutdown helper
export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit()
    logger.info('Redis: Disconnected gracefully')
  } catch (error) {
    logger.error('Redis: Error during disconnect', { error })
    redis.disconnect()
  }
}

// Health check helper
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redis.ping()
    return pong === 'PONG'
  } catch {
    return false
  }
}

// Export Redis type alias
export type Redis = typeof redis
