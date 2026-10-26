import { Module, OnModuleInit } from '@nestjs/common'
import { ensureSchema } from './db/index'
import { HealthController } from './health.controller'
import { IncidentsController } from './incidents/incidents.controller'
import { IncidentsService } from './incidents/incidents.service'
import { EventsController } from './events/events.controller'
import { EventsService } from './events/events.service'

@Module({
  controllers: [HealthController, IncidentsController, EventsController],
  providers: [IncidentsService, EventsService],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    await ensureSchema()
  }
}
