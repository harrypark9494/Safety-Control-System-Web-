import { IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginRequest {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
