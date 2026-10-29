import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb)

export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-XSS-Protection', '0')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )
  next()
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const body = exception.getResponse()
      res
        .status(status)
        .json(
          typeof body === 'string'
            ? { statusCode: status, message: body }
            : body
        )
      return
    }

    console.error(exception)
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    })
  }
}

export function clientIp(req: Request | undefined): string {
  return req?.ip || req?.socket?.remoteAddress || 'unknown'
}

export function tooManyRequests(): HttpException {
  return new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS)
}

const SCRYPT_KEYLEN = 64
const SCRYPT_MAX_INFLIGHT = 8
let scryptInflight = 0

async function withScryptSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (scryptInflight >= SCRYPT_MAX_INFLIGHT) {
    throw tooManyRequests()
  }
  scryptInflight += 1
  try {
    return await fn()
  } finally {
    scryptInflight -= 1
  }
}

export const PASSPHRASE_MIN_LENGTH = 4
export const PASSPHRASE_MAX_LENGTH = 200

export function normalizePassphraseHeader(
  value: string | string[] | undefined
): string | undefined {
  if (value == null) return undefined
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || raw.length === 0) return undefined
  if (raw.length > PASSPHRASE_MAX_LENGTH) {
    return 'x'.repeat(PASSPHRASE_MAX_LENGTH + 1)
  }
  return raw
}

export async function hashPassphrase(passphrase: string): Promise<string> {
  return withScryptSlot(async () => {
    const salt = randomBytes(16).toString('hex')
    const hash = (await scrypt(passphrase, salt, SCRYPT_KEYLEN)) as Buffer
    return `scrypt$${salt}$${hash.toString('hex')}`
  })
}

export async function verifyPassphrase(
  passphrase: string,
  stored: string
): Promise<boolean> {
  if (passphrase.length === 0 || passphrase.length > PASSPHRASE_MAX_LENGTH) {
    return false
  }
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const [, salt, expected] = parts
  if (!salt || !expected) return false
  return withScryptSlot(async () => {
    const actual = (await scrypt(passphrase, salt, SCRYPT_KEYLEN)) as Buffer
    const expectedBuf = Buffer.from(expected, 'hex')
    if (expectedBuf.length !== actual.length) return false
    return timingSafeEqual(actual, expectedBuf)
  })
}

export class RateLimiter {
  private readonly hits = new Map<string, number[]>()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  check(key: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs
    const prev = this.hits.get(key)
    const recent = prev ? prev.filter(t => t >= windowStart) : []
    if (recent.length >= this.limit) {
      this.hits.set(key, recent)
      return false
    }
    recent.push(now)
    this.hits.set(key, recent)
    if (this.hits.size > 10_000) this.prune(windowStart)
    return true
  }

  private prune(windowStart: number) {
    for (const [key, times] of this.hits) {
      const recent = times.filter(t => t >= windowStart)
      if (recent.length === 0) this.hits.delete(key)
      else this.hits.set(key, recent)
    }
  }
}

export class ConnectionTracker {
  private readonly counts = new Map<string, number>()

  constructor(private readonly maxPerKey: number) {}

  tryAcquire(key: string): boolean {
    const current = this.counts.get(key) ?? 0
    if (current >= this.maxPerKey) return false
    this.counts.set(key, current + 1)
    return true
  }

  release(key: string): void {
    const current = this.counts.get(key) ?? 0
    if (current <= 1) this.counts.delete(key)
    else this.counts.set(key, current - 1)
  }
}

export const passphraseVerifyLimiter = new RateLimiter(60, 60_000)
export const passphraseFailLimiter = new RateLimiter(30, 15 * 60_000)
