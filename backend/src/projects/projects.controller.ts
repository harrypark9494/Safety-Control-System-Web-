import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProjectRequest, ProjectStatusRequest } from './project.dto';
import { ProjectsService } from './projects.service';

@Controller('admin/projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  listProjects(@Query('includeArchived') includeArchived?: string) {
    return this.projects.listProjects({ includeArchived: includeArchived === 'true' });
  }

  @Get('active')
  getActiveProject() {
    return this.projects.getActiveProject();
  }

  @Post()
  createProject(@Body() request: ProjectRequest) {
    return this.projects.createProject(request);
  }

  @Post(':projectId/status')
  updateProjectStatus(
    @Param('projectId') projectId: string,
    @Body() request: ProjectStatusRequest,
  ) {
    return this.projects.updateProjectStatus(projectId, request);
  }
}
