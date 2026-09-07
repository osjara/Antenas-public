import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ProtocolModule } from './protocol/protocol.module';
import { DatabaseModule } from './database/database.module';
import { TagsModule } from './tags/tags.module';
import { ForwardingModule } from './forwarding/forwarding.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { HttpApiModule } from './http-api/http-api.module';
import { TcpServerModule } from './tcp-server/tcp-server.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ProtocolModule,
    DatabaseModule,
    TagsModule,
    ForwardingModule,
    SchedulerModule,
    HttpApiModule,
    TcpServerModule,
  ],
})
export class AppModule {}
