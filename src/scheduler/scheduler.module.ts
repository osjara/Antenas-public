import { Module } from '@nestjs/common';
import { PurgeService } from './purge.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [PurgeService],
  exports: [PurgeService],
})
export class SchedulerModule {}
