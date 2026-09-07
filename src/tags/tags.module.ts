import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagIngestionService } from './tag-ingestion.service';
import { DatabaseModule } from '../database/database.module';
import { ForwardingModule } from '../forwarding/forwarding.module';

@Module({
  imports: [DatabaseModule, ForwardingModule],
  providers: [TagsService, TagIngestionService],
  exports: [TagsService, TagIngestionService],
})
export class TagsModule {}
