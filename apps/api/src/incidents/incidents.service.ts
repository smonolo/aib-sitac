import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { and, count, desc, eq, ilike, sql, type SQL } from 'drizzle-orm'
import {
  DEFAULT_CENTER,
  ROME_TZ,
  type ListIncidentsQuery,
  type ListIncidentsResult,
  type SitacIncident,
} from '@aib-sitac/core'
import { getDb, incidents, type IncidentRow } from '../db/index'
import {
  hashPassphrase,
  passphraseFailLimiter,
  passphraseVerifyLimiter,
  tooManyRequests,
  verifyPassphrase,
} from '../common/security'

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

function isLikelyDbInputError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const code = 'code' in err ? String((err as { code?: unknown }).code) : ''
  return code === '22P02' || code === '22P05'
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
        ? await hashPassphrase(input.passphrase)
        : null

    const [row] = await getDb()
      .insert(incidents)
      .values({
        title: input.title.trim() || 'Intervento',
        centerLng: input.centerLng ?? DEFAULT_CENTER.lng,
        centerLat: input.centerLat ?? DEFAULT_CENTER.lat,
        zoom: input.zoom ?? DEFAULT_CENTER.zoom,
        passphraseHash: hash,
      })
      .returning()

    if (!row) throw new Error('Failed to create incident')
    return toIncident(row)
  }

  async list(query: ListIncidentsQuery = {}): Promise<ListIncidentsResult> {
    const page = Math.max(1, Math.floor(query.page ?? 1))
    const pageSize = Math.min(Math.max(Math.floor(query.pageSize ?? 10), 1), 50)
    const filters: SQL[] = []

    const q = query.q?.trim()
    if (q) {
      filters.push(ilike(incidents.title, `%${q.replace(/[%_]/g, '')}%`))
    }

    if (query.from) {
      filters.push(
        sql`(${incidents.createdAt} AT TIME ZONE ${ROME_TZ})::date >= ${query.from}::date`
      )
    }

    if (query.to) {
      filters.push(
        sql`(${incidents.createdAt} AT TIME ZONE ${ROME_TZ})::date <= ${query.to}::date`
      )
    }

    const where = filters.length > 0 ? and(...filters) : undefined
    const db = getDb()

    const [totalRow] = await db
      .select({ value: count() })
      .from(incidents)
      .where(where)
    const total = Number(totalRow?.value ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)

    const rows = await db
      .select()
      .from(incidents)
      .where(where)
      .orderBy(desc(incidents.createdAt))
      .limit(pageSize)
      .offset((safePage - 1) * pageSize)

    return {
      items: rows.map(toIncident),
      page: safePage,
      pageSize,
      total,
      totalPages,
    }
  }

  async getRaw(id: string): Promise<IncidentRow> {
    try {
      const [row] = await getDb()
        .select()
        .from(incidents)
        .where(eq(incidents.id, id))
        .limit(1)
      if (!row) throw new NotFoundException('Incident not found')
      return row
    } catch (err) {
      if (err instanceof HttpException) throw err
      if (isLikelyDbInputError(err)) {
        throw new NotFoundException('Incident not found')
      }
      throw err
    }
  }

  async getAuthorized(
    id: string,
    passphrase: string | undefined,
    ip?: string
  ): Promise<SitacIncident> {
    return toIncident(await this.assertAccess(id, passphrase, ip))
  }

  async assertAccess(
    id: string,
    passphrase: string | undefined,
    ip = 'unknown'
  ): Promise<IncidentRow> {
    const row = await this.getRaw(id)
    if (!row.passphraseHash) return row
    if (!passphrase) {
      throw new UnauthorizedException('Password required')
    }

    if (!passphraseVerifyLimiter.check(`verify:${ip}`)) {
      throw tooManyRequests()
    }

    let ok = false
    try {
      ok = await verifyPassphrase(passphrase, row.passphraseHash)
    } catch (err) {
      if (err instanceof HttpException) throw err
      throw err
    }

    if (!ok) {
      if (!passphraseFailLimiter.check(`fail:${ip}:${id}`)) {
        throw tooManyRequests()
      }
      throw new ForbiddenException('Invalid password')
    }
    return row
  }

  async update(
    id: string,
    passphrase: string | undefined,
    input: {
      title?: string
      passphrase?: string | null
    },
    ip?: string
  ): Promise<SitacIncident> {
    await this.assertAccess(id, passphrase, ip)

    const patch: Partial<Pick<IncidentRow, 'title' | 'passphraseHash'>> = {}

    if (input.title !== undefined) {
      const trimmed = input.title.trim()
      if (!trimmed) {
        throw new BadRequestException('Title required')
      }
      patch.title = trimmed
    }

    if (input.passphrase !== undefined) {
      if (input.passphrase === null || input.passphrase === '') {
        patch.passphraseHash = null
      } else {
        patch.passphraseHash = await hashPassphrase(input.passphrase)
      }
    }

    if (Object.keys(patch).length === 0) {
      return toIncident(await this.getRaw(id))
    }

    const [row] = await getDb()
      .update(incidents)
      .set(patch)
      .where(eq(incidents.id, id))
      .returning()

    if (!row) throw new NotFoundException('Incident not found')
    return toIncident(row)
  }

  async delete(
    id: string,
    passphrase: string | undefined,
    ip?: string
  ): Promise<void> {
    await this.assertAccess(id, passphrase, ip)
    await getDb().delete(incidents).where(eq(incidents.id, id))
  }
}
