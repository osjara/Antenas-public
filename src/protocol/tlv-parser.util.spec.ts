import { parseTlvPayload } from './tlv-parser.util';

describe('tlv-parser.util', () => {
  it('parses an 0x8B01 RFID tag TLV block into a ParsedTag', () => {
    const value = Buffer.from([
      0x81, // entry=1, staying=0, antenna=1
      0x20, // tagtype
      0x00,
      0x00,
      0x01,
      0x00, // tagid
      0x00, // checksum (ignored)
      0x00,
      0x00, // incentive addr (ignored)
      0x00, // status, no alarm
      256 - 55, // rssi = -55 dBm
      26,
      8,
      26,
      12,
      0,
      0, // time 2026-08-26 12:00:00
    ]);
    const header = Buffer.alloc(4);
    header.writeUInt16BE(0x8b01, 0);
    header.writeUInt16BE(value.length, 2);
    const payload = Buffer.concat([header, value]);

    const result = parseTlvPayload(payload, 'DEVICE0001');

    expect(result).toEqual({
      TAG: [
        {
          device: 'DEVICE0001',
          tagid: '00000100',
          tlvtype: '0x8B01',
          tagtype: '20',
          antenna: 1,
          intensity: -55,
          entry: 1,
          staying: 0,
          alarm: 0,
          time: '2026-08-26 12:00:00',
        },
      ],
    });
  });

  it('returns null when there are no recognizable TLV blocks', () => {
    expect(parseTlvPayload(Buffer.alloc(0), 'DEVICE0001')).toBeNull();
  });
});
