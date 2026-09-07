import * as net from 'net';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import configuration from '../config/configuration';
import { RfidCommand } from '../protocol/enums/rfid-command.enum';
import { RfidProtocolService } from '../protocol/rfid-protocol.service';
import { TagIngestionService } from '../tags/tag-ingestion.service';

@Injectable()
export class TcpServerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TcpServerService.name);
  private server: net.Server | null = null;

  constructor(
    @Inject(configuration.KEY) private readonly config: ConfigType<typeof configuration>,
    private readonly rfid: RfidProtocolService,
    private readonly tagIngestionService: TagIngestionService,
  ) {}

  onApplicationBootstrap(): void {
    const server = net.createServer((socket) => {
      socket.setNoDelay(true);
      socket.setKeepAlive(true, 30_000);

      const peer = `${socket.remoteAddress}:${socket.remotePort}`;
      this.logger.log(`[TCP] client connected ${peer}`);

      socket.on('data', (data) => {
        // The socket is never put into a string encoding, so this is always a Buffer at runtime.
        const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
        try {
          const { cmd, header } = this.rfid.decodeCmd(chunk);

          switch (cmd) {
            case RfidCommand.REGISTER: {
              const reportedIp = this.config.publicIp || socket.localAddress || this.config.host;
              const ack = this.rfid.buildRegisterAck(chunk, reportedIp, this.config.port);
              this.writeIfBuffer(socket, ack);
              break;
            }
            case RfidCommand.LOGIN: {
              const ack = this.rfid.buildLoginAck(chunk);
              this.writeIfBuffer(socket, ack);
              break;
            }
            case RfidCommand.HEARTBEAT: {
              const ack = this.rfid.buildHeartbeatAck(chunk);
              this.writeIfBuffer(socket, ack);
              break;
            }
            case RfidCommand.DATA_UPLOAD: {
              const { ackBuffer, parsed } = this.rfid.parseDataUpload(chunk);
              this.writeIfBuffer(socket, ackBuffer);
              this.tagIngestionService.ingest(parsed);
              break;
            }
            default:
              this.logger.log(`[TCP] unknown cmd cmd=${cmd} header=${JSON.stringify(header)}`);
              break;
          }
        } catch (error) {
          this.logger.log(`[TCP] packet error error=${(error as Error).message}`);
        }
      });

      socket.on('close', () => {
        this.logger.log(`[TCP] client disconnected ${peer}`);
      });

      socket.on('error', (error) => {
        this.logger.log(`[TCP] socket error peer=${peer} error=${error.message}`);
      });
    });

    server.on('error', (error) => {
      this.logger.error('[TCP] server error', error);
      process.exitCode = 1;
    });

    server.listen(this.config.port, this.config.host, () => {
      this.logger.log(
        `[TCP] listening host=${this.config.host} port=${this.config.port} forwardTagUrl=${this.config.forwardTagUrl}`,
      );
    });

    this.server = server;
  }

  private writeIfBuffer(socket: net.Socket, maybeBuffer: Buffer): void {
    if (Buffer.isBuffer(maybeBuffer) && maybeBuffer.length > 0) {
      socket.write(maybeBuffer);
    }
  }

  onModuleDestroy(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => resolve());
    });
  }
}
