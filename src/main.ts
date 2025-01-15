import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const PORT = parseInt(process.env.PORT, 10) || 8080;
  const logger = new Logger('WMC Project Management Tool');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173/'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Cache-Control',
      'x-api-key',
    ],
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app
    .listen(PORT, '0.0.0.0', () => logger.log(`Server started at port ${PORT}`))
    .catch((error) => {
      logger.error(error);
    });
}
bootstrap();
