import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ApiError } from '../shared/api-error';
import { PasswordService } from './password.service';
import {
  AdminRegistrationRequest,
  OnboardingRequest,
  WorkerLoginRequest,
  WorkTypeRenameRequest,
  WorkTypeRequest,
} from './worker.dto';
import type { PayrollDocumentStatus, WorkerRegistration, WorkTypeSetting } from './worker.types';

@Injectable()
export class WorkersService {
  private readonly registrations = new Map<string, WorkerRegistration>();
  private readonly workTypes = new Map<string, WorkTypeSetting>();

  constructor(private readonly passwords: PasswordService) {
    this.seedWorkTypes();
    this.seedWorkerRegistration();
  }

  createRegistration(request: AdminRegistrationRequest) {
    const phone = this.normalizePhone(request.phone);
    const workType = this.normalizeExistingWorkType(request.workType);
    const now = new Date().toISOString();
    const existing = this.registrations.get(phone);

    const registration: WorkerRegistration = {
      uid: existing?.uid ?? randomUUID(),
      name: request.name.trim(),
      phone,
      passwordHash: null,
      verificationCode: null,
      workType,
      team: request.team.trim(),
      supervisor: request.supervisor.trim(),
      registrationStatus: 'registered',
      payrollDocumentStatus: this.initialPayrollDocumentStatus(workType),
      registeredAt: now,
      onboardedAt: null,
    };

    this.registrations.set(phone, registration);
    return this.toRegistrationResponse(registration);
  }

  completeOnboarding(request: OnboardingRequest) {
    const workType = this.normalizeExistingWorkType(request.workType);
    const worker = this.findByPhone(request.phone);

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
    const worker = this.findByPhone(request.phone);

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

  listRegistrations() {
    return [...this.registrations.values()]
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .map((worker) => this.toRegistrationResponse(worker));
  }

  deleteRegistration(phone: string) {
    const worker = this.findByPhone(phone);
    this.registrations.delete(worker.phone);
  }

  listWorkTypes() {
    return [...this.workTypes.values()].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.label.localeCompare(b.label);
    });
  }

  saveWorkType(request: WorkTypeRequest) {
    const label = this.normalizeWorkTypeLabel(request.label);
    const workType: WorkTypeSetting = {
      label,
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
      enabled: true,
      payrollDocumentsRequired: true,
      sortOrder: 10,
      updatedAt: now,
    });
    this.workTypes.set('외부 고용', {
      label: '외부 고용',
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
  }

  private findByPhone(phone: string) {
    const normalized = this.normalizePhone(phone);
    const worker = this.registrations.get(normalized);

    if (!worker) {
      throw new NotFoundException('관리자가 등록한 근로자 정보를 찾을 수 없습니다.');
    }

    return worker;
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

  private normalizeExistingWorkType(workType: string) {
    const normalized = this.normalizeWorkTypeLabel(workType);

    if (!this.workTypes.has(normalized)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'UNSUPPORTED_WORK_TYPE', '지원하지 않는 고용 유형입니다.');
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
