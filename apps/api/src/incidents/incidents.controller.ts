import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common'
import type { Request } from 'express'
import { z } from 'zod'
import { RateLimiter } from '../common/security'
import { IncidentsService } from './incidents.service'

const createSchema = z.object({
  title: z.string().min(1).max(200),
  centerLng: z.number().min(-180).max(180).optional(),
  centerLat: z.number().min(-90).max(90).optional(),
  zoom: z.number().min(1).max(22).optional(),
  passphrase: z.string().min(4).max(200).optional().nullable(),
})

const createLimiter = new RateLimiter(20, 60_000)

@Controller('incidents')
export class IncidentsController {
  constructor(
    @Inject(IncidentsService) private readonly incidents: IncidentsService
  ) {}

  @Post()
  async create(@Body() body: unknown, @Req() req: Request) {
    const ip = req.ip ?? 'unknown'
    if (!createLimiter.check(ip)) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS)
    }
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      throw new HttpException('Invalid body', HttpStatus.BAD_REQUEST)
    }
    return this.incidents.create(parsed.data)
  }

  @Get(':id')
  async get(
    @Param('id') id: string,
    @Headers('x-passphrase') passphrase?: string
  ) {
    return this.incidents.getAuthorized(id, passphrase)
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('x-passphrase') passphrase?: string
  ) {
    await this.incidents.delete(id, passphrase)
    return { ok: true }
  }
}
