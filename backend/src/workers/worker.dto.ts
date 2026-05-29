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
  workType: string;

  @IsString()
  @IsNotEmpty()
  team: string;

  @IsString()
  @IsNotEmpty()
  supervisor: string;
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
  workType: string;
}

export class WorkerLoginRequest {
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

export class WorkTypeRequest {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsBoolean()
  enabled: boolean;

  @IsBoolean()
  payrollDocumentsRequired: boolean;

  @IsInt()
  sortOrder: number;
}

export class WorkTypeRenameRequest {
  @IsString()
  @IsNotEmpty()
  currentLabel: string;

  @IsString()
  @IsNotEmpty()
  nextLabel: string;
}
