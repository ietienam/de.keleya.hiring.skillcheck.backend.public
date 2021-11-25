import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.services';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: ['Authorization', 'Content-Type', 'apikey', 'Accept-Encoding'],
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  const configService = app.get(ConfigService);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  // enable useContainer to be able to inject into class validators
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const prismaService: PrismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);
  await app.listen(configService.get('PORT'));
}
bootstrap();
