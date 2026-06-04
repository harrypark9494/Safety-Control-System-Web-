import { BadRequestException, ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import readXlsxFile from 'read-excel-file/node';
import { ApiError } from '../shared/api-error';
import { DEFAULT_PROJECT_ID } from '../projects/projects.service';
import { PasswordService } from './password.service';
import {
  AdminRegistrationRequest,
  AdminRegistrationUpdateRequest,
  OnboardingRequest,
  ScheduleColumnRequest,
  WorkerCategoryRenameRequest,
  WorkerCategoryRequest,
  WorkerLoginRequest,
} from './worker.dto';
import type {
  PayrollDocumentStatus,
  ScheduleColumn,
  WorkerCategorySetting,
  WorkerImportColumn,
  WorkerImportError,
  WorkerRegistration,
} from './worker.types';

type UploadedXlsxFile = {
  originalname: string;
  mimetype?: string;
  size: number;
  buffer: Buffer;
};

type WorkerListFilters = {
  projectId?: string;
  search?: string;
  category?: string;
  company?: string;
  role?: string;
  registrationStatus?: WorkerRegistration['registrationStatus'];
  payrollDocumentStatus?: PayrollDocumentStatus;
};

type ImportDraft = {
  row: number;
  category: string;
  role: string;
  company: string;
  name: string;
  phone: string;
  memo: string;
};

const IMPORT_COLUMNS: Record<WorkerImportColumn, { index: number; label: string }> = {
  C: { index: 2, label: 'category' },
  D: { index: 3, label: 'role' },
  E: { index: 4, label: 'company' },
  F: { index: 5, label: 'name' },
  H: { index: 7, label: 'phone' },
  I: { index: 8, label: 'memo' },
};

const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMPORT_ROWS = 1000;

@Injectable()
export class WorkersService {
  private readonly registrations = new Map<string, WorkerRegistration>();
  private readonly categories = new Map<string, WorkerCategorySetting>();
  private readonly scheduleColumns = new Map<string, ScheduleColumn[]>();

  constructor(private readonly passwords: PasswordService) {
    this.seedCategories();
    this.seedScheduleColumns();
    this.seedWorkerRegistration();
  }

  createRegistration(request: AdminRegistrationRequest) {
    const projectId = this.normalizeProjectId(request.projectId);
    const phone = this.normalizePhone(request.phone);
    const category = this.normalizeExistingCategory(request.category);
    const now = new Date().toISOString();
    const key = this.registrationKey(projectId, phone);

    if (this.registrations.has(key)) {
      throw new ConflictException('Worker phone already exists in this project.');
    }

    const registration: WorkerRegistration = {
      uid: randomUUID(),
      projectId,
      name: this.normalizeRequiredText(request.name, 'INVALID_WORKER_NAME', 'name', 80),
      phone,
      passwordHash: null,
      verificationCode: null,
      category,
      company: this.normalizeCompany(request.company),
      role: this.normalizeWorkerRole(request.role),
      memo: this.normalizeMemo(request.memo ?? ''),
      registrationStatus: 'registered',
      payrollDocumentStatus: this.initialPayrollDocumentStatus(category),
      registeredAt: now,
      onboardedAt: null,
    };

    this.registrations.set(key, registration);
    return this.toRegistrationResponse(registration);
  }

  updateRegistration(uid: string, request: AdminRegistrationUpdateRequest) {
    const worker = this.findByUid(uid);
    const nextProjectId = this.normalizeProjectId(request.projectId ?? worker.projectId);
    const nextPhone = request.phone === undefined ? worker.phone : this.normalizePhone(request.phone);
    const nextCategory = request.category === undefined
      ? worker.category
      : this.normalizeExistingCategory(request.category);
    const nextKey = this.registrationKey(nextProjectId, nextPhone);
    const currentKey = this.registrationKey(worker.projectId, worker.phone);
    const existing = this.registrations.get(nextKey);

    if (existing && existing.uid !== worker.uid) {
      throw new ConflictException('Worker phone already exists in this project.');
    }

    if (request.name !== undefined) {
      worker.name = this.normalizeRequiredText(request.name, 'INVALID_WORKER_NAME', 'name', 80);
    }
    if (request.company !== undefined) {
      worker.company = this.normalizeCompany(request.company);
    }
    if (request.role !== undefined) {
      worker.role = this.normalizeWorkerRole(request.role);
    }
    if (request.memo !== undefined) {
      worker.memo = this.normalizeMemo(request.memo);
    }

    worker.projectId = nextProjectId;
    worker.phone = nextPhone;
    worker.category = nextCategory;
    worker.payrollDocumentStatus = this.reconcileDocumentStatus(nextCategory, worker.payrollDocumentStatus);

    if (currentKey !== nextKey) {
      this.registrations.delete(currentKey);
      this.registrations.set(nextKey, worker);
    }

    return this.toRegistrationResponse(worker);
  }

  async importRegistrationsXlsx(projectId: string | undefined, file: UploadedXlsxFile | undefined) {
    const normalizedProjectId = this.normalizeProjectId(projectId);
    this.assertXlsxFile(file);

    const rows = await readXlsxFile(file.buffer) as unknown as unknown[][];
    const dataRows = this.stripHeaderAndBlankRows(rows);

    if (dataRows.length > MAX_IMPORT_ROWS) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'IMPORT_TOO_LARGE', `Import row count must be ${MAX_IMPORT_ROWS} or less.`);
    }

    const errors: WorkerImportError[] = [];
    const drafts: ImportDraft[] = [];
    const batchPhones = new Set<string>();

    dataRows.forEach(({ row, cells }) => {
      const draft = this.parseImportRow(row, cells, normalizedProjectId, batchPhones, errors);
      if (draft) {
        drafts.push(draft);
      }
    });

    if (errors.length > 0) {
      return {
        importedCount: 0,
        rejectedCount: errors.length,
        errors,
        workers: this.listRegistrations(normalizedProjectId),
      };
    }

    const workers = drafts.map((draft) => this.createRegistration({
      projectId: normalizedProjectId,
      name: draft.name,
      phone: draft.phone,
      category: draft.category,
      company: draft.company,
      role: draft.role,
      memo: draft.memo,
    }));

    return {
      importedCount: workers.length,
      rejectedCount: 0,
      errors: [],
      workers: this.listRegistrations(normalizedProjectId),
    };
  }

  completeOnboarding(request: OnboardingRequest) {
    const category = this.normalizeExistingCategory(request.category, { requireSignupEnabled: true });
    const worker = this.findByPhone(request.phone, request.projectId);

    if (worker.name !== request.name.trim() || worker.category !== category) {
      throw new ApiError(
        HttpStatus.FORBIDDEN,
        'WORKER_REGISTRATION_MISMATCH',
        'Worker information does not match the admin registration.',
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
      throw new ApiError(HttpStatus.FORBIDDEN, 'WORKER_ONBOARDING_REQUIRED', 'Worker onboarding is required.');
    }

    const matches = worker.name === request.name.trim()
      && worker.verificationCode === request.code.trim()
      && this.passwords.verify(request.password, worker.passwordHash);

    if (!matches) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'WORKER_LOGIN_FAILED', 'Worker login failed.');
    }

    return {
      uid: worker.uid,
      projectId: worker.projectId,
      role: 'worker',
      name: worker.name,
      phone: worker.phone,
      category: worker.category,
      company: worker.company,
      workerRole: worker.role,
      schedule: 'unassigned',
      status: 'onboarded',
      payrollDocumentsRequired: this.isPayrollDocumentRequired(worker.category)
        && worker.payrollDocumentStatus === 'missing',
      payrollDocumentStatus: worker.payrollDocumentStatus,
    };
  }

  listRegistrations(projectIdOrFilters?: string | WorkerListFilters) {
    const filters: WorkerListFilters = typeof projectIdOrFilters === 'string'
      ? { projectId: projectIdOrFilters }
      : projectIdOrFilters ?? {};
    const normalizedProjectId = filters.projectId?.trim();
    const search = filters.search?.trim().toLowerCase();
    const searchDigits = search?.replace(/\D/g, '');

    return [...this.registrations.values()]
      .filter((worker) => !normalizedProjectId || worker.projectId === normalizedProjectId)
      .filter((worker) => !filters.category || worker.category === filters.category)
      .filter((worker) => !filters.company || worker.company === filters.company)
      .filter((worker) => !filters.role || worker.role === filters.role)
      .filter((worker) => !filters.registrationStatus || worker.registrationStatus === filters.registrationStatus)
      .filter((worker) => !filters.payrollDocumentStatus || worker.payrollDocumentStatus === filters.payrollDocumentStatus)
      .filter((worker) => {
        if (!search) {
          return true;
        }
        const phoneDigits = worker.phone.replace(/\D/g, '');
        return worker.name.toLowerCase().includes(search)
          || worker.phone.toLowerCase().includes(search)
          || worker.company.toLowerCase().includes(search)
          || worker.role.toLowerCase().includes(search)
          || (searchDigits ? phoneDigits.includes(searchDigits) : false);
      })
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .map((worker) => this.toRegistrationResponse(worker));
  }

  deleteRegistration(uid: string) {
    const worker = this.findByUid(uid);
    this.registrations.delete(this.registrationKey(worker.projectId, worker.phone));
  }

  listCategories(options: { includeDisabled?: boolean; signupOnly?: boolean } = {}) {
    return [...this.categories.values()]
      .filter((category) => options.includeDisabled || category.enabled)
      .filter((category) => !options.signupOnly || category.signupEnabled)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.category.localeCompare(b.category);
      });
  }

  saveCategory(request: WorkerCategoryRequest) {
    const category = this.normalizeCategoryLabel(request.category);
    const setting: WorkerCategorySetting = {
      category,
      enabled: request.enabled,
      signupEnabled: request.signupEnabled,
      payrollDocumentsRequired: request.payrollDocumentsRequired,
      sortOrder: request.sortOrder,
      updatedAt: new Date().toISOString(),
    };
    this.categories.set(category, setting);
    return setting;
  }

  renameCategory(request: WorkerCategoryRenameRequest) {
    const currentCategory = this.normalizeCategoryLabel(request.currentCategory);
    const nextCategory = this.normalizeCategoryLabel(request.nextCategory);
    const current = this.categories.get(currentCategory);

    if (!current) {
      throw new NotFoundException('Category not found.');
    }

    if (currentCategory === nextCategory) {
      return current;
    }

    if (this.categories.has(nextCategory)) {
      throw new ConflictException('Category already exists.');
    }

    const renamed: WorkerCategorySetting = {
      ...current,
      category: nextCategory,
      updatedAt: new Date().toISOString(),
    };
    this.categories.delete(currentCategory);
    this.categories.set(nextCategory, renamed);

    for (const worker of this.registrations.values()) {
      if (worker.category === currentCategory) {
        worker.category = nextCategory;
      }
    }

    return renamed;
  }

  deleteCategory(category: string) {
    const normalized = this.normalizeCategoryLabel(category);

    if (!this.categories.has(normalized)) {
      throw new NotFoundException('Category not found.');
    }

    if ([...this.registrations.values()].some((worker) => worker.category === normalized)) {
      throw new ConflictException('Category is used by existing workers.');
    }

    this.categories.delete(normalized);
  }

  listScheduleColumns(projectId?: string): ScheduleColumn[] {
    const normalizedProjectId = this.normalizeProjectId(projectId);
    return this.ensureScheduleColumns(normalizedProjectId);
  }

  createScheduleColumn(request: ScheduleColumnRequest): ScheduleColumn[] {
    const projectId = this.normalizeProjectId(request.projectId);
    const label = this.normalizeScheduleColumnLabel(request.label);
    const columns = this.ensureScheduleColumns(projectId);

    if (columns.some((column) => column.label === label)) {
      throw new ConflictException('Schedule column already exists.');
    }

    const now = new Date().toISOString();
    const column: ScheduleColumn = {
      id: randomUUID(),
      projectId,
      label,
      createdAt: now,
      updatedAt: now,
    };

    columns.push(column);
    return this.listScheduleColumns(projectId);
  }

  deleteScheduleColumn(id: string, projectId?: string): ScheduleColumn[] {
    const normalizedProjectId = this.normalizeProjectId(projectId);
    const columns = this.ensureScheduleColumns(normalizedProjectId);
    const nextColumns = columns.filter((column) => column.id !== id);

    if (nextColumns.length === columns.length) {
      throw new NotFoundException('Schedule column not found.');
    }

    this.scheduleColumns.set(normalizedProjectId, nextColumns);
    return this.listScheduleColumns(normalizedProjectId);
  }

  private parseImportRow(
    row: number,
    cells: unknown[],
    projectId: string,
    batchPhones: Set<string>,
    errors: WorkerImportError[],
  ): ImportDraft | null {
    const category = this.cellText(cells[IMPORT_COLUMNS.C.index]);
    const role = this.cellText(cells[IMPORT_COLUMNS.D.index]);
    const company = this.cellText(cells[IMPORT_COLUMNS.E.index]);
    const name = this.cellText(cells[IMPORT_COLUMNS.F.index]);
    const phoneText = this.cellText(cells[IMPORT_COLUMNS.H.index]);
    const memo = this.cellText(cells[IMPORT_COLUMNS.I.index]);

    const required: Array<[WorkerImportColumn, string]> = [
      ['C', category], ['D', role], ['E', company], ['F', name], ['H', phoneText], ['I', memo],
    ];

    for (const [column, value] of required) {
      if (!value) {
        errors.push(this.importError(row, column, 'REQUIRED', 'Required cell is empty.'));
      }
    }

    let normalizedCategory = '';
    let normalizedRole = '';
    let normalizedCompany = '';
    let normalizedMemo = '';
    let normalizedPhone = '';
    let normalizedName = '';

    try { normalizedCategory = this.normalizeExistingCategory(category); }
    catch { errors.push(this.importError(row, 'C', 'UNKNOWN_CATEGORY', 'Category is missing, unknown, or disabled.')); }
    try { normalizedRole = this.normalizeWorkerRole(role); }
    catch { errors.push(this.importError(row, 'D', 'INVALID_ROLE', 'Role is invalid.')); }
    try { normalizedCompany = this.normalizeCompany(company); }
    catch { errors.push(this.importError(row, 'E', 'INVALID_COMPANY', 'Company is invalid.')); }
    try { normalizedName = this.normalizeRequiredText(name, 'INVALID_WORKER_NAME', 'name', 80); }
    catch { errors.push(this.importError(row, 'F', 'INVALID_NAME', 'Name is invalid.')); }
    try { normalizedPhone = this.normalizePhone(phoneText); }
    catch { errors.push(this.importError(row, 'H', 'INVALID_PHONE', 'Phone format is invalid.')); }
    try { normalizedMemo = this.normalizeMemo(memo); }
    catch { errors.push(this.importError(row, 'I', 'INVALID_MEMO', 'Memo is invalid.')); }

    if (normalizedPhone) {
      const key = this.registrationKey(projectId, normalizedPhone);
      if (this.registrations.has(key) || batchPhones.has(normalizedPhone)) {
        errors.push(this.importError(row, 'H', 'DUPLICATE_PHONE', 'Phone already exists in this project or import batch.'));
      }
      batchPhones.add(normalizedPhone);
    }

    if (errors.some((error) => error.row === row)) {
      return null;
    }

    return {
      row,
      category: normalizedCategory,
      role: normalizedRole,
      company: normalizedCompany,
      name: normalizedName,
      phone: normalizedPhone,
      memo: normalizedMemo,
    };
  }

  private assertXlsxFile(file: UploadedXlsxFile | undefined): asserts file is UploadedXlsxFile {
    if (!file) {
      throw new BadRequestException('XLSX file is required.');
    }

    if (file.size > MAX_IMPORT_FILE_SIZE) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'IMPORT_FILE_TOO_LARGE', 'XLSX file is too large.');
    }

    const name = file.originalname.toLowerCase();
    if (!name.endsWith('.xlsx') || name.endsWith('.xls')) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'UNSUPPORTED_IMPORT_FILE', 'Only .xlsx files are accepted.');
    }
  }

  private stripHeaderAndBlankRows(rows: unknown[][]) {
    const indexedRows = rows.map((cells, index) => ({ row: index + 1, cells }));
    const nonBlankRows = indexedRows.filter(({ cells }) => cells.some((cell) => this.cellText(cell).length > 0));
    const [first, ...rest] = nonBlankRows;

    if (!first) {
      return [];
    }

    const firstCategory = this.cellText(first.cells[IMPORT_COLUMNS.C.index]).toLowerCase();
    const firstName = this.cellText(first.cells[IMPORT_COLUMNS.F.index]).toLowerCase();
    const looksLikeHeader = first.row === 1 && (
      firstCategory.includes('category') ||
      firstName.includes('name') ||
      firstName.includes('name')
    );

    return looksLikeHeader ? rest : nonBlankRows;
  }

  private cellText(value: unknown) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  private importError(row: number, column: WorkerImportColumn, code: string, message: string): WorkerImportError {
    return {
      row,
      column,
      label: IMPORT_COLUMNS[column].label,
      code,
      message,
    };
  }

  private seedCategories() {
    const now = new Date().toISOString();
    this.categories.set('direct-hire', {
      category: 'direct-hire',
      enabled: true,
      signupEnabled: true,
      payrollDocumentsRequired: true,
      sortOrder: 10,
      updatedAt: now,
    });
    this.categories.set('external-partner', {
      category: 'external-partner',
      enabled: true,
      signupEnabled: true,
      payrollDocumentsRequired: false,
      sortOrder: 20,
      updatedAt: now,
    });
  }

  private seedScheduleColumns() {
    const now = new Date().toISOString();
    const seedColumns: Record<string, string[]> = {
      [DEFAULT_PROJECT_ID]: [
        'main-installation',
        'stage-structure',
        'lighting',
        'sound',
        'special-effects',
        'gate-operations',
      ],
      'waterbomb-2026-winter': [
        'planning',
        'partner-coordination',
        'safety-check',
        'equipment-inbound',
      ],
    };

    Object.entries(seedColumns).forEach(([projectId, labels]) => {
      this.scheduleColumns.set(projectId, labels.map((label, index) => ({
        id: `${projectId}-schedule-column-${index + 1}`,
        projectId,
        label,
        createdAt: now,
        updatedAt: now,
      })));
    });
  }

  private seedWorkerRegistration() {
    this.createRegistration({
      name: 'test worker',
      phone: '010-1234-5678',
      category: 'direct-hire',
      company: 'Madeone',
      role: 'safety lead',
      memo: 'seed data',
    });

    const localWorkerPassword = process.env.LOCAL_TEST_WORKER_PASSWORD;
    const localWorkerCode = process.env.LOCAL_TEST_WORKER_CODE;

    if (process.env.ENABLE_LOCAL_TEST_WORKER === 'true' && localWorkerPassword && localWorkerCode) {
      const localWorker = this.createRegistration({
        name: process.env.LOCAL_TEST_WORKER_NAME ?? 'local worker',
        phone: process.env.LOCAL_TEST_WORKER_PHONE ?? '010-9000-0001',
        category: process.env.LOCAL_TEST_WORKER_CATEGORY ?? 'external-partner',
        company: process.env.LOCAL_TEST_WORKER_COMPANY ?? 'local company',
        role: process.env.LOCAL_TEST_WORKER_ROLE ?? 'operations support',
        memo: process.env.LOCAL_TEST_WORKER_MEMO ?? 'local test account',
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
      throw new NotFoundException('Worker registration not found.');
    }

    if (!normalizedProjectId && matches.length > 1) {
      throw new ConflictException('Multiple projects contain this phone. Specify a project.');
    }

    return worker;
  }

  private findByUid(uid: string) {
    const worker = [...this.registrations.values()].find((registration) => registration.uid === uid);

    if (!worker) {
      throw new NotFoundException('Worker registration not found.');
    }

    return worker;
  }

  private normalizeProjectId(projectId?: string) {
    return projectId?.trim() || DEFAULT_PROJECT_ID;
  }

  private registrationKey(projectId: string, phone: string) {
    return `${projectId}:${phone}`;
  }

  private ensureScheduleColumns(projectId: string) {
    const existing = this.scheduleColumns.get(projectId);
    if (existing) {
      return existing;
    }

    const columns: ScheduleColumn[] = [];
    this.scheduleColumns.set(projectId, columns);
    return columns;
  }

  private normalizePhone(phone: string) {
    const digits = (phone ?? '').replace(/\D/g, '');

    if (digits.length === 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    throw new ApiError(HttpStatus.BAD_REQUEST, 'INVALID_PHONE', 'Phone must have 10 or 11 digits.');
  }

  private normalizeExistingCategory(category: string, options: { requireEnabled?: boolean; requireSignupEnabled?: boolean } = {}) {
    const normalized = this.normalizeCategoryLabel(category);
    const setting = this.categories.get(normalized);

    if (!setting) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'UNKNOWN_CATEGORY', 'Unknown category.');
    }

    if (options.requireEnabled !== false && !setting.enabled) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'DISABLED_CATEGORY', 'Category is disabled.');
    }

    if (options.requireSignupEnabled && !setting.signupEnabled) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'SIGNUP_DISABLED_CATEGORY', 'Category is not available for worker signup.');
    }

    return normalized;
  }

  private normalizeCategoryLabel(category: string) {
    return this.normalizeRequiredText(category, 'INVALID_CATEGORY', 'category', 40);
  }

  private normalizeCompany(company: string) {
    return this.normalizeRequiredText(company, 'INVALID_COMPANY', 'company', 80);
  }

  private normalizeWorkerRole(role: string) {
    return this.normalizeRequiredText(role, 'INVALID_ROLE', 'role', 80);
  }

  private normalizeMemo(memo: string) {
    const normalized = (memo ?? '').trim();
    if (!normalized || normalized.length > 500) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'INVALID_MEMO', 'Memo is required and must be 500 characters or less.');
    }
    return normalized;
  }

  private normalizeRequiredText(value: string, code: string, label: string, maxLength: number) {
    const normalized = (value ?? '').trim();

    if (!normalized || normalized.length > maxLength) {
      throw new ApiError(HttpStatus.BAD_REQUEST, code, `${label} is required and must be ${maxLength} characters or less.`);
    }

    return normalized;
  }

  private normalizeScheduleColumnLabel(label: string) {
    return this.normalizeRequiredText(label, 'INVALID_SCHEDULE_COLUMN', 'schedule column', 40);
  }

  private initialPayrollDocumentStatus(category: string): PayrollDocumentStatus {
    return this.isPayrollDocumentRequired(category) ? 'missing' : 'approved';
  }

  private reconcileDocumentStatus(category: string, current: PayrollDocumentStatus): PayrollDocumentStatus {
    if (!this.isPayrollDocumentRequired(category)) {
      return 'approved';
    }
    return current === 'approved' ? 'approved' : current;
  }

  private isPayrollDocumentRequired(category: string) {
    return this.categories.get(category)?.payrollDocumentsRequired ?? false;
  }

  private toRegistrationResponse(worker: WorkerRegistration) {
    const { passwordHash: _passwordHash, verificationCode: _verificationCode, ...response } = worker;
    return response;
  }
}
