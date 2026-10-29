import { Subject } from 'rxjs'
import type { SitacEvent } from '@aib-sitac/core'

export type IncidentEventMessage = {
  incidentId: string
  event: SitacEvent
}

export type IncidentAccessChangedMessage = {
  incidentId: string
}

export const incidentEventBus = new Subject<IncidentEventMessage>()
export const incidentAccessChangedBus =
  new Subject<IncidentAccessChangedMessage>()
