import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { WorkersService } from '../workers/workers.service';
import type { MealType, QrEntitlement, QrType, QrUsageEvent } from './qr.types';
import type { QrScanRequest } from './qr.dto';

type QrEntitlementResponse = {
  qrType: QrType;
  label: string;
  issuedDate: string;
  totalCount: number;
  usedCount: number;
  remainingCount: number;
  status: QrEntitlement['status'];
  qrToken: string;
  help: string;
};

type WorkerLookup = { uid: string };

@Injectable()
export class QrService {
  private readonly entitlements = new Map<string, QrEntitlement>();
  private readonly usageEvents: QrUsageEvent[] = [];

  constructor(private readonly workers: WorkersService) {
    this.seedUsageEvents();
  }

  getWorkerEntitlements(workerId: string, issuedDate = this.today()) {
    this.findWorker(workerId);
    return this.ensureWorkerEntitlements(workerId, issuedDate).map((entitlement) => (
      this.toEntitlementResponse(entitlement)
    ));
  }

  getAdminSummary(issuedDate = this.today(), mealType: MealType | 'all' = 'all', projectId?: string) {
    const workers = this.workers.listRegistrations(projectId) as WorkerLookup[];
    const workerIds = new Set(workers.map((worker) => worker.uid));
    const entitlements = this.ensureAllEntitlements(issuedDate, projectId);
    const filteredEvents = this.usageEvents.filter((event) => (
      event.usedAt.startsWith(issuedDate)
      && workerIds.has(event.workerId)
      && (mealType === 'all' || event.mealType === mealType || event.qrType === 'water')
    ));
    const meal = this.aggregateType(entitlements, filteredEvents, 'meal');
    const water = this.aggregateType(entitlements, filteredEvents, 'water');
    const hourlyUsage = this.buildHourlyUsage(filteredEvents);

    return {
      date: issuedDate,
      mealType,
      totals: { meal, water },
      hourlyUsage,
    };
  }

  recordScan(request: QrScanRequest) {
    const issuedDate = this.today();
    const entitlement = this.ensureEntitlement(request.workerId, request.qrType, issuedDate);

    if (entitlement.status !== 'active' || entitlement.usedCount >= entitlement.totalCount) {
      throw new BadRequestException('사용 가능한 QR 지급 수량이 없습니다.');
    }

    entitlement.usedCount += 1;
    entitlement.status = entitlement.usedCount >= entitlement.totalCount ? 'exhausted' : 'active';
    entitlement.updatedAt = new Date().toISOString();

    const event: QrUsageEvent = {
      id: randomUUID(),
      entitlementId: entitlement.id,
      workerId: request.workerId,
      qrType: request.qrType,
      usedAt: new Date().toISOString(),
      scanLocation: request.scanLocation.trim(),
      mealType: request.qrType === 'meal' ? request.mealType ?? 'lunch' : null,
    };
    this.usageEvents.push(event);

    return {
      event,
      entitlement: this.toEntitlementResponse(entitlement),
    };
  }

  private ensureAllEntitlements(issuedDate: string, projectId?: string) {
    const workers = this.workers.listRegistrations(projectId) as WorkerLookup[];
    return workers.flatMap((worker) => this.ensureWorkerEntitlements(worker.uid, issuedDate));
  }

  private ensureWorkerEntitlements(workerId: string, issuedDate: string) {
    return [
      this.ensureEntitlement(workerId, 'meal', issuedDate),
      this.ensureEntitlement(workerId, 'water', issuedDate),
    ];
  }

