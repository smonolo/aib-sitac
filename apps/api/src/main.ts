import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { json, urlencoded } from 'express'
import { AppModule } from './module'
import {
  GlobalExceptionFilter,
  securityHeadersMiddleware,
} from './common/security'

function resolveCorsOrigin(): boolean | string | string[] {
  const raw = process.env.CORS_ORIGIN?.trim()
  const isProd = process.env.NODE_ENV === 'production'

  if (!raw || raw === 'true') {
    if (isProd) {
      throw new Error(
        'CORS_ORIGIN must be an explicit origin (or comma-separated list) in production'
      )
    }
    return true
  }
  if (raw === 'false') return false
  if (raw.includes(',')) {
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }
  return raw
}

function applyTrustProxy(app: {
  getHttpAdapter: () => {
    getInstance: () => { set: (k: string, v: unknown) => void }
  }
}): void {
  const raw = process.env.TRUST_PROXY?.trim()
  if (!raw || raw === '0' || raw === 'false') return
  const value = raw === '1' || raw === 'true' ? 1 : Number(raw)
  if (!Number.isFinite(value) || value < 1) return
  app.getHttpAdapter().getInstance().set('trust proxy', value)
}

async function bootstrap() {
  const bodyLimit = process.env.JSON_BODY_LIMIT?.trim() || '256kb'

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    cors: {
      origin: resolveCorsOrigin(),
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Passphrase'],
      maxAge: 86400,
    },
  })

  applyTrustProxy(app)
  app.use(json({ limit: bodyLimit }))
  app.use(urlencoded({ extended: false, limit: bodyLimit }))
  app.use(securityHeadersMiddleware)
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()

  await app.listen(Number(process.env.PORT ?? 4000), '0.0.0.0')
}

bootstrap().catch(error => {
  console.error(error)
  process.exitCode = 1
})
