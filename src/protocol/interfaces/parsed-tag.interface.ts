export interface ParsedTag {
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
}

export interface ParsedDataUpload {
  TAG: ParsedTag[];
}
