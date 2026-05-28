import { Body, Controller, Post } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { AdminAuthService } from './admin-auth.service';

class AdminLoginRequest {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

@Controller('auth')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Post('admin-login')
  adminLogin(@Body() request: AdminLoginRequest) {
    return this.adminAuth.login(request.idToken);
  }
}
