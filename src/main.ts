import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const isSilent = (process.env.LOG_LEVEL || 'info') === 'silent';

  const app = await NestFactory.create(AppModule, {
    logger: isSilent ? false : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // Match the legacy behaviour: unknown/extra fields are tolerated, not rejected.
      whitelist: false,
      forbidNonWhitelisted: false,
    }),
  );

  const documentConfig = new DocumentBuilder()
    .setTitle('MR7901 Node Service API')
    .setDescription('API para consultar tags RFID detectados por el servidor TCP MR7901.')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: '/openapi.json' });

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app', { infer: true }) as AppConfig;

  const logger = new Logger('APP');

  // HTTP always binds 0.0.0.0, independent of config.host (which is only the TCP bind address) —
  // same split as the original Express server.
  await app.listen(appConfig.httpPort, '0.0.0.0');
  logger.log(
    `[HTTP] listening host=0.0.0.0 port=${appConfig.httpPort} ` +
      `docs=http://localhost:${appConfig.httpPort}/docs manual=http://localhost:${appConfig.httpPort}/manual`,
  );

  const shutdown = async (signal: string) => {
    logger.log(`[APP] ${signal} received, shutting down`);
    // Safety valve: force-exit even if some resource hangs on close(), same as the original.
    const forceExit = setTimeout(() => process.exit(0), 1500);
    try {
      await app.close();
    } finally {
      clearTimeout(forceExit);
      process.exit(0);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap();
