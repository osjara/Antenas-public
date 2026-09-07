import { Module } from '@nestjs/common';
import { TcpServerService } from './tcp-server.service';
import { ProtocolModule } from '../protocol/protocol.module';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [ProtocolModule, TagsModule],
  providers: [TcpServerService],
})
export class TcpServerModule {}
