// CRC16-CCITT (poly=0x1021, init=0xFFFF) — spec section 10.1
export function crc16(buf: Buffer): number {
  let crc = 0xffff;
  for (let i = 0; i < buf.length; i++) {
    let val = (buf[i] << 8) & 0xffff;
    for (let j = 0; j < 8; j++) {
      if ((crc ^ val) & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
      val = (val << 1) & 0xffff;
    }
  }
  return crc;
}
