import { Controller, Get, Req } from '@nestjs/common'
import type { Request } from 'express'
import { RateLimiter, clientIp, tooManyRequests } from './common/security'
import { getPool } from './db/index'

const healthLimiter = new RateLimiter(60, 60_000)

@Controller('health')
export class HealthController {
  @Get()
  async health(@Req() req: Request) {
    if (!healthLimiter.check(clientIp(req))) throw tooManyRequests()
    await getPool().query('SELECT 1')
    return { ok: true }
  }
}
