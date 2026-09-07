// Packet format (spec V1.6 section 5):
//   [0-1]   start flag: 0x55 0xAA
//   [2-3]   total_len (BE) = 28 (header) + service_content_len
//   [4-5]   cmd (BE)
//   [6-9]   seqno (BE uint32)
//   [10-11] proto_ver (BE)
//   [12-13] sec_flag (BE)
//   [14-29] device_id (16 bytes ASCII, null-padded)
//   [30..]  service content
//   [-2:]   CRC16 over bytes [2..total_len+1]

import { crc16 } from './crc.util';
import { PacketFramingError } from './packet-framing.error';
import { ParsedPacket } from './interfaces/parsed-packet.interface';

const HEADER_LEN = 28;
const MIN_PACKET = 2 + HEADER_LEN + 2; // start + header + crc

export function parsePacket(buffer: Buffer): ParsedPacket {
  if (buffer.length < MIN_PACKET) {
    throw new PacketFramingError(`Packet too short: ${buffer.length} bytes`);
  }
  if (buffer[0] !== 0x55 || buffer[1] !== 0xaa) {
    throw new PacketFramingError(
      `Invalid start flag: 0x${buffer[0].toString(16)} 0x${buffer[1].toString(16)}`,
    );
  }

  const totalLen = buffer.readUInt16BE(2);
  const expectedSize = 2 + totalLen + 2;
  if (buffer.length < expectedSize) {
    throw new PacketFramingError(
      `Incomplete packet: expected ${expectedSize}, got ${buffer.length}`,
    );
  }

  const dataForCrc = buffer.subarray(2, 2 + totalLen);
  const receivedCrc = buffer.readUInt16BE(2 + totalLen);
  const computedCrc = crc16(dataForCrc);
  if (computedCrc !== receivedCrc) {
    throw new PacketFramingError(
      `CRC mismatch: expected 0x${computedCrc.toString(16)}, got 0x${receivedCrc.toString(16)}`,
      -102,
    );
  }

  const cmd = buffer.readUInt16BE(4);
  const seqno = buffer.readUInt32BE(6);
  const protoVer = buffer.readUInt16BE(10);
  const secFlag = buffer.readUInt16BE(12);

  const devBuf = buffer.subarray(14, 30);
  const nullIdx = devBuf.indexOf(0);
  const deviceId = devBuf.toString('ascii', 0, nullIdx >= 0 ? nullIdx : 16);

  const serviceLen = totalLen - HEADER_LEN;
  const payload = buffer.subarray(30, 30 + serviceLen);

  return { cmd, seqno, protoVer, secFlag, deviceId, payload };
}

export function buildPacket(
  cmd: number,
  seqno: number,
  deviceId: string,
  serviceContent?: Buffer,
): Buffer {
  const sc = serviceContent || Buffer.alloc(0);
  const totalLen = HEADER_LEN + sc.length;

  const header = Buffer.alloc(HEADER_LEN, 0);
  header.writeUInt16BE(totalLen, 0);
  header.writeUInt16BE(cmd, 2);
  header.writeUInt32BE(seqno >>> 0, 4);
  header.writeUInt16BE(0x0001, 8); // proto_ver
  header.writeUInt16BE(0x0000, 10); // sec_flag
  const devAscii = Buffer.from(deviceId, 'ascii');
  devAscii.copy(header, 12, 0, Math.min(devAscii.length, 15)); // leave byte 27 as 0

  const dataForCrc = Buffer.concat([header, sc]);
  const crcVal = crc16(dataForCrc);
  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16BE(crcVal, 0);

  return Buffer.concat([Buffer.from([0x55, 0xaa]), dataForCrc, crcBuf]);
}

export function getCurrentTime(): Buffer {
  const now = new Date();
  return Buffer.from([
    now.getFullYear() - 2000,
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ]);
}
