import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [AuthModule, HealthModule, WorkersModule],
})
export class AppModule {}
