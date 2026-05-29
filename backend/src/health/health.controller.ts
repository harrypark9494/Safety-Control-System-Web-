import { Controller, Get } from '@nestjs/common';

const startedAt = new Date().toISOString();

@Controller('health')
export class HealthController {
  @Get()
  health() {
    const localTestWorkerEnabled = process.env.ENABLE_LOCAL_TEST_WORKER === 'true';

    return {
      status: 'UP',
      application: process.env.APP_NAME ?? 'safety-control-backend',
      runtime: {
        storage: 'memory',
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
      checkedAt: new Date().toISOString(),
    };
  }
}
