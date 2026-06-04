import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const startedAt = new Date().toISOString();

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async health() {
    const localTestWorkerEnabled = process.env.ENABLE_LOCAL_TEST_WORKER === 'true';
    const database = await this.database.health();

    return {
      status: 'UP',
      application: process.env.APP_NAME ?? 'safety-control-backend',
      runtime: {
        storage: this.database.storageMode(),
        startedAt,
        localTestWorker: {
          enabled: localTestWorkerEnabled,
          configured: localTestWorkerEnabled &&
            Boolean(process.env.LOCAL_TEST_WORKER_NAME) &&
            Boolean(process.env.LOCAL_TEST_WORKER_PHONE) &&
            Boolean(process.env.LOCAL_TEST_WORKER_CODE) &&
            Boolean(process.env.LOCAL_TEST_WORKER_PASSWORD),
        },
      },
      database,
      checkedAt: new Date().toISOString(),
    };
  }
}
