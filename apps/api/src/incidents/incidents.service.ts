import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DEFAULT_CENTER, type SitacIncident } from '@aib-sitac/core'
import { getDb, incidents, type IncidentRow } from '../db/index'
import { hashPassphrase, verifyPassphrase } from '../common/security'

function toIncident(row: IncidentRow): SitacIncident {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    centerLng: row.centerLng,
    centerLat: row.centerLat,
    zoom: row.zoom,
    hasPassphrase: Boolean(row.passphraseHash),
    schemaVersion: row.schemaVersion,
  }
}

@Injectable()
export class IncidentsService {
  async create(input: {
    title: string
    centerLng?: number
    centerLat?: number
    zoom?: number
    passphrase?: string | null
  }): Promise<SitacIncident> {
    const hash =
      input.passphrase && input.passphrase.length > 0
        ? hashPassphrase(input.passphrase)
        : null

    const [row] = await getDb()
      .insert(incidents)
      .values({
        title: input.title.trim() || 'Incidente',
        centerLng: input.centerLng ?? DEFAULT_CENTER.lng,
        centerLat: input.centerLat ?? DEFAULT_CENTER.lat,
        zoom: input.zoom ?? DEFAULT_CENTER.zoom,
        passphraseHash: hash,
      })
      .returning()

    if (!row) throw new Error('Failed to create incident')
    return toIncident(row)
  }

  async getRaw(id: string): Promise<IncidentRow> {
    const [row] = await getDb()
      .select()
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1)
    if (!row) throw new NotFoundException('Incident not found')
    return row
  }

  async getAuthorized(
    id: string,
    passphrase: string | undefined
  ): Promise<SitacIncident> {
    return toIncident(await this.assertAccess(id, passphrase))
  }

  async assertAccess(
    id: string,
    passphrase: string | undefined
  ): Promise<IncidentRow> {
    const row = await this.getRaw(id)
    if (!row.passphraseHash) return row
    if (!passphrase) {
      throw new UnauthorizedException('Passphrase required')
    }
    if (!verifyPassphrase(passphrase, row.passphraseHash)) {
      throw new ForbiddenException('Invalid passphrase')
    }
    return row
  }

  async delete(id: string, passphrase: string | undefined): Promise<void> {
    await this.assertAccess(id, passphrase)
    await getDb().delete(incidents).where(eq(incidents.id, id))
  }
}
