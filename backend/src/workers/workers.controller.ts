import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  AdminRegistrationRequest,
  AdminRegistrationUpdateRequest,
  OnboardingRequest,
  ScheduleColumnRequest,
  WorkerCategoryRenameRequest,
  WorkerCategoryRequest,
  WorkerLoginRequest,
} from './worker.dto';
import { WorkersService } from './workers.service';
import type { PayrollDocumentStatus, RegistrationStatus } from './worker.types';

type UploadedXlsxFile = {
  originalname: string;
  mimetype?: string;
  size: number;
  buffer: Buffer;
};

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
  listRegistrations(
    @Query('projectId') projectId?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('company') company?: string,
    @Query('team') team?: string,
    @Query('registrationStatus') registrationStatus?: RegistrationStatus,
    @Query('payrollDocumentStatus') payrollDocumentStatus?: PayrollDocumentStatus,
  ) {
    return this.workers.listRegistrations({ projectId, search, category, company, team, registrationStatus, payrollDocumentStatus });
  }

  @Post('admin/worker-registrations')
  createRegistration(@Body() request: AdminRegistrationRequest) {
    return this.workers.createRegistration(request);
  }

  @Patch('admin/worker-registrations/:uid')
  updateRegistration(
    @Param('uid') uid: string,
    @Query('projectId') projectId: string | undefined,
    @Body() request: AdminRegistrationUpdateRequest,
  ) {
    return this.workers.updateRegistration(uid, projectId, request);
  }

  @Delete('admin/worker-registrations/:uid')
  deleteRegistration(@Param('uid') uid: string, @Query('projectId') projectId: string | undefined) {
    this.workers.deleteRegistration(uid, projectId);
  }

  @Post('admin/worker-registrations/import-xlsx')
  @UseInterceptors(FileInterceptor('file'))
  importRegistrationsXlsx(@UploadedFile() file: UploadedXlsxFile | undefined, @Query('projectId') projectId?: string) {
    return this.workers.importRegistrationsXlsx(projectId, file);
  }

  @Get('worker-categories')
  listWorkerSelectableCategories(@Query('projectId') projectId?: string) {
    return this.workers.listCategories(projectId, { signupOnly: true });
  }

  @Get('admin/worker-categories')
  listCategories(@Query('projectId') projectId?: string) {
    return this.workers.listCategories(projectId, { includeDisabled: true });
  }

  @Post('admin/worker-categories')
  saveCategory(@Body() request: WorkerCategoryRequest) {
    return this.workers.saveCategory(request);
  }

  @Post('admin/worker-categories/rename')
  renameCategory(@Body() request: WorkerCategoryRenameRequest) {
    return this.workers.renameCategory(request);
  }

  @Delete('admin/worker-categories/:category')
  deleteCategory(@Param('category') category: string, @Query('projectId') projectId?: string) {
    this.workers.deleteCategory(projectId, category);
  }

  @Get('admin/schedule-columns')
  listScheduleColumns(@Query('projectId') projectId?: string) {
    return this.workers.listScheduleColumns(projectId);
  }

  @Post('admin/schedule-columns')
  createScheduleColumn(@Body() request: ScheduleColumnRequest) {
    return this.workers.createScheduleColumn(request);
  }

  @Delete('admin/schedule-columns/:id')
  deleteScheduleColumn(@Param('id') id: string, @Query('projectId') projectId?: string) {
    return this.workers.deleteScheduleColumn(id, projectId);
  }
}
