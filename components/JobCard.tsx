import React, { useState } from 'react';
import { AnalysisJob, AnalysisStatus } from '../types';
import { AnalysisResult } from './AnalysisResult';
import { AudioPlayer } from './AudioPlayer';
import { Activity, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, FolderOpen, FileAudio, RotateCcw, X } from 'lucide-react';

interface JobCardProps {
  job: AnalysisJob;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onRetry, onRemove }) => {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    [AnalysisStatus.PROCESSING]: {
      icon: <Activity size={16} className="text-blue-400 animate-spin" />,
      label: 'Analyzing...',
      badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    [AnalysisStatus.COMPLETED]: {
      icon: <CheckCircle2 size={16} className="text-emerald-400" />,
      label: 'Complete',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    [AnalysisStatus.ERROR]: {
      icon: <AlertCircle size={16} className="text-red-400" />,
      label: 'Failed',
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    [AnalysisStatus.IDLE]: {
      icon: null,
      label: 'Idle',
      badgeClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    },
  };

  const config = statusConfig[job.status];

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* Header — always visible */}
      <div
        className={`flex items-center gap-3 px-5 py-4 ${job.status === AnalysisStatus.COMPLETED ? 'cursor-pointer hover:bg-slate-800/40' : ''} transition-colors`}
        onClick={() => job.status === AnalysisStatus.COMPLETED && setExpanded(!expanded)}
      >
        <FileAudio size={18} className="text-slate-400 flex-shrink-0" />
        <span className="text-sm font-medium text-slate-200 truncate flex-1">{job.file.name}</span>
        <span className="text-xs text-slate-500 flex-shrink-0">
          {(job.file.size / (1024 * 1024)).toFixed(1)} MB
        </span>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.badgeClass}`}>
          {config.icon}
          {config.label}
        </span>

        {/* Expand/collapse for completed */}
        {job.status === AnalysisStatus.COMPLETED && (
          <button className="text-slate-400 hover:text-white transition-colors p-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}

        {/* Remove button for completed/error */}
        {job.status !== AnalysisStatus.PROCESSING && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(job.id); }}
            className="text-slate-500 hover:text-red-400 transition-colors p-1"
            title="Remove"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Processing bar */}
      {job.status === AnalysisStatus.PROCESSING && (
        <div className="h-0.5 bg-slate-800">
          <div className="h-full bg-blue-500 animate-pulse rounded-full" style={{ width: '100%' }} />
        </div>
      )}

      {/* Error body */}
      {job.status === AnalysisStatus.ERROR && (
        <div className="px-5 pb-4 pt-1">
          <p className="text-sm text-red-300/80 mb-3">{job.errorMsg}</p>
          <button
            onClick={() => onRetry(job.id)}
            className="inline-flex items-center gap-1.5 text-sm text-white hover:text-blue-300 transition-colors"
          >
            <RotateCcw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Completed body — collapsible */}
      {job.status === AnalysisStatus.COMPLETED && expanded && (
        <div className="border-t border-slate-700/50">
          {/* Saved path + player */}
          <div className="px-5 py-4 space-y-3">
            {job.savedPath && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FolderOpen size={12} className="text-emerald-400" />
                <code className="text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">{job.savedPath}</code>
              </div>
            )}
            <AudioPlayer file={job.file} />
          </div>

          {/* TL;DR preview */}
          {job.analysis && (
            <div className="px-5 pb-4 text-sm text-slate-400 italic">
              "{job.analysis.tldr}"
            </div>
          )}

          {/* Full results */}
          {job.analysis && (
            <div className="px-5 pb-6">
              <AnalysisResult data={job.analysis} />
            </div>
          )}
        </div>
      )}

      {/* Completed but collapsed — show TL;DR preview */}
      {job.status === AnalysisStatus.COMPLETED && !expanded && job.analysis && (
        <div
          className="px-5 pb-4 pt-0 text-sm text-slate-500 italic truncate cursor-pointer hover:text-slate-400 transition-colors"
          onClick={() => setExpanded(true)}
        >
          "{job.analysis.tldr}"
        </div>
      )}
    </div>
  );
};
