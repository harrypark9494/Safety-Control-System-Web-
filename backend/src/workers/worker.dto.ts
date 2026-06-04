import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminRegistrationRequest {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  team: string;

  @IsOptional()
  @IsString()
  memo?: string;
}

export class AdminRegistrationUpdateRequest {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  memo?: string;
}

export class OnboardingRequest {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  category: string;
}

export class WorkerLoginRequest {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class WorkerCategoryRequest {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsBoolean()
  enabled: boolean;

  @IsBoolean()
  signupEnabled: boolean;

  @IsBoolean()
  payrollDocumentsRequired: boolean;

  @IsInt()
  sortOrder: number;
}

export class WorkerCategoryRenameRequest {
  @IsString()
  @IsNotEmpty()
  currentCategory: string;

  @IsString()
  @IsNotEmpty()
  nextCategory: string;
}

export class ScheduleColumnRequest {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  @IsNotEmpty()
  label: string;
}
