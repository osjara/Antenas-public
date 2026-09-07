// Pure Node.js MR7901 protocol implementation — replaces the vendor DLL wrapper.

import { Injectable, Logger } from '@nestjs/common';
import { parsePacket } from './packet.util';
import { buildRegisterAck, buildLoginAck, buildHeartbeatAck, buildDataAck } from './commands.util';
import { parseTlvPayload } from './tlv-parser.util';
import { ParsedDataUpload } from './interfaces/parsed-tag.interface';

export interface DecodedCommandHeader {
  cmd: string;
  seqno: string;
  device: string;
  version: string;
}

export interface DecodedCommand {
  cmd: number;
  header: DecodedCommandHeader;
}

export interface DataUploadResult {
  ackBuffer: Buffer;
  parsed: ParsedDataUpload | null;
}

@Injectable()
export class RfidProtocolService {
  private readonly logger = new Logger(RfidProtocolService.name);

  decodeCmd(buffer: Buffer): DecodedCommand {
    const parsed = parsePacket(buffer);

    let version = '';
    if (parsed.cmd === 0x0001 && parsed.payload.length >= 2) {
      // LOGIN: version at payload[0..1]
      version = `${parsed.payload[0]}.${parsed.payload[1]}`;
    } else if (parsed.cmd === 0x0003 && parsed.payload.length >= 6) {
      // HEARTBEAT: version at payload[4..5]
      version = `${parsed.payload[4]}.${parsed.payload[5]}`;
    }

    const header: DecodedCommandHeader = {
      cmd: '0x' + parsed.cmd.toString(16).padStart(4, '0'),
      seqno: parsed.seqno.toString(16).padStart(8, '0'),
      device: parsed.deviceId,
      version,
    };

    return { cmd: parsed.cmd, header };
  }

  buildRegisterAck(buffer: Buffer, host: string, port: number): Buffer {
    const parsed = parsePacket(buffer);
    return buildRegisterAck(parsed, host, port);
  }

  buildLoginAck(buffer: Buffer): Buffer {
    const parsed = parsePacket(buffer);
    return buildLoginAck(parsed);
  }

  buildHeartbeatAck(buffer: Buffer): Buffer {
    const parsed = parsePacket(buffer);
    return buildHeartbeatAck(parsed);
  }

  parseDataUpload(buffer: Buffer): DataUploadResult {
    this.logger.debug(`[RAW] buffer: ${buffer.toString('hex')}`);
    const parsed = parsePacket(buffer);
    this.logger.debug(
      `[RAW] device: ${parsed.deviceId} payload hex: ${parsed.payload
        .toString('hex')
        .toUpperCase()
        .replace(/(..)/g, '$1 ')
        .trim()}`,
    );
    const ackBuffer = buildDataAck(parsed);
    const result = parseTlvPayload(parsed.payload, parsed.deviceId);
    this.logger.debug(JSON.stringify(result));
    return { ackBuffer, parsed: result };
  }
}
