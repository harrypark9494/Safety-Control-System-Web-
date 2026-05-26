import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'UP',
      application: process.env.APP_NAME ?? 'safety-control-backend',
      checkedAt: new Date().toISOString(),
    };
  }
}
