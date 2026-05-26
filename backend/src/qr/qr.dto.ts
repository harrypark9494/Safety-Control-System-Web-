import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { MealType, QrType } from './qr.types';

export class QrScanRequest {
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @IsIn(['meal', 'water'])
  qrType: QrType;

  @IsString()
  @IsNotEmpty()
  scanLocation: string;

  @IsOptional()
  @IsIn(['lunch', 'dinner'])
  mealType?: MealType;
}
