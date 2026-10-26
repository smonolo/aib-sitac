import { Controller, Get } from '@nestjs/common'
import { getPool } from './db/index'

@Controller('health')
export class HealthController {
  @Get()
  async health() {
    await getPool().query('SELECT 1')
    return { ok: true }
  }
}
