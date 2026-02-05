import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisResult } from './components/AnalysisResult';
import { AudioPlayer } from './components/AudioPlayer';
import { analyzeAudio } from './services/gemini';
import { AudioAnalysis, AnalysisStatus } from './types';
import { Sparkles, Activity, RefreshCw, Download } from 'lucide-react';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const saveAnalysisLog = (data: AudioAnalysis, fileName: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logName = `analysis_log_${timestamp}_${fileName.split('.')[0]}.json`;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = logName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus(AnalysisStatus.PROCESSING);
    setErrorMsg(null);
    setAnalysis(null);

    try {
      const result = await analyzeAudio(selectedFile);
      setAnalysis(result);
      setStatus(AnalysisStatus.COMPLETED);
      
      // Auto-save the log
      saveAnalysisLog(result, selectedFile.name);
      
    } catch (err: any) {
      console.error(err);
      setStatus(AnalysisStatus.ERROR);
      setErrorMsg(err.message || "An unexpected error occurred during analysis.");
    }
  };

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setStatus(AnalysisStatus.IDLE);
    setErrorMsg(null);
  };

  const handleManualDownload = () => {
    if (analysis && file) {
      saveAnalysisLog(analysis, file.name);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 pb-20">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        
        {/* Header */}
        <header className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 shadow-xl mb-4">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Powered by Gemini 3</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent pb-2">
            AudioInsight
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Upload any audio file for instant semantic analysis, TL;DR summaries, and sentiment extraction.
          </p>
        </header>

        {/* Main Interaction Area */}
        <main className="w-full transition-all duration-500">
          
          {/* Upload Stage */}
          {status === AnalysisStatus.IDLE && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <FileUpload onFileSelected={handleFileSelected} />
            </div>
          )}

          {/* Processing Stage */}
          {status === AnalysisStatus.PROCESSING && (
             <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                  <Activity className="text-blue-400 w-16 h-16 animate-bounce relative z-10" />
                </div>
                <h3 className="mt-8 text-2xl font-semibold text-white">Analyzing Audio...</h3>
                <p className="mt-2 text-slate-400 text-center max-w-md">
                  Gemini is listening to your file and extracting key insights. <br/>
                  <span className="text-slate-500 text-sm">Large files (100MB+) may take a minute to upload.</span>
                </p>
             </div>
          )}

          {/* Result Stage */}
          {(status === AnalysisStatus.COMPLETED || status === AnalysisStatus.ERROR) && (
            <div className="space-y-8">
              
              {/* Controls */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                 {file && <AudioPlayer file={file} />}
                 
                 <div className="flex gap-3">
                   {status === AnalysisStatus.COMPLETED && (
                      <button 
                        onClick={handleManualDownload}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all shadow-lg shadow-blue-500/20"
                      >
                        <Download size={16} />
                        Save JSON Log
                      </button>
                   )}
                   
                   <button 
                    onClick={reset}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full font-medium transition-all border border-slate-700 hover:border-slate-600"
                   >
                     <RefreshCw size={16} />
                     Analyze Another
                   </button>
                 </div>
              </div>

              {/* Error Display */}
              {status === AnalysisStatus.ERROR && (
                <div className="max-w-2xl mx-auto p-6 bg-red-950/30 border border-red-500/20 rounded-2xl text-center">
                  <h3 className="text-red-400 font-semibold text-lg mb-2">Analysis Failed</h3>
                  <p className="text-red-300/80 mb-4">{errorMsg}</p>
                  <button onClick={reset} className="text-white underline underline-offset-4 hover:text-red-200">Try again</button>
                </div>
              )}

              {/* Success Display */}
              {status === AnalysisStatus.COMPLETED && analysis && (
                <AnalysisResult data={analysis} />
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;