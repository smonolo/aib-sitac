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
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import type { Request } from 'express'
import { z } from 'zod'
import { RateLimiter, clientIp, tooManyRequests } from '../common/security'
import { parseUuidParam } from '../common/validation'
import { IncidentsService } from './incidents.service'

const createSchema = z
  .object({
    title: z.string().min(1).max(200),
    centerLng: z.number().finite().min(-180).max(180).optional(),
    centerLat: z.number().finite().min(-90).max(90).optional(),
    zoom: z.number().finite().min(1).max(19).optional(),
    passphrase: z.string().min(4).max(200).optional().nullable(),
  })
  .strict()

const updateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    passphrase: z.string().min(4).max(200).optional().nullable(),
  })
  .strict()
  .refine(data => data.title !== undefined || data.passphrase !== undefined, {
    message: 'Empty update',
  })

const listSchema = z
  .object({
    q: z.string().max(200).optional(),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict()

const createLimiter = new RateLimiter(20, 60_000)
const listLimiter = new RateLimiter(120, 60_000)
const getLimiter = new RateLimiter(120, 60_000)
const mutateLimiter = new RateLimiter(30, 60_000)

@Controller('incidents')
export class IncidentsController {
  constructor(
    @Inject(IncidentsService) private readonly incidents: IncidentsService
  ) {}

  @Post()
  async create(@Body() body: unknown, @Req() req: Request) {
    const ip = clientIp(req)
    if (!createLimiter.check(ip)) throw tooManyRequests()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      throw new HttpException('Invalid body', HttpStatus.BAD_REQUEST)
    }
    return this.incidents.create(parsed.data)
  }

  @Get()
  async list(@Query() query: Record<string, unknown>, @Req() req: Request) {
    if (!listLimiter.check(clientIp(req))) throw tooManyRequests()
    const parsed = listSchema.safeParse(query)
    if (!parsed.success) {
      throw new HttpException('Invalid query', HttpStatus.BAD_REQUEST)
    }
    return this.incidents.list(parsed.data)
  }

  @Get(':id')
  async get(
    @Param('id') id: string,
    @Headers('x-passphrase') passphrase: string | undefined,
    @Req() req: Request
  ) {
    const ip = clientIp(req)
    if (!getLimiter.check(ip)) throw tooManyRequests()
    return this.incidents.getAuthorized(parseUuidParam(id), passphrase, ip)
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('x-passphrase') passphrase: string | undefined,
    @Req() req: Request
  ) {
    const ip = clientIp(req)
    if (!mutateLimiter.check(ip)) throw tooManyRequests()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      throw new HttpException('Invalid body', HttpStatus.BAD_REQUEST)
    }
    return this.incidents.update(
      parseUuidParam(id),
      passphrase,
      parsed.data,
      ip
    )
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('x-passphrase') passphrase: string | undefined,
    @Req() req: Request
  ) {
    const ip = clientIp(req)
    if (!mutateLimiter.check(ip)) throw tooManyRequests()
    await this.incidents.delete(parseUuidParam(id), passphrase, ip)
    return { ok: true }
  }
}
