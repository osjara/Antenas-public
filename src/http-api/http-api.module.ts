import { Module } from '@nestjs/common';
import { TagsModule } from '../tags/tags.module';
import { DatabaseModule } from '../database/database.module';
import { HealthController } from './controllers/health.controller';
import { TagsQueryController } from './controllers/tags-query.controller';
import { TagsController } from './controllers/tags.controller';
import { TagReadingsController } from './controllers/tag-readings.controller';
import { ManualController } from './controllers/manual.controller';

@Module({
  imports: [TagsModule, DatabaseModule],
  controllers: [
    HealthController,
    TagsQueryController,
    TagsController,
    TagReadingsController,
    ManualController,
  ],
})
export class HttpApiModule {}
