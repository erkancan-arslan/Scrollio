import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Enable CORS
  // In development, allow all localhost origins dynamically
  const isDev = configService.get<string>('NODE_ENV') !== 'production';
  app.enableCors({
    origin: isDev
      ? (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
          // Allow requests with no origin (mobile apps, curl, etc.)
          if (!origin) return callback(null, true);
          // Allow all localhost origins in dev (127.0.0.1 — Expo Web sometimes uses it)
          if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) return callback(null, true);
          if (origin.match(/^https?:\/\/127\.0\.0\.1(:\d+)?$/)) return callback(null, true);
          // Allow LAN IPs in dev
          if (origin.match(/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/)) return callback(null, true);
          if (origin.match(/^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/)) return callback(null, true);
          if (origin.match(/^https?:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/)) return callback(null, true);
          const allowed = configService.get<string>('CORS_ORIGINS')?.split(',') || [];
          if (allowed.includes(origin)) return callback(null, true);
          callback(null, false);
        }
      : configService.get<string>('CORS_ORIGINS')?.split(',') || false,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Raise body size limit to support base64 image uploads (mascot drawing pipeline)
  app.use(json({ limit: '15mb' }));

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Scrollio API')
    .setDescription('Scrollio Backend API - Micro-learning mobile app')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('videos', 'Video content')
    .addTag('quizzes', 'Quiz system')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Scrollio Backend running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
