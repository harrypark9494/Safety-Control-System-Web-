import { Module } from '@nestjs/common';
import { WorkersModule } from '../workers/workers.module';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

@Module({
  imports: [WorkersModule],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
