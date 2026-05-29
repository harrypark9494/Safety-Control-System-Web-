import 'reflect-metadata';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './shared/api-exception.filter';

const DEFAULT_BACKEND_PORT = 8080;
const DEFAULT_FRONTEND_PORT = 3000;

loadLocalEnv();

function loadLocalEnv() {
  const candidates = [
    join(process.cwd(), '.env.local'),
    join(process.cwd(), '..', '.env.local'),
    join(process.cwd(), 'backend', '.env.local'),
  ];
  const envPath = candidates.find((candidate) => existsSync(candidate));

  if (!envPath) {
    return;
  }

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    process.env[key.trim()] ??= value;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendPort = Number(process.env.LOCAL_FRONTEND_PORT ?? process.env.FRONTEND_PORT ?? DEFAULT_FRONTEND_PORT);
  const frontendOrigins = [
    process.env.FRONTEND_ORIGIN,
    `http://localhost:${frontendPort}`,
    `http://127.0.0.1:${frontendPort}`,
  ].filter((origin): origin is string => Boolean(origin));

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  const backendPort = Number(process.env.LOCAL_BACKEND_PORT ?? process.env.PORT ?? DEFAULT_BACKEND_PORT);
  await app.listen(backendPort);
}

void bootstrap();
