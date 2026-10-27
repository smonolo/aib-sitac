import { Inject, Injectable } from '@nestjs/common'
import { asc, eq } from 'drizzle-orm'
import type {
  DeleteFeaturePayload,
  EventOp,
  SitacEvent,
  UpsertFeaturePayload,
} from '@aib-sitac/core'
import { events, getDb, type EventRow } from '../db/index'
import { MAX_EVENTS_PER_ROOM } from '../common/validation'
import { incidentEventBus } from './bus'
import { IncidentsService } from '../incidents/incidents.service'

type AppendPayload = UpsertFeaturePayload | DeleteFeaturePayload

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
    passphrase: string | undefined,
    ip?: string
  ): Promise<SitacEvent[]> {
    await this.incidents.assertAccess(incidentId, passphrase, ip)
    const rows = await getDb()
      .select()
      .from(events)
      .where(eq(events.incidentId, incidentId))
      .orderBy(asc(events.ts), asc(events.createdAt))
      .limit(MAX_EVENTS_PER_ROOM)
    return rows.map(toEvent)
  }

  async append(
    incidentId: string,
    passphrase: string | undefined,
    input: {
      op: Extract<EventOp, 'upsert_feature' | 'delete_feature'>
      payload: AppendPayload
      actorLabel?: string | null
    },
    ip?: string
  ): Promise<SitacEvent> {
    await this.incidents.assertAccess(incidentId, passphrase, ip)

    const [row] = await getDb()
      .insert(events)
      .values({
        incidentId,
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
