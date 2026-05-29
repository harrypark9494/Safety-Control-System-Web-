import 'reflect-metadata';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './shared/api-exception.filter';

const DEFAULT_BACKEND_PORT = 8080;
const DEFAULT_FRONTEND_PORT = 3000;
const MIN_PORT = 1;
const MAX_PORT = 65535;

loadSharedLocalTestEnv();

function loadSharedLocalTestEnv() {
  const candidates = [
    join(process.cwd(), '.env.local'),
    join(process.cwd(), '..', '.env.local'),
  ];
  const envPath = candidates.find((candidate) => existsSync(candidate));

  if (!envPath) {
    return;
  }

  for (const line of readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const trimmed = line.trim().replace(/^export\s+/, '');

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split('=');
    const normalizedKey = key.trim().replace(/^\uFEFF/, '');

    if (!normalizedKey) {
      continue;
    }

    process.env[normalizedKey] ??= normalizeEnvValue(valueParts.join('='));
  }
}

function normalizeEnvValue(value: string) {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parsePort(value: string | undefined, fallback: number) {
  const port = Number(value);

  if (Number.isInteger(port) && port >= MIN_PORT && port <= MAX_PORT) {
    return port;
  }

  return fallback;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendPort = parsePort(
    process.env.LOCAL_FRONTEND_PORT ?? process.env.FRONTEND_PORT,
    DEFAULT_FRONTEND_PORT,
  );
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

  const backendPort = parsePort(
    process.env.LOCAL_BACKEND_PORT ?? process.env.PORT,
    DEFAULT_BACKEND_PORT,
  );
  await app.listen(backendPort);
}

void bootstrap();
