export interface ParsedPacket {
  cmd: number;
  seqno: number;
  protoVer: number;
  secFlag: number;
  deviceId: string;
  payload: Buffer;
}
