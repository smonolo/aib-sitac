import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  MessageEvent,
  Param,
  Post,
  Req,
  Sse,
} from '@nestjs/common'
import type { Request } from 'express'
import { Observable, filter, map } from 'rxjs'
import { z } from 'zod'
import { EVENT_OPS, type SitacEventPayload } from '@aib-sitac/core'
import { RateLimiter } from '../common/security'
import { IncidentsService } from '../incidents/incidents.service'
import { incidentEventBus } from './bus'
import { EventsService } from './events.service'

const appendSchema = z.object({
  op: z.enum(EVENT_OPS),
  payload: z.record(z.string(), z.unknown()),
  actorLabel: z.string().max(100).optional().nullable(),
  ts: z.string().datetime().optional().nullable(),
})

const appendLimiter = new RateLimiter(120, 60_000)

@Controller('incidents/:incidentId/events')
export class EventsController {
  constructor(
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(IncidentsService) private readonly incidents: IncidentsService
  ) {}

  @Get()
  async list(
    @Param('incidentId') incidentId: string,
    @Headers('x-passphrase') passphrase?: string
  ) {
    return this.events.list(incidentId, passphrase)
  }

  @Post()
  async append(
    @Param('incidentId') incidentId: string,
    @Body() body: unknown,
    @Headers('x-passphrase') passphrase?: string,
    @Req() req?: Request
  ) {
    const ip = req?.ip ?? 'unknown'
    if (!appendLimiter.check(`${ip}:${incidentId}`)) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS)
    }
    const parsed = appendSchema.safeParse(body)
    if (!parsed.success) {
      throw new HttpException('Invalid body', HttpStatus.BAD_REQUEST)
    }
    return this.events.append(incidentId, passphrase, {
      op: parsed.data.op,
      payload: parsed.data.payload as SitacEventPayload,
      actorLabel: parsed.data.actorLabel,
      ts: parsed.data.ts,
    })
  }

  @Sse('stream')
  async stream(
    @Param('incidentId') incidentId: string,
    @Headers('x-passphrase') passphrase?: string
  ): Promise<Observable<MessageEvent>> {
    await this.incidents.assertAccess(incidentId, passphrase)
    return incidentEventBus.pipe(
      filter(msg => msg.incidentId === incidentId),
      map(msg => ({ data: msg.event }) satisfies MessageEvent)
    )
  }
}
