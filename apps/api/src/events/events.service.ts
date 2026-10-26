import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { asc, eq } from 'drizzle-orm'
import {
  EVENT_OPS,
  type EventOp,
  type SitacEvent,
  type SitacEventPayload,
} from '@aib-sitac/core'
import { events, getDb, type EventRow } from '../db/index'
import { incidentEventBus } from './bus'
import { IncidentsService } from '../incidents/incidents.service'

function toEvent(row: EventRow): SitacEvent {
  return {
    id: row.id,
    incidentId: row.incidentId,
    ts: row.ts.toISOString(),
    actorLabel: row.actorLabel,
    op: row.op,
    payload: row.payload,
  } as SitacEvent
}

@Injectable()
export class EventsService {
  constructor(
    @Inject(IncidentsService) private readonly incidents: IncidentsService
  ) {}

  async list(
    incidentId: string,
    passphrase: string | undefined
  ): Promise<SitacEvent[]> {
    await this.incidents.assertAccess(incidentId, passphrase)
    const rows = await getDb()
      .select()
      .from(events)
      .where(eq(events.incidentId, incidentId))
      .orderBy(asc(events.ts), asc(events.createdAt))
    return rows.map(toEvent)
  }

  async append(
    incidentId: string,
    passphrase: string | undefined,
    input: {
      op: EventOp
      payload: SitacEventPayload
      actorLabel?: string | null
      ts?: string | null
    }
  ): Promise<SitacEvent> {
    await this.incidents.assertAccess(incidentId, passphrase)

    if (!EVENT_OPS.includes(input.op)) {
      throw new BadRequestException('Invalid event op')
    }
    if (!input.payload || typeof input.payload !== 'object') {
      throw new BadRequestException('Invalid payload')
    }

    const [row] = await getDb()
      .insert(events)
      .values({
        incidentId,
        ts: input.ts ? new Date(input.ts) : undefined,
        actorLabel: input.actorLabel?.trim() || null,
        op: input.op,
        payload: input.payload,
      })
      .returning()

    if (!row) throw new Error('Failed to append event')
    const event = toEvent(row)
    incidentEventBus.next({ incidentId, event })
    return event
  }
}
