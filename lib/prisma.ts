import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Neon's pooled URL already runs PgBouncer, so Prisma only needs one connection
// per serverless instance — asking for the default 5 just creates contention at
// the pooler and times out on cold starts (e.g. the 02:00 UTC cron after idle).
function buildPrismaUrl(): string | undefined {
  const base = process.env.POSTGRES_PRISMA_URL
  if (!base) return undefined
  if (base.includes('pool_timeout=') || base.includes('connection_limit=')) return base
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}connection_limit=1&pool_timeout=60&connect_timeout=30`
}

const url = buildPrismaUrl()

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
    ...(url ? { datasources: { db: { url } } } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Retry a Prisma call when it fails with a transient connection-level error —
// most commonly Neon scaling from zero on the first query of the day. We check
// both Prisma's structured `code` and the human message because some Neon-via-
// pooler errors arrive without a Prisma code attached.
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  label: string = 'db',
  attempts: number = 4
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const code = (err as { code?: string } | null)?.code ?? ''
      const isTransient =
        ['P1001', 'P1002', 'P1008', 'P1017', 'P2024'].includes(code) ||
        /connection pool|timed out|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|terminated|connect_timeout|Can't reach database|Server has closed the connection/i.test(msg)
      if (!isTransient || i === attempts - 1) throw err
      const delay = 2000 * Math.pow(2, i) // 2s, 4s, 8s, 16s — total ~30s
      console.warn(`[db-retry] ${label} attempt ${i + 1} failed (${msg.slice(0, 160)}); retrying in ${delay}ms`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  // Unreachable — loop either returns or throws on the last attempt.
  throw new Error('withDbRetry: exhausted')
}
