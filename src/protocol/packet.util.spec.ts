import { buildPacket, parsePacket } from './packet.util';
import { PacketFramingError } from './packet-framing.error';

describe('packet.util', () => {
  it('round-trips a packet through buildPacket -> parsePacket', () => {
    const serviceContent = Buffer.from([1, 2, 3, 4]);
    const packet = buildPacket(0x0001, 42, 'DEVICE0001', serviceContent);

    const parsed = parsePacket(packet);

    expect(parsed.cmd).toBe(0x0001);
    expect(parsed.seqno).toBe(42);
    expect(parsed.deviceId).toBe('DEVICE0001');
    expect(parsed.payload).toEqual(serviceContent);
  });

  it('throws a PacketFramingError with code -102 on CRC mismatch', () => {
    const packet = buildPacket(0x0003, 1, 'DEV', Buffer.alloc(6));
    packet[packet.length - 1] ^= 0xff; // corrupt the last CRC byte

    expect(() => parsePacket(packet)).toThrow(PacketFramingError);
    try {
      parsePacket(packet);
      fail('expected parsePacket to throw');
    } catch (err) {
      expect((err as PacketFramingError).code).toBe(-102);
    }
  });

  it('rejects a packet with an invalid start flag', () => {
    const packet = buildPacket(0x0003, 1, 'DEV', Buffer.alloc(6));
    packet[0] = 0x00;

    expect(() => parsePacket(packet)).toThrow(/Invalid start flag/);
  });
});
