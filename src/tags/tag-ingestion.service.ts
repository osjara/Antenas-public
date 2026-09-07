import { Injectable, Logger } from '@nestjs/common';
import { ParsedDataUpload } from '../protocol/interfaces/parsed-tag.interface';
import { TagsService } from './tags.service';
import { TagReadingsRepository } from '../database/tag-readings.repository';
import { ForwardTagService } from '../forwarding/forward-tag.service';

@Injectable()
export class TagIngestionService {
  private readonly logger = new Logger(TagIngestionService.name);

  constructor(
    private readonly tagsService: TagsService,
    private readonly tagReadingsRepository: TagReadingsRepository,
    private readonly forwardTagService: ForwardTagService,
  ) {}

  ingest(parsedJson: ParsedDataUpload | null): void {
    if (!parsedJson || !Array.isArray(parsedJson.TAG)) {
      return;
    }

    for (const tag of parsedJson.TAG) {
      const index = this.tagsService.upsert(tag);

      this.logger.log(
        `[TAG] index=${index} tagid=${tag.tagid} tlvtype=${tag.tlvtype} antenna=${tag.antenna} ` +
          `intensity=${tag.intensity} entry=${tag.entry} staying=${tag.staying} ` +
          `time=${tag.time} device=${tag.device}`,
      );

      this.tagReadingsRepository.insertTag(tag);
      void this.forwardTagService.forward(tag);
    }

    this.tagsService.enforceCapacity();
  }
}
