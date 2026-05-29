import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateWeatherStationRequest {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  @Min(33)
  @Max(39)
  latitude!: number;

  @IsNumber()
  @Min(124)
  @Max(132)
  longitude!: number;
}

export class UpdateWeatherThresholdsRequest {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsNumber()
  @Min(1)
  @Max(60)
  windSpeed!: number;

  @IsNumber()
  @Min(1)
  @Max(200)
  precipitation!: number;

  @IsNumber()
  @Min(-30)
  @Max(50)
  temperature!: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  humidity!: number;
}
