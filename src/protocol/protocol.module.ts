import { Module } from '@nestjs/common';
import { RfidProtocolService } from './rfid-protocol.service';

@Module({
  providers: [RfidProtocolService],
  exports: [RfidProtocolService],
})
export class ProtocolModule {}
