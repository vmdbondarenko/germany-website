import { spawnSync } from 'child_process'

const MAX_ATTEMPTS = 5
const BASE_DELAY_MS = 3000

function runOnce(n) {
  console.log(`[migrate-deploy] attempt ${n}/${MAX_ATTEMPTS}`)
  const r = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    encoding: 'utf8',
  })
  if (r.stdout) process.stdout.write(r.stdout)
  if (r.stderr) process.stderr.write(r.stderr)
  if (r.status === 0) return { ok: true }
  const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`
  const isColdStart = /P1001|Can't reach database server|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|connection (?:refused|timed out)/i.test(out)
  return { ok: false, retry: isColdStart, status: r.status ?? 1 }
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

let lastStatus = 1
for (let n = 1; n <= MAX_ATTEMPTS; n++) {
  const r = runOnce(n)
  if (r.ok) process.exit(0)
  lastStatus = r.status
  if (!r.retry) {
    console.error('[migrate-deploy] non-connection error — failing fast')
    process.exit(lastStatus)
  }
  if (n < MAX_ATTEMPTS) {
    const delay = BASE_DELAY_MS * Math.pow(2, n - 1)
    console.error(`[migrate-deploy] DB cold-start detected — retrying in ${Math.round(delay / 1000)}s`)
    await sleep(delay)
  }
}
console.error(`[migrate-deploy] failed after ${MAX_ATTEMPTS} attempts`)
process.exit(lastStatus)
