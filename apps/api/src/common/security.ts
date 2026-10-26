import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-XSS-Protection', '0')
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

const SCRYPT_KEYLEN = 64

export function hashPassphrase(passphrase: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(passphrase, salt, SCRYPT_KEYLEN).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassphrase(passphrase: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const [, salt, expected] = parts
  if (!salt || !expected) return false
  const actual = scryptSync(passphrase, salt, SCRYPT_KEYLEN)
  const expectedBuf = Buffer.from(expected, 'hex')
  if (expectedBuf.length !== actual.length) return false
  return timingSafeEqual(actual, expectedBuf)
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
