import { Module } from '@nestjs/common';
import { ForwardTagService } from './forward-tag.service';

@Module({
  providers: [ForwardTagService],
  exports: [ForwardTagService],
})
export class ForwardingModule {}
