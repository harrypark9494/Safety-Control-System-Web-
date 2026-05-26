import { Body, Controller, Post } from '@nestjs/common';
import { AdminLoginRequest } from './admin-auth.dto';
import { AdminAuthService } from './admin-auth.service';

@Controller('auth')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Post('admin-login')
  adminLogin(@Body() request: AdminLoginRequest) {
    return this.adminAuth.login(request.idToken);
  }
}
