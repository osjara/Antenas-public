import { Injectable, Logger } from '@nestjs/common';
import { ParsedTag } from '../protocol/interfaces/parsed-tag.interface';
import { StoredTag, TagListResult, TagWithKey } from './interfaces/stored-tag.interface';
import { TagFilterDto } from './dto/tag-filter.dto';
import { toInt } from '../common/utils/to-int.util';

const MAX_TAGS = 5000;

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);
  private readonly tagsById = new Map<string, StoredTag>();
  private nextIndex = 0;

  private hexToDecimal(tagId: string | undefined): string | null {
    if (!tagId || typeof tagId !== 'string') {
      return null;
    }
    const clean = tagId.replace(/^0x/i, '');
    if (!/^[0-9a-fA-F]+$/.test(clean)) {
      return null;
    }
    return BigInt(`0x${clean}`).toString();
  }

  upsert(tag: ParsedTag): number | null {
    const tagIdKey = this.hexToDecimal(tag.tagid);
    if (!tagIdKey) {
      return null;
    }

    const existing = this.tagsById.get(tagIdKey);
    const index = existing ? existing.index : this.nextIndex++;
    this.tagsById.set(tagIdKey, { index, ...tag });
    return index;
  }

  enforceCapacity(): void {
    if (this.tagsById.size > MAX_TAGS) {
      this.tagsById.clear();
      this.nextIndex = 0;
    }
  }

  getAll(): TagWithKey[] {
    return Array.from(this.tagsById.entries()).map(([key, value]) => ({ key, ...value }));
  }

  count(): number {
    return this.tagsById.size;
  }

  findOne(id: string): TagWithKey | undefined {
    return this.getAll().find(
      (item) =>
        String(item.key) === id || String(item.tagid || '').toLowerCase() === id.toLowerCase(),
    );
  }

  findAll(filters: TagFilterDto): TagListResult {
    let out = this.getAll();

    if (filters.tagid) {
      const needle = String(filters.tagid).toLowerCase();
      out = out.filter((item) =>
        String(item.tagid || '')
          .toLowerCase()
          .includes(needle),
      );
    }
    if (filters.device) {
      const needle = String(filters.device).toLowerCase();
      out = out.filter((item) =>
        String(item.device || '')
          .toLowerCase()
          .includes(needle),
      );
    }
    if (filters.tlvtype) {
      const needle = String(filters.tlvtype).toLowerCase();
      out = out.filter((item) => String(item.tlvtype || '').toLowerCase() === needle);
    }
    if (filters.entry !== undefined && filters.entry !== null) {
      const entry = Number(filters.entry);
      out = out.filter((item) => Number(item.entry) === entry);
    }
    if (filters.staying !== undefined && filters.staying !== null) {
      const staying = Number(filters.staying);
      out = out.filter((item) => Number(item.staying) === staying);
    }

    const offset = Math.max(0, toInt(filters.offset, 0));
    const limit = Math.max(1, Math.min(1000, toInt(filters.limit, 100)));
    const total = out.length;

    const data = out
      .sort((a, b) => Number(b.index) - Number(a.index))
      .slice(offset, offset + limit);

    return { total, offset, limit, data };
  }

  clear(): number {
    const cleared = this.tagsById.size;
    this.tagsById.clear();
    this.nextIndex = 0;
    this.logger.log(`[API] tag memory cleared cleared=${cleared}`);
    return cleared;
  }
}
