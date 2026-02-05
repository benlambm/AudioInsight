import React, { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  file: File | null;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ file }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setObjectUrl(null);
      };
    }
  }, [file]);

  if (!file || !objectUrl) return null;

  return (
    <div className="w-full max-w-xl mx-auto mb-8 bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col items-center gap-2 backdrop-blur-md">
       <span className="text-xs text-slate-400 font-mono w-full text-left truncate px-2">
        {file.name}
       </span>
      <audio 
        ref={audioRef} 
        controls 
        src={objectUrl} 
        className="w-full h-10 [&::-webkit-media-controls-panel]:bg-slate-700 [&::-webkit-media-controls-current-time-display]:text-slate-200 [&::-webkit-media-controls-time-remaining-display]:text-slate-200"
      />
    </div>
  );
};
