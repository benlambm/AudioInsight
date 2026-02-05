export interface AudioAnalysis {
  audioDescription: string;
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

export interface AnalysisJob {
  id: string;
  file: File;
  status: AnalysisStatus;
  analysis: AudioAnalysis | null;
  errorMsg: string | null;
  savedPath: string | null;
}