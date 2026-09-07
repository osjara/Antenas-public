import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import * as cron from 'node-cron';
import { TagReadingsRepository } from '../database/tag-readings.repository';

@Injectable()
export class PurgeService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(PurgeService.name);
  private task: cron.ScheduledTask | null = null;

  constructor(private readonly tagReadingsRepository: TagReadingsRepository) {}

  onApplicationBootstrap(): void {
    // Runs every Sunday at 02:00.
    this.task = cron.schedule('0 2 * * 0', () => this.runPurge());
  }

  onModuleDestroy(): void {
    this.task?.stop();
  }

  runPurge(): void {
    this.logger.log('[DB] purga semanal iniciada');
    try {
      const deleted = this.tagReadingsRepository.clearConsumed();
      this.tagReadingsRepository.vacuum();
      this.logger.log(`[DB] purga semanal completada deleted=${deleted}`);
    } catch (err) {
      this.logger.log(`[DB] purga semanal error error=${(err as Error).message}`);
    }
  }
}
