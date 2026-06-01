import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ApiError } from '../shared/api-error';
import { DEFAULT_PROJECT_ID } from '../projects/projects.service';
import { PasswordService } from './password.service';
import {
  AdminRegistrationRequest,
  OnboardingRequest,
  WorkerLoginRequest,
  WorkTypeRenameRequest,
  WorkTypeRequest,
} from './worker.dto';
import type { PayrollDocumentStatus, ScheduleColumn, WorkerRegistration, WorkTypeSetting } from './worker.types';

@Injectable()
export class WorkersService {
  private readonly registrations = new Map<string, WorkerRegistration>();
  private readonly workTypes = new Map<string, WorkTypeSetting>();

  constructor(private readonly passwords: PasswordService) {
    this.seedWorkTypes();
    this.seedWorkerRegistration();
  }

  createRegistration(request: AdminRegistrationRequest) {
    const projectId = this.normalizeProjectId(request.projectId);
    const phone = this.normalizePhone(request.phone);
    const workType = this.normalizeExistingWorkType(request.workType, { requireEnabled: false });
    const team = this.normalizeExistingTeam(workType, request.team);
    const now = new Date().toISOString();
    const key = this.registrationKey(projectId, phone);

    if (this.registrations.has(key)) {
      throw new ConflictException('이미 이 프로젝트에 등록된 연락처입니다.');
    }

    const registration: WorkerRegistration = {
      uid: randomUUID(),
      projectId,
      name: request.name.trim(),
      phone,
      passwordHash: null,
      verificationCode: null,
      workType,
      team,
      supervisor: request.supervisor.trim(),
      registrationStatus: 'registered',
      payrollDocumentStatus: this.initialPayrollDocumentStatus(workType),
      registeredAt: now,
      onboardedAt: null,
    };

    this.registrations.set(key, registration);
    return this.toRegistrationResponse(registration);
  }

  completeOnboarding(request: OnboardingRequest) {
    const workType = this.normalizeExistingWorkType(request.workType);
    const worker = this.findByPhone(request.phone, request.projectId);

    if (worker.name !== request.name.trim() || worker.workType !== workType) {
      throw new ApiError(
        HttpStatus.FORBIDDEN,
        'WORKER_REGISTRATION_MISMATCH',
        '관리자가 등록한 근로자 정보와 일치하지 않습니다.',
      );
    }

    worker.passwordHash = this.passwords.hash(request.password);
    worker.verificationCode = request.code.trim();
    worker.registrationStatus = 'onboarded';
    worker.onboardedAt = new Date().toISOString();
    return this.toRegistrationResponse(worker);
  }

