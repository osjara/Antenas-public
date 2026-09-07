import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TagReadingsRepository } from './tag-readings.repository';

@Module({
  providers: [DatabaseService, TagReadingsRepository],
  exports: [DatabaseService, TagReadingsRepository],
})
export class DatabaseModule {}
