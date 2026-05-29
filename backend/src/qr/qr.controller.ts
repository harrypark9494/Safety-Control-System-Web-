import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { QrScanRequest } from './qr.dto';
import { QrService } from './qr.service';
import type { MealType } from './qr.types';

@Controller()
export class QrController {
  constructor(private readonly qr: QrService) {}

  @Get('worker/qr-entitlements/today')
  getWorkerEntitlements(@Query('workerId') workerId: string) {
    return this.qr.getWorkerEntitlements(workerId);
  }

  @Get('admin/qr-usage/summary')
  getAdminSummary(
    @Query('date') date?: string,
    @Query('mealType') mealType?: MealType | 'all',
    @Query('projectId') projectId?: string,
  ) {
    return this.qr.getAdminSummary(date, mealType ?? 'all', projectId);
  }

  @Post('qr/scan')
  scan(@Body() request: QrScanRequest) {
    return this.qr.recordScan(request);
  }
}
