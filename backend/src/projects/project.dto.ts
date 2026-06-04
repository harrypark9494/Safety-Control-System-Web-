import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { ProjectStatus } from './project.types';

export class ProjectRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  status?: ProjectStatus;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsOptional()
  @IsString()
  endDate?: string | null;

  @IsOptional()
  @IsString()
  eventStartDate?: string;

  @IsOptional()
  @IsString()
  eventEndDate?: string | null;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class ProjectStatusRequest {
  @IsIn(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  status: ProjectStatus;
}
