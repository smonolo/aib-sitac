import { Subject } from 'rxjs'
import type { SitacEvent } from '@aib-sitac/core'

export type IncidentEventMessage = {
  incidentId: string
  event: SitacEvent
}

export const incidentEventBus = new Subject<IncidentEventMessage>()
