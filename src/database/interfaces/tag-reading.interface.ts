export interface TagReadingInput {
  device?: string;
  tagid?: string;
  tlvtype?: string;
  tagtype?: string;
  antenna?: number;
  intensity?: number;
  entry?: number;
  staying?: number;
  alarm?: number;
  time?: string;
}

export interface TagReadingRow {
  id: number;
  device: string;
  tagid: string;
  tlvtype: string;
  tagtype: string;
  antenna: number;
  intensity: number;
  entry: number;
  staying: number;
  alarm: number;
  time: string;
  created_at: string;
  consumed: number;
}

export interface DbTagFilters {
  tagid?: string;
  device?: string;
  tlvtype?: string;
  entry?: number | string;
  staying?: number | string;
  consumed?: number | string;
  limit?: number | string;
  offset?: number | string;
}

export interface DbTagQueryResult {
  total: number;
  offset: number;
  limit: number;
  data: TagReadingRow[];
}

export interface DbStats {
  total: number;
  pending: number;
  consumed: number;
}
