import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  httpPort: number;
  host: string;
  publicIp: string;
  forwardTagUrl: string;
  httpTimeoutMs: number;
  logLevel: string;
  dbPath: string;
  dbMaxRows: number;
}

function toInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default registerAs('app', (): AppConfig => ({
  port: toInt(process.env.PORT, 4600),
  httpPort: toInt(process.env.HTTP_PORT, 8080),
  host: process.env.HOST || '0.0.0.0',
  publicIp: process.env.PUBLIC_IP || '',
  forwardTagUrl: process.env.FORWARD_TAG_URL || 'http://localhost/guarda_tag.php',
  httpTimeoutMs: toInt(process.env.TAG_HTTP_TIMEOUT_MS, 5000),
  logLevel: process.env.LOG_LEVEL || 'info',
  dbPath: process.env.DB_PATH || '',
  dbMaxRows: toInt(process.env.DB_MAX_ROWS, 100000),
}));
