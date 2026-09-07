import * as path from 'path';
import Database from 'better-sqlite3';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import configuration from '../config/configuration';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly connection: Database.Database;

  constructor(@Inject(configuration.KEY) config: ConfigType<typeof configuration>) {
    // Resolved against process.cwd() (the app always starts from the project root),
    // not __dirname — after compiling to dist/ that would point one level off.
    const dbPath = config.dbPath
      ? path.resolve(process.cwd(), config.dbPath)
      : path.resolve(process.cwd(), 'data', 'tags.db');

    this.connection = new Database(dbPath);

    this.connection.pragma('journal_mode = WAL');
    this.connection.pragma('synchronous = NORMAL');
    this.connection.pragma('foreign_keys = ON');

    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS tag_readings (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        device     TEXT    NOT NULL,
        tagid      TEXT    NOT NULL,
        tlvtype    TEXT    NOT NULL,
        tagtype    TEXT    NOT NULL,
        antenna    INTEGER NOT NULL,
        intensity  INTEGER NOT NULL,
        entry      INTEGER NOT NULL,
        staying    INTEGER NOT NULL,
        alarm      INTEGER NOT NULL,
        time       TEXT    NOT NULL,
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        consumed   INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_consumed ON tag_readings(consumed);
      CREATE INDEX IF NOT EXISTS idx_device   ON tag_readings(device);
    `);
  }

  get db(): Database.Database {
    return this.connection;
  }

  onModuleDestroy(): void {
    this.connection.close();
  }
}
