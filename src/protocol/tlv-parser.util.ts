// TLV parser for DATA_UPLOAD (cmd 0x0004) — spec V1.6 sections 7.1 and 7.2
//
// TLV wire format: type(2BE) | length(2BE) | value(length bytes)
//
// 0x8B01 — RFID tag, value = 17 bytes:
//   [0]     channel_byte: bit7=entry, bit6=staying, bits3-0=antenna
//   [1]     tag_type hex (0x20=student, 0x30=ebike, 0x31=ebikekey)
//   [2..5]  tag_id (4 bytes)
//   [6]     checksum (CC)
//   [7..8]  incentive_addr (ignored)
//   [9]     status (bit0 = low-voltage alarm)
//   [10]    rssi (signed int8, dBm)
//   [11..16] time (year-2000, month, day, hour, min, sec)
//
// 0x8B02 — Attendance tag — same layout, bit7=in(1)/out(0), bit6=unilateral

import { ParsedDataUpload, ParsedTag } from './interfaces/parsed-tag.interface';

function formatTime(timeBuf: Buffer, offset: number): string {
  const y = timeBuf[offset] + 2000;
  const mo = timeBuf[offset + 1];
  const d = timeBuf[offset + 2];
  const h = timeBuf[offset + 3];
  const mi = timeBuf[offset + 4];
  const s = timeBuf[offset + 5];
  return (
    `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')} ` +
    `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  );
}

function parseTagValue(value: Buffer, tlvType: number, deviceId: string): ParsedTag | null {
  if (value.length < 17) return null;

  const channelByte = value[0];
  const entry = (channelByte >> 7) & 1;
  const staying = (channelByte >> 6) & 1;
  const antenna = channelByte & 0x0f;

  const tagType = value[1];
  const tagId = value.subarray(2, 6).toString('hex').toUpperCase();
  const alarm = value[9] & 0x01;
  const rssi = value.readInt8(10);
  const time = formatTime(value, 11);

  return {
    device: deviceId,
    tagid: tagId,
    tlvtype: '0x' + tlvType.toString(16).toUpperCase().padStart(4, '0'),
    tagtype: tagType.toString(16).toUpperCase().padStart(2, '0'),
    antenna,
    intensity: rssi,
    entry,
    staying,
    alarm,
    time,
  };
}

export function parseTlvPayload(payload: Buffer, deviceId: string): ParsedDataUpload | null {
  const tags: ParsedTag[] = [];
  let offset = 0;

  while (offset + 4 <= payload.length) {
    const tlvType = payload.readUInt16BE(offset);
    const tlvLen = payload.readUInt16BE(offset + 2);
    offset += 4;

    if (offset + tlvLen > payload.length) break;

    const value = payload.subarray(offset, offset + tlvLen);
    offset += tlvLen;

    if (tlvType === 0x8b01 || tlvType === 0x8b02) {
      const tag = parseTagValue(value, tlvType, deviceId);
      if (tag) tags.push(tag);
    }
  }

  return tags.length > 0 ? { TAG: tags } : null;
}
