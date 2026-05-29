import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import {
  AdminRegistrationRequest,
  OnboardingRequest,
  WorkerLoginRequest,
  WorkTypeRenameRequest,
  WorkTypeRequest,
} from './worker.dto';
import { WorkersService } from './workers.service';

@Controller()
export class WorkersController {
  constructor(private readonly workers: WorkersService) {}

  @Post('worker-registrations')
  completeOnboarding(@Body() request: OnboardingRequest) {
    return this.workers.completeOnboarding(request);
  }

  @Post('auth/worker-login')
  workerLogin(@Body() request: WorkerLoginRequest) {
    return this.workers.login(request);
  }

  @Get('admin/worker-registrations')
  listRegistrations(@Query('projectId') projectId?: string) {
    return this.workers.listRegistrations(projectId);
  }

  @Post('admin/worker-registrations')
  createRegistration(@Body() request: AdminRegistrationRequest) {
    return this.workers.createRegistration(request);
  }

  @Delete('admin/worker-registrations/:phone')
  deleteRegistration(@Param('phone') phone: string, @Query('projectId') projectId?: string) {
    this.workers.deleteRegistration(phone, projectId);
  }

  @Get('work-types')
  listWorkerSelectableWorkTypes() {
    return this.workers.listWorkTypes();
  }

  @Get('admin/work-types')
  listWorkTypes() {
    return this.workers.listWorkTypes();
  }

  @Post('admin/work-types')
  saveWorkType(@Body() request: WorkTypeRequest) {
    return this.workers.saveWorkType(request);
  }

  @Post('admin/work-types/rename')
  renameWorkType(@Body() request: WorkTypeRenameRequest) {
    return this.workers.renameWorkType(request);
  }

  @Delete('admin/work-types/:label')
  deleteWorkType(@Param('label') label: string) {
    this.workers.deleteWorkType(label);
  }
}
