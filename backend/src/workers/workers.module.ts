import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';

@Module({
  controllers: [WorkersController],
  providers: [PasswordService, WorkersService],
})
export class WorkersModule {}
