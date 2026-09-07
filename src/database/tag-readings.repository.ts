import { Injectable } from '@nestjs/common';
import Database from 'better-sqlite3';
import { DatabaseService } from './database.service';
import {
  DbStats,
  DbTagFilters,
  DbTagQueryResult,
  TagReadingInput,
  TagReadingRow,
} from './interfaces/tag-reading.interface';

@Injectable()
export class TagReadingsRepository {
  private readonly db: Database.Database;
  private readonly stmtInsert: Database.Statement;
  private readonly stmtPending: Database.Statement;
  private readonly stmtMarkConsumed: Database.Statement;
  private readonly stmtClearConsumed: Database.Statement;
  private readonly stmtStats: Database.Statement;

  constructor(private readonly database: DatabaseService) {
    this.db = this.database.db;

    this.stmtInsert = this.db.prepare(`
      INSERT INTO tag_readings
        (device, tagid, tlvtype, tagtype, antenna, intensity, entry, staying, alarm, time)
      VALUES
        (@device, @tagid, @tlvtype, @tagtype, @antenna, @intensity, @entry, @staying, @alarm, @time)
    `);

    this.stmtPending = this.db.prepare(`
      SELECT * FROM tag_readings WHERE consumed = 0 ORDER BY id ASC LIMIT ?
    `);

    this.stmtMarkConsumed = this.db.prepare(`
      UPDATE tag_readings SET consumed = 1 WHERE id = ?
    `);

    this.stmtClearConsumed = this.db.prepare(`
      DELETE FROM tag_readings WHERE consumed = 1
    `);

    this.stmtStats = this.db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN consumed = 0 THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN consumed = 1 THEN 1 ELSE 0 END) AS consumed
      FROM tag_readings
    `);
  }

  insertTag(tag: TagReadingInput): void {
    this.stmtInsert.run({
      device: tag.device || '',
      tagid: tag.tagid || '',
      tlvtype: tag.tlvtype || '',
      tagtype: tag.tagtype || '',
      antenna: Number.isFinite(tag.antenna) ? tag.antenna : 0,
      intensity: Number.isFinite(tag.intensity) ? tag.intensity : 0,
      entry: Number.isFinite(tag.entry) ? tag.entry : 0,
      staying: Number.isFinite(tag.staying) ? tag.staying : 0,
      alarm: Number.isFinite(tag.alarm) ? tag.alarm : 0,
      time: tag.time || '',
    });
  }

  getPendingTags(limit: number): TagReadingRow[] {
    return this.stmtPending.all(
      Math.max(1, Math.min(10000, Number(limit) || 1000)),
    ) as TagReadingRow[];
  }

  markConsumed(ids: number[]): void {
    const markMany = this.db.transaction((list: number[]) => {
      for (const id of list) {
        this.stmtMarkConsumed.run(id);
      }
    });
    markMany(ids);
  }

  clearConsumed(): number {
    const result = this.stmtClearConsumed.run();
    return result.changes;
  }

  queryDbTags(filters: DbTagFilters): DbTagQueryResult {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.tagid) {
      conditions.push('tagid LIKE ?');
      params.push(`%${filters.tagid}%`);
    }
    if (filters.device) {
      conditions.push('device LIKE ?');
      params.push(`%${filters.device}%`);
    }
    if (filters.tlvtype) {
      conditions.push('tlvtype = ?');
      params.push(String(filters.tlvtype));
    }
    if (
      filters.entry !== undefined &&
      filters.entry !== null &&
      filters.entry !== ('' as unknown)
    ) {
      conditions.push('entry = ?');
      params.push(Number(filters.entry));
    }
    if (
      filters.staying !== undefined &&
      filters.staying !== null &&
      filters.staying !== ('' as unknown)
    ) {
      conditions.push('staying = ?');
      params.push(Number(filters.staying));
    }
    if (
      filters.consumed !== undefined &&
      filters.consumed !== null &&
      filters.consumed !== ('' as unknown)
    ) {
      conditions.push('consumed = ?');
      params.push(Number(filters.consumed));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = Math.max(0, Number(filters.offset) || 0);
    const limit = Math.max(1, Math.min(1000, Number(filters.limit) || 100));

    const { total } = this.db
      .prepare(`SELECT COUNT(*) AS total FROM tag_readings ${where}`)
      .get(...params) as { total: number };
    const data = this.db
      .prepare(`SELECT * FROM tag_readings ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as TagReadingRow[];

    return { total, offset, limit, data };
  }

  getDbStats(): DbStats {
    return this.stmtStats.get() as DbStats;
  }

  vacuum(): void {
    this.db.exec('VACUUM');
  }
}
