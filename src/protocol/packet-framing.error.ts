export class PacketFramingError extends Error {
  code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = 'PacketFramingError';
    this.code = code;
  }
}
