import { ParsedTag } from '../../protocol/interfaces/parsed-tag.interface';

export interface StoredTag extends ParsedTag {
  index: number;
}

export interface TagWithKey extends StoredTag {
  key: string;
}

export interface TagListResult {
  total: number;
  offset: number;
  limit: number;
  data: TagWithKey[];
}
