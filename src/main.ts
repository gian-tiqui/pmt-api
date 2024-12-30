import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { yap } from './utils/messages';
import { ValidationPipe, VersioningType } from '@nestjs/common';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const PORT = parseInt(process.env.PORT, 10) || 8080;

  const app = await NestFactory.create(AppModule);
  // const config = new DocumentBuilder()
  //   .setTitle('WMC Project Management Tool API')
  //   .setDescription('API Documentation for WMC Project Management Tool ')
  //   .setVersion('1.0')
  //   .build();

  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api-docs', app, document);

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
    .listen(PORT, '0.0.0.0', () => yap(`Server started at port ${PORT}`))
    .catch((error) => {
      console.error(error);
    });
}
bootstrap();
