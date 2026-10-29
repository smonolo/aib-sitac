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
import {
  ConnectionTracker,
  RateLimiter,
  clientIp,
  normalizePassphraseHeader,
  tooManyRequests,
} from '../common/security'
import {
  appendEventSchema,
  assertPayloadSize,
  parseUuidParam,
} from '../common/validation'
import { IncidentsService } from '../incidents/incidents.service'
import { incidentAccessChangedBus, incidentEventBus } from './bus'
import { EventsService } from './events.service'

const appendLimiter = new RateLimiter(120, 60_000)
const listLimiter = new RateLimiter(180, 60_000)
const sseConnectLimiter = new RateLimiter(30, 60_000)
const sseByIp = new ConnectionTracker(20)
const sseByRoom = new ConnectionTracker(50)

@Controller('incidents/:incidentId/events')
export class EventsController {
  constructor(
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(IncidentsService) private readonly incidents: IncidentsService
  ) {}

  @Get()
  async list(
    @Param('incidentId') incidentId: string,
    @Headers('x-passphrase') passphraseHeader: string | string[] | undefined,
    @Req() req: Request
  ) {
    const id = parseUuidParam(incidentId)
    const ip = clientIp(req)
    if (!listLimiter.check(`${ip}:${id}`)) throw tooManyRequests()
    return this.events.list(id, normalizePassphraseHeader(passphraseHeader), ip)
  }

  @Post()
  async append(
    @Param('incidentId') incidentId: string,
    @Body() body: unknown,
    @Headers('x-passphrase') passphraseHeader: string | string[] | undefined,
    @Req() req: Request
  ) {
    const id = parseUuidParam(incidentId)
    const ip = clientIp(req)
    if (!appendLimiter.check(`${ip}:${id}`)) throw tooManyRequests()

    const parsed = appendEventSchema.safeParse(body)
    if (!parsed.success) {
      throw new HttpException('Invalid body', HttpStatus.BAD_REQUEST)
    }

    try {
      assertPayloadSize(parsed.data.payload)
    } catch {
      throw new HttpException('Invalid body', HttpStatus.BAD_REQUEST)
    }

    return this.events.append(
      id,
      normalizePassphraseHeader(passphraseHeader),
      {
        op: parsed.data.op,
        payload: parsed.data.payload,
        actorLabel: parsed.data.actorLabel,
      },
      ip
    )
  }

  @Sse('stream')
  async stream(
    @Param('incidentId') incidentId: string,
    @Headers('x-passphrase') passphraseHeader: string | string[] | undefined,
    @Req() req: Request
  ): Promise<Observable<MessageEvent>> {
    const id = parseUuidParam(incidentId)
    const ip = clientIp(req)
    if (!sseConnectLimiter.check(`${ip}:${id}`)) throw tooManyRequests()

    await this.incidents.assertAccess(
      id,
      normalizePassphraseHeader(passphraseHeader),
      ip
    )

    const ipKey = `ip:${ip}`
    const roomKey = `room:${id}`
    if (!sseByIp.tryAcquire(ipKey)) throw tooManyRequests()
    if (!sseByRoom.tryAcquire(roomKey)) {
      sseByIp.release(ipKey)
      throw tooManyRequests()
    }

    return new Observable<MessageEvent>(subscriber => {
      let cleaned = false
      const cleanup = () => {
        if (cleaned) return
        cleaned = true
        eventSub.unsubscribe()
        accessSub.unsubscribe()
        sseByIp.release(ipKey)
        sseByRoom.release(roomKey)
        req.off('close', onClose)
        req.off('aborted', onClose)
      }

      const eventSub = incidentEventBus
        .pipe(
          filter(msg => msg.incidentId === id),
          map(msg => ({ data: msg.event }) satisfies MessageEvent)
        )
        .subscribe({
          next: value => subscriber.next(value),
          error: err => {
            cleanup()
            subscriber.error(err)
          },
          complete: () => {
            cleanup()
            subscriber.complete()
          },
        })

      const accessSub = incidentAccessChangedBus
        .pipe(filter(msg => msg.incidentId === id))
        .subscribe(() => {
          cleanup()
          subscriber.complete()
        })

      const onClose = () => {
        cleanup()
        if (!subscriber.closed) subscriber.complete()
      }

      req.on('close', onClose)
      req.on('aborted', onClose)

      return cleanup
    })
  }
}