  private ensureEntitlement(workerId: string, qrType: QrType, issuedDate: string) {
    this.findWorker(workerId);
    const key = this.entitlementKey(workerId, qrType, issuedDate);
    const existing = this.entitlements.get(key);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const entitlement: QrEntitlement = {
      id: randomUUID(),
      workerId,
      qrType,
      issuedDate,
      totalCount: qrType === 'meal' ? 2 : 3,
      usedCount: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    this.entitlements.set(key, entitlement);
    return entitlement;
  }

  private aggregateType(entitlements: QrEntitlement[], events: QrUsageEvent[], qrType: QrType) {
    const typeEntitlements = entitlements.filter((entitlement) => entitlement.qrType === qrType);
    const totalIssued = typeEntitlements.reduce((sum, entitlement) => sum + entitlement.totalCount, 0);
    const usedCount = events.filter((event) => event.qrType === qrType).length;
    const remainingCount = Math.max(totalIssued - usedCount, 0);

    return {
      issued: totalIssued,
      used: usedCount,
      remaining: remainingCount,
      usageRate: totalIssued > 0 ? Math.round((usedCount / totalIssued) * 1000) / 10 : 0,
    };
  }

  private buildHourlyUsage(events: QrUsageEvent[]) {
    const buckets = new Map<string, { hourRange: string; mealUsed: number; waterUsed: number; status: string }>();

    for (const event of events) {
      const hour = new Date(event.usedAt).getHours();
      const hourRange = `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`;
      const bucket = buckets.get(hourRange) ?? { hourRange, mealUsed: 0, waterUsed: 0, status: '정상' };

      if (event.qrType === 'meal') {
        bucket.mealUsed += 1;
      } else {
        bucket.waterUsed += 1;
      }

      if (bucket.mealUsed + bucket.waterUsed >= 20) {
        bucket.status = '피크타임';
      }

      buckets.set(hourRange, bucket);
    }

    return [...buckets.values()].sort((a, b) => b.hourRange.localeCompare(a.hourRange));
  }

  private toEntitlementResponse(entitlement: QrEntitlement): QrEntitlementResponse {
    const remainingCount = Math.max(entitlement.totalCount - entitlement.usedCount, 0);

    return {
      qrType: entitlement.qrType,
      label: entitlement.qrType === 'meal' ? '식권' : '생수',
      issuedDate: entitlement.issuedDate,
      totalCount: entitlement.totalCount,
      usedCount: entitlement.usedCount,
      remainingCount,
      status: entitlement.status,
      qrToken: Buffer.from(`${entitlement.workerId}:${entitlement.issuedDate}:${entitlement.qrType}`).toString('base64url'),
      help: entitlement.qrType === 'meal'
        ? '운영 데스크에서 위 QR 코드를 스캔하세요'
        : '워터 스테이션에서 위 QR 코드를 스캔하세요',
    };
  }

  private findWorker(workerId: string) {
    const worker = (this.workers.listRegistrations({ allowAllProjects: true }) as WorkerLookup[])
      .find((registration) => registration.uid === workerId);

    if (!worker) {
      throw new NotFoundException('근로자 정보를 찾을 수 없습니다.');
    }

    return worker;
  }

  private seedUsageEvents() {
    const [worker] = this.workers.listRegistrations({ allowAllProjects: true }) as WorkerLookup[];

    if (!worker) {
      return;
    }

    const today = this.today();
    this.recordSeedUsage(worker.uid, 'meal', today, 'lunch', '운영 데스크');
    this.recordSeedUsage(worker.uid, 'water', today, null, '워터 스테이션');
  }

  private recordSeedUsage(workerId: string, qrType: QrType, issuedDate: string, mealType: MealType | null, scanLocation: string) {
    const entitlement = this.ensureEntitlement(workerId, qrType, issuedDate);
    entitlement.usedCount += 1;
    entitlement.updatedAt = new Date().toISOString();

    this.usageEvents.push({
      id: randomUUID(),
      entitlementId: entitlement.id,
      workerId,
      qrType,
      usedAt: `${issuedDate}T12:${qrType === 'meal' ? '10' : '25'}:00.000Z`,
      scanLocation,
      mealType,
    });
  }

  private entitlementKey(workerId: string, qrType: QrType, issuedDate: string) {
    return `${workerId}:${issuedDate}:${qrType}`;
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
}
