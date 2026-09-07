// ACK builders — one per command (spec V1.6 section 6)
// Each ACK echoes back the seqno and device_id from the device packet.

import { buildPacket, getCurrentTime } from './packet.util';
import { ParsedPacket } from './interfaces/parsed-packet.interface';

// 0x8008 — Register ACK (spec 6.1.2)
// Service content: reg_status(1) + time(6) + IP(32) + port(2, little-endian)
export function buildRegisterAck(parsed: ParsedPacket, host: string, port: number): Buffer {
  const sc = Buffer.alloc(41, 0);
  sc[0] = 0x00; // registration success
  getCurrentTime().copy(sc, 1);
  const ipBuf = Buffer.from(String(host), 'ascii');
  ipBuf.copy(sc, 7, 0, Math.min(ipBuf.length, 31));
  sc.writeUInt16LE(port, 39);
  return buildPacket(0x8008, parsed.seqno, parsed.deviceId, sc);
}

// 0x8001 — Login ACK (spec 6.2.2)
// Service content: login_status(1) + time(6)
export function buildLoginAck(parsed: ParsedPacket): Buffer {
  const sc = Buffer.alloc(7, 0);
  sc[0] = 0x00; // login successful, no operation request
  getCurrentTime().copy(sc, 1);
  return buildPacket(0x8001, parsed.seqno, parsed.deviceId, sc);
}

// 0x8003 — Heartbeat ACK (spec 6.3.2)
// Service content: operation(1) + time(6)
export function buildHeartbeatAck(parsed: ParsedPacket): Buffer {
  const sc = Buffer.alloc(7, 0);
  sc[0] = 0x00; // no operation
  getCurrentTime().copy(sc, 1);
  return buildPacket(0x8003, parsed.seqno, parsed.deviceId, sc);
}

// 0x8004 — Data ACK (spec 6.4.2) — same content as heartbeat ACK
export function buildDataAck(parsed: ParsedPacket): Buffer {
  const sc = Buffer.alloc(7, 0);
  sc[0] = 0x00;
  getCurrentTime().copy(sc, 1);
  return buildPacket(0x8004, parsed.seqno, parsed.deviceId, sc);
}
