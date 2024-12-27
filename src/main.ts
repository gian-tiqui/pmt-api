import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { yap } from './utils/messages';

async function bootstrap() {
  const PORT = parseInt(process.env.PORT, 10) || 8080;

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['*'],
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

  await app
    .listen(PORT, '0.0.0.0', () => yap(`Server started at port ${PORT}`))
    .catch((error) => {
      console.error(error);
    });
}
bootstrap();
