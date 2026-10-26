import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './module'
import {
  GlobalExceptionFilter,
  securityHeadersMiddleware,
} from './common/security'

function resolveCorsOrigin(): boolean | string | string[] {
  const raw = process.env.CORS_ORIGIN
  if (!raw || raw === 'true') return true
  if (raw.includes(',')) return raw.split(',').map(s => s.trim())
  return raw
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: resolveCorsOrigin(),
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Passphrase'],
    },
  })

  app.use(securityHeadersMiddleware)
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.setGlobalPrefix('api')

  await app.listen(Number(process.env.PORT ?? 4000), '0.0.0.0')
}

bootstrap().catch(error => {
  console.error(error)
  process.exitCode = 1
})
