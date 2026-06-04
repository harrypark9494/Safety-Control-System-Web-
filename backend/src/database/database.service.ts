import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

export type DatabaseHealthStatus = 'disabled' | 'up' | 'down';

export interface DatabaseHealth {
  configured: boolean;
  status: DatabaseHealthStatus;
  provider: 'postgresql' | null;
  database?: string;
  latencyMs?: number;
  error?: string;
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool | null = null;

  storageMode() {
    return this.databaseUrl() ? 'postgresql' : 'memory';
  }

  async health(): Promise<DatabaseHealth> {
    const databaseUrl = this.databaseUrl();

    if (!databaseUrl) {
      return {
        configured: false,
        status: 'disabled',
        provider: null,
      };
    }

    const startedAt = Date.now();

    try {
      const result = await this.ensurePool(databaseUrl).query<{ database: string }>(
        'select current_database() as database',
      );

      return {
        configured: true,
        status: 'up',
        provider: 'postgresql',
        database: result.rows[0]?.database,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        configured: true,
        status: 'down',
        provider: 'postgresql',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown database error',
      };
    }
  }

  async onModuleDestroy() {
    await this.pool?.end();
    this.pool = null;
  }

  private ensurePool(databaseUrl: string) {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 2000),
        idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? 10_000),
        max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      });
    }

    return this.pool;
  }

  private databaseUrl() {
    return process.env.DATABASE_URL?.trim();
  }
}
