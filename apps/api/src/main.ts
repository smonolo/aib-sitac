import 'reflect-metadata'
import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { NestFactory } from '@nestjs/core'
import { json, urlencoded } from 'express'
import { AppModule } from './module'
import {
  GlobalExceptionFilter,
  securityHeadersMiddleware,
} from './common/security'

loadEnv({ path: resolve(__dirname, '..', '.env') })

const CORS_ORIGINS = [
  'https://aib-sitac.smnl.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
] as const

const JSON_BODY_LIMIT = '256kb'

function applyTrustProxy(app: {
  getHttpAdapter: () => {
    getInstance: () => { set: (k: string, v: unknown) => void }
  }
}): void {
  if (process.env.NODE_ENV !== 'production') return
  app.getHttpAdapter().getInstance().set('trust proxy', 1)
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    cors: {
      origin: [...CORS_ORIGINS],
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Passphrase'],
      maxAge: 86400,
    },
  })

  applyTrustProxy(app)
  app.use(json({ limit: JSON_BODY_LIMIT }))
  app.use(urlencoded({ extended: false, limit: JSON_BODY_LIMIT }))
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
