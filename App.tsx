import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { JobCard } from './components/JobCard';
import { analyzeAudio } from './services/gemini';
import { AnalysisJob, AnalysisStatus } from './types';
import { Sparkles, Plus } from 'lucide-react';

let nextJobId = 0;

const App: React.FC = () => {
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [showUpload, setShowUpload] = useState(true);

  const updateJob = useCallback((id: string, updates: Partial<AnalysisJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  }, []);

  const runAnalysis = useCallback(async (job: AnalysisJob) => {
    try {
      const result = await analyzeAudio(job.file);

      // Save to local output folder
      let savedPath: string | null = null;
      try {
        const res = await fetch('/api/save-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis: result, fileName: job.file.name }),
        });
        const data = await res.json();
        savedPath = data.path;
      } catch (saveErr) {
        console.error('Failed to save analysis to disk:', saveErr);
      }

      updateJob(job.id, {
        status: AnalysisStatus.COMPLETED,
        analysis: result,
        savedPath,
      });
    } catch (err: any) {
      console.error(`Analysis failed for ${job.file.name}:`, err);
      updateJob(job.id, {
        status: AnalysisStatus.ERROR,
        errorMsg: err.message || 'An unexpected error occurred during analysis.',
      });
    }
  }, [updateJob]);

  const handleFileSelected = useCallback((file: File) => {
    const id = `job-${++nextJobId}`;
    const job: AnalysisJob = {
      id,
      file,
      status: AnalysisStatus.PROCESSING,
      analysis: null,
      errorMsg: null,
      savedPath: null,
    };

    setJobs(prev => [job, ...prev]);
    setShowUpload(false);

    // Fire and forget — runs concurrently
    runAnalysis(job);
  }, [runAnalysis]);

  const handleRetry = useCallback((id: string) => {
    let retryJob: AnalysisJob | undefined;

    setJobs(prev => {
      const job = prev.find(j => j.id === id);
      if (!job) return prev;
      const updated = { ...job, status: AnalysisStatus.PROCESSING, errorMsg: null, analysis: null, savedPath: null };
      retryJob = updated;
      return prev.map(j => j.id === id ? updated : j);
    });

    // Run outside the setter — retryJob is assigned synchronously by setJobs
    setTimeout(() => { if (retryJob) runAnalysis(retryJob); }, 0);
  }, [runAnalysis]);

  const handleRemove = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const processingCount = jobs.filter(j => j.status === AnalysisStatus.PROCESSING).length;
  const completedCount = jobs.filter(j => j.status === AnalysisStatus.COMPLETED).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 pb-20">

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">

        {/* Header */}
        <header className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 shadow-xl mb-4">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Powered by Gemini 3</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent pb-2">
            AudioInsight
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Upload audio files for instant semantic analysis, TL;DR summaries, and sentiment extraction.
          </p>
        </header>

        <main className="w-full max-w-4xl mx-auto space-y-6">

          {/* Upload area */}
          {showUpload ? (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <FileUpload onFileSelected={handleFileSelected} />
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus size={18} />
                Add Audio File
              </button>
            </div>
          )}

          {/* Status summary */}
          {jobs.length > 0 && (
            <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
              {processingCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  {processingCount} analyzing
                </span>
              )}
              {completedCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                  {completedCount} complete
                </span>
              )}
              <span className="text-slate-600">{jobs.length} total</span>
            </div>
          )}

          {/* Job list */}
          <div className="space-y-3">
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onRetry={handleRetry}
                onRemove={handleRemove}
              />
            ))}
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;