  login(request: WorkerLoginRequest) {
    const worker = this.findByPhone(request.phone, request.projectId);

    if (worker.registrationStatus !== 'onboarded') {
      throw new ApiError(HttpStatus.FORBIDDEN, 'WORKER_ONBOARDING_REQUIRED', '회원가입 절차가 완료되지 않았습니다.');
    }

    const matches = worker.name === request.name.trim()
      && worker.verificationCode === request.code.trim()
      && this.passwords.verify(request.password, worker.passwordHash);

    if (!matches) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'WORKER_LOGIN_FAILED', '등록 정보가 일치하지 않습니다.');
    }

    return {
      uid: worker.uid,
      projectId: worker.projectId,
      role: 'worker',
      name: worker.name,
      phone: worker.phone,
      workType: worker.workType,
      team: worker.team,
      supervisor: worker.supervisor,
      schedule: '근무 일정 배정 전',
      status: '온보딩 완료',
      payrollDocumentsRequired: this.isPayrollDocumentRequired(worker.workType)
        && worker.payrollDocumentStatus === 'missing',
      payrollDocumentStatus: worker.payrollDocumentStatus,
    };
  }

  listRegistrations(projectId?: string) {
    const normalizedProjectId = projectId?.trim();
    return [...this.registrations.values()]
      .filter((worker) => !normalizedProjectId || worker.projectId === normalizedProjectId)
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .map((worker) => this.toRegistrationResponse(worker));
  }

  deleteRegistration(phone: string, projectId?: string) {
    const worker = this.findByPhone(phone, projectId);
    this.registrations.delete(this.registrationKey(worker.projectId, worker.phone));
  }

  listWorkTypes(options: { includeDisabled?: boolean } = {}) {
    return [...this.workTypes.values()]
      .filter((workType) => options.includeDisabled || workType.enabled)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.label.localeCompare(b.label);
      });
  }

  listScheduleColumns(projectId?: string): ScheduleColumn[] {
    const normalizedProjectId = projectId?.trim();
    const workerCountByTeamPath = [...this.registrations.values()].reduce<Record<string, number>>((counts, worker) => {
      if (!normalizedProjectId || worker.projectId === normalizedProjectId) {
        const path = this.scheduleColumnId(worker.workType, worker.team);
        counts[path] = (counts[path] ?? 0) + 1;
      }
      return counts;
    }, {});
    const columns: ScheduleColumn[] = [];

    this.listWorkTypes().forEach((workType) => {
      workType.teams.forEach((team) => {
        const id = this.scheduleColumnId(workType.label, team);
        columns.push({
          id,
          label: team,
          workType: workType.label,
          workTypes: [workType.label],
          workerCount: workerCountByTeamPath[id] ?? 0,
        });
      });
    });

    return columns;
  }

  saveWorkType(request: WorkTypeRequest) {
    const label = this.normalizeWorkTypeLabel(request.label);
    const existing = this.workTypes.get(label);
    const teams = this.normalizeTeams(request.teams ?? existing?.teams ?? []);

    if (existing) {
      const removedTeams = existing.teams.filter((team) => !teams.includes(team));
      const hasAssignedWorkers = [...this.registrations.values()].some((worker) => (
        worker.workType === label && removedTeams.includes(worker.team)
      ));

      if (hasAssignedWorkers) {
        throw new ConflictException('등록된 근로자가 있는 팀은 삭제할 수 없습니다.');
      }
    }

    const workType: WorkTypeSetting = {
      label,
      teams,
      enabled: request.enabled,
      payrollDocumentsRequired: request.payrollDocumentsRequired,
      sortOrder: request.sortOrder,
      updatedAt: new Date().toISOString(),
    };
    this.workTypes.set(label, workType);
    return workType;
  }

  renameWorkType(request: WorkTypeRenameRequest) {
    const currentLabel = this.normalizeWorkTypeLabel(request.currentLabel);
    const nextLabel = this.normalizeWorkTypeLabel(request.nextLabel);
    const current = this.workTypes.get(currentLabel);

    if (!current) {
      throw new NotFoundException('고용 유형을 찾을 수 없습니다.');
    }

    if (currentLabel === nextLabel) {
      return current;
    }

    if (this.workTypes.has(nextLabel)) {
      throw new ConflictException('이미 등록된 고용 유형 이름입니다.');
    }

    const renamed: WorkTypeSetting = {
      ...current,
      label: nextLabel,
      updatedAt: new Date().toISOString(),
    };
    this.workTypes.delete(currentLabel);
    this.workTypes.set(nextLabel, renamed);

    for (const worker of this.registrations.values()) {
      if (worker.workType === currentLabel) {
        worker.workType = nextLabel;
      }
    }

    return renamed;
  }

  deleteWorkType(label: string) {
    const normalized = this.normalizeWorkTypeLabel(label);

    if (!this.workTypes.has(normalized)) {
      throw new NotFoundException('고용 유형을 찾을 수 없습니다.');
    }

    if ([...this.registrations.values()].some((worker) => worker.workType === normalized)) {
      throw new ConflictException('이 고용 유형을 사용하는 근로자가 있어 삭제할 수 없습니다.');
    }

    this.workTypes.delete(normalized);
  }

  private seedWorkTypes() {
    const now = new Date().toISOString();
    this.workTypes.set('직접 고용', {
      label: '직접 고용',
      teams: ['Stage Alpha'],
      enabled: true,
      payrollDocumentsRequired: true,
      sortOrder: 10,
      updatedAt: now,
    });
    this.workTypes.set('외부 고용', {
      label: '외부 고용',
      teams: ['Local Test'],
      enabled: true,
      payrollDocumentsRequired: false,
      sortOrder: 20,
      updatedAt: now,
    });
  }

  private seedWorkerRegistration() {
    this.createRegistration({
      name: '테스트 근로자',
      phone: '010-1234-5678',
      workType: '직접 고용',
      team: 'Stage Alpha',
      supervisor: '관리자 A',
    });

    const localWorkerPassword = process.env.LOCAL_TEST_WORKER_PASSWORD;
    const localWorkerCode = process.env.LOCAL_TEST_WORKER_CODE;

    if (process.env.ENABLE_LOCAL_TEST_WORKER === 'true' && localWorkerPassword && localWorkerCode) {
      const localWorker = this.createRegistration({
        name: process.env.LOCAL_TEST_WORKER_NAME ?? '로컬 근로자',
        phone: process.env.LOCAL_TEST_WORKER_PHONE ?? '010-9000-0001',
        workType: process.env.LOCAL_TEST_WORKER_WORK_TYPE ?? '외부 고용',
        team: process.env.LOCAL_TEST_WORKER_TEAM ?? 'Local Test',
        supervisor: process.env.LOCAL_TEST_WORKER_SUPERVISOR ?? '로컬 관리자',
      });

      const worker = this.findByPhone(localWorker.phone, localWorker.projectId);
      worker.passwordHash = this.passwords.hash(localWorkerPassword);
      worker.verificationCode = localWorkerCode;
      worker.registrationStatus = 'onboarded';
      worker.onboardedAt = new Date().toISOString();
      worker.payrollDocumentStatus = 'approved';
    }
  }

  private findByPhone(phone: string, projectId?: string) {
    const normalized = this.normalizePhone(phone);
    const normalizedProjectId = projectId?.trim();
    const matches = [...this.registrations.values()].filter((registration) => registration.phone === normalized);
    const worker = normalizedProjectId
      ? this.registrations.get(this.registrationKey(normalizedProjectId, normalized))
      : matches[0];

    if (!worker) {
      throw new NotFoundException('관리자가 등록한 근로자 정보를 찾을 수 없습니다.');
    }

    if (!normalizedProjectId && matches.length > 1) {
      throw new ConflictException('같은 연락처의 근로자 등록 정보가 여러 프로젝트에 있습니다. 프로젝트를 지정해야 합니다.');
    }

    return worker;
  }

  private normalizeProjectId(projectId?: string) {
    return projectId?.trim() || DEFAULT_PROJECT_ID;
  }

  private registrationKey(projectId: string, phone: string) {
    return `${projectId}:${phone}`;
  }

  private scheduleColumnId(workType: string, team: string) {
    return `${workType} / ${team}`;
  }

  private normalizePhone(phone: string) {
    const digits = (phone ?? '').replace(/\D/g, '');

    if (digits.length === 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    throw new ApiError(HttpStatus.BAD_REQUEST, 'INVALID_PHONE', '연락처는 숫자 10자리 또는 11자리여야 합니다.');
  }

  private normalizeExistingWorkType(workType: string, options: { requireEnabled?: boolean } = {}) {
    const normalized = this.normalizeWorkTypeLabel(workType);
    const setting = this.workTypes.get(normalized);

    if (!setting) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'UNSUPPORTED_WORK_TYPE', '지원하지 않는 고용 유형입니다.');
    }

    if (options.requireEnabled !== false && !setting.enabled) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'DISABLED_WORK_TYPE', '현재 선택할 수 없는 고용 유형입니다.');
    }

    return normalized;
  }

  private normalizeWorkTypeLabel(workType: string) {
    const normalized = (workType ?? '').trim();

    if (!normalized || normalized.length > 40) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'INVALID_WORK_TYPE', '고용 유형은 1자 이상 40자 이하여야 합니다.');
    }

    return normalized;
  }

  private normalizeExistingTeam(workType: string, team: string) {
    const normalized = this.normalizeTeamLabel(team);
    const setting = this.workTypes.get(workType);

    if (!setting?.teams.includes(normalized)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'UNSUPPORTED_TEAM', '선택한 고용 유형에 등록되지 않은 팀입니다.');
    }

    return normalized;
  }

  private normalizeTeamLabel(team: string) {
    const normalized = (team ?? '').trim();

    if (!normalized || normalized.length > 40) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'INVALID_TEAM', '팀은 1자 이상 40자 이하여야 합니다.');
    }

    return normalized;
  }

  private normalizeTeams(teams: string[]) {
    const normalizedTeams = teams.map((team) => this.normalizeTeamLabel(team));
    const uniqueTeams = [...new Set(normalizedTeams)];

    if (uniqueTeams.length === 0) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'INVALID_TEAMS', '고용 유형에는 하나 이상의 팀이 필요합니다.');
    }

    return uniqueTeams;
  }

  private initialPayrollDocumentStatus(workType: string): PayrollDocumentStatus {
    return this.isPayrollDocumentRequired(workType) ? 'missing' : 'approved';
  }

  private isPayrollDocumentRequired(workType: string) {
    return this.workTypes.get(workType)?.payrollDocumentsRequired ?? false;
  }

  private toRegistrationResponse(worker: WorkerRegistration) {
    const { passwordHash: _passwordHash, verificationCode: _verificationCode, ...response } = worker;
    return response;
  }
}
