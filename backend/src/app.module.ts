import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { QrModule } from './qr/qr.module';
import { WeatherModule } from './weather/weather.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [AuthModule, HealthModule, WorkersModule, QrModule, WeatherModule],
})
export class AppModule {}
