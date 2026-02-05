export interface AudioAnalysis {
  tldr: string;
  summary: string;
  topics: string[];
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
  speakerCountEstimate: string;
  keyTakeaways: string[];
  memorableQuotes: string[];
  durationString?: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}