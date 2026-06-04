import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ProjectRequest, ProjectStatusRequest } from './project.dto';
import type { Project, ProjectStatus } from './project.types';

export const DEFAULT_PROJECT_ID = 'waterbomb-2026-summer';

@Injectable()
export class ProjectsService {
  private readonly projects = new Map<string, Project>();

  constructor() {
    if (process.env.ENABLE_DEMO_SEED_DATA !== 'false') {
      this.seedProjects();
    }
  }

  listProjects(options: { includeArchived?: boolean } = {}) {
    return [...this.projects.values()]
      .filter((project) => options.includeArchived || project.status !== 'ARCHIVED')
      .sort((a, b) => {
        if (a.status !== b.status) {
          return this.statusRank(a.status) - this.statusRank(b.status);
        }
        return b.eventStartDate.localeCompare(a.eventStartDate);
      });
  }

  getActiveProject() {
    return this.listProjects()
      .find((project) => project.status === 'ACTIVE')
      ?? this.listProjects()[0]
      ?? null;
  }

  createProject(request: ProjectRequest) {
    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      name: request.name.trim(),
      status: request.status ?? 'DRAFT',
      startDate: request.startDate,
      endDate: request.endDate ?? null,
      eventStartDate: request.eventStartDate ?? request.startDate,
      eventEndDate: request.eventEndDate ?? request.endDate ?? null,
      location: request.location.trim(),
      description: request.description?.trim() ?? '',
      createdBy: request.createdBy?.trim() || 'admin',
      createdAt: now,
      archivedAt: request.status === 'ARCHIVED' ? now : null,
    };

    this.projects.set(project.id, project);
    return project;
  }

  updateProjectStatus(projectId: string, request: ProjectStatusRequest) {
    const project = this.findProject(projectId);
    project.status = request.status;
    project.archivedAt = request.status === 'ARCHIVED'
      ? project.archivedAt ?? new Date().toISOString()
      : null;
    return project;
  }

  findProject(projectId: string) {
    const project = this.projects.get(projectId);

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    return project;
  }

  private seedProjects() {
    const now = new Date().toISOString();
    this.projects.set(DEFAULT_PROJECT_ID, {
      id: DEFAULT_PROJECT_ID,
      name: '2026 워터밤 여름 프로젝트',
      status: 'ACTIVE',
      startDate: '2026-07-14',
      endDate: '2026-07-24',
      eventStartDate: '2026-07-19',
      eventEndDate: '2026-07-21',
      location: '킨텍스 제2전시장',
      description: '현재 운영 중인 안전 관제 프로젝트',
      createdBy: 'system',
      createdAt: now,
      archivedAt: null,
    });
    this.projects.set('waterbomb-2026-winter', {
      id: 'waterbomb-2026-winter',
      name: '2026 워터밤 겨울 준비',
      status: 'DRAFT',
      startDate: '2026-12-01',
      endDate: '2026-12-31',
      eventStartDate: '2026-12-18',
      eventEndDate: '2026-12-20',
      location: '운영 장소 미정',
      description: '다음 운영 준비 프로젝트',
      createdBy: 'system',
      createdAt: now,
      archivedAt: null,
    });
  }

  private statusRank(status: ProjectStatus) {
    return { ACTIVE: 0, DRAFT: 1, ARCHIVED: 2 }[status];
  }
}
