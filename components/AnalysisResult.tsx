import React from 'react';
import { AudioAnalysis } from '../types';
import { FileText, Mic, BarChart2, CheckCircle, Quote, MessageSquareQuote, Headphones } from 'lucide-react';

interface AnalysisResultProps {
  data: AudioAnalysis;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header / TLDR Card */}
      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Quote size={100} />
        </div>
        <div className="relative z-10">
          <h2 className="text-blue-400 text-sm font-bold tracking-wider uppercase mb-2">TL;DR</h2>
          <p className="text-xl md:text-2xl text-white font-medium leading-relaxed">
            "{data.tldr}"
          </p>
        </div>
      </div>

      {/* Audio Description */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <Headphones className="text-cyan-400" size={20} />
          <h3 className="text-lg font-semibold text-slate-100">Audio Description</h3>
        </div>
        <p className="text-slate-300 leading-7 whitespace-pre-wrap">
          {data.audioDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Main Summary - Spans 2 cols */}
        <div className="md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-emerald-400" size={20} />
            <h3 className="text-lg font-semibold text-slate-100">Full Summary</h3>
          </div>
          <p className="text-slate-300 leading-7 whitespace-pre-wrap">
            {data.summary}
          </p>
        </div>

        {/* Stats & Metadata - Spans 1 col */}
        <div className="space-y-6">
            
            {/* Sentiment */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="text-purple-400" size={20} />
                <h3 className="text-lg font-semibold text-slate-100">Sentiment</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-bold
                  ${data.sentiment === 'Positive' ? 'text-green-400' : ''}
                  ${data.sentiment === 'Negative' ? 'text-red-400' : ''}
                  ${data.sentiment === 'Neutral' ? 'text-blue-400' : ''}
                  ${data.sentiment === 'Mixed' ? 'text-yellow-400' : ''}
                `}>
                  {data.sentiment}
                </span>
              </div>
            </div>

            {/* Speaker Count */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Mic className="text-orange-400" size={20} />
                <h3 className="text-lg font-semibold text-slate-100">Speakers</h3>
              </div>
              <p className="text-slate-300 font-medium">{data.speakerCountEstimate}</p>
            </div>

            {/* Topics */}
             <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Key Topics</h3>
              <div className="flex flex-wrap gap-2">
                {data.topics.map((topic, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-700 text-slate-200 text-sm rounded-full border border-slate-600">
                    #{topic}
                  </span>
                ))}
              </div>
            </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Takeaways */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8">
          <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2">
              <CheckCircle className="text-blue-400" size={20} />
              Key Takeaways
          </h3>
          <ul className="space-y-4">
            {data.keyTakeaways.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="text-slate-300 text-sm leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Memorable Quotes */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8">
           <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2">
              <MessageSquareQuote className="text-amber-400" size={20} />
              Memorable Quotes
          </h3>
          <div className="space-y-4">
            {data.memorableQuotes && data.memorableQuotes.map((quote, idx) => (
               <figure key={idx} className="p-4 border-l-4 border-amber-500/50 bg-slate-900/30 rounded-r-xl">
                <blockquote className="text-slate-300 italic text-sm">
                  "{quote}"
                </blockquote>
              </figure>
            ))}
            {(!data.memorableQuotes || data.memorableQuotes.length === 0) && (
              <p className="text-slate-500 italic">No quotes extracted.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};