import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const PORT = parseInt(process.env.PORT, 10);
  const yap = console.log;
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT, '0.0.0.0', () =>
    yap(`Server started at port ${PORT}`),
  );
}
bootstrap();
