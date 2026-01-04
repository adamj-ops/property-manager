import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'

// Supabase connection configuration
// Uses connection pooling (pgbouncer) for serverless environments
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Configure pg pool for Supabase
// Supabase uses pgbouncer in transaction mode
const pool = new pg.Pool({
  connectionString,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
})

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

const adapter = new PrismaPg(pool)
const useAdapter = process.env.PRISMA_USE_ADAPTER === 'true'

// Create Prisma client with adapter
const prismaClientSingleton = () => {
  const logConfig = process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn'] as ('query' | 'error' | 'warn')[]
    : ['error'] as ('error')[]

  if (useAdapter) {
    return new PrismaClient({
      // @ts-expect-error - PrismaPg adapter type compatibility
      adapter,
      log: logConfig,
    })
  }

  return new PrismaClient({
    log: logConfig,
  })
}

// Ensure single instance in development (hot reload)
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}

export { prisma }

// Export types for use in services
export type { PrismaClient } from '@prisma/client'
