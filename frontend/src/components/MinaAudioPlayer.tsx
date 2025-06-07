import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

const MINA_TALKING_GIF_SRC = "/talking.gif";
const MINA_IDLE_PNG_SRC = "/mina_idle.png";

interface MinaAudioPlayerProps {
  audioSrc: string;
  text: string;
  onContinue?: (file?: File) => void;
  className?: string;
  showContinueButton?: boolean;
  buttonText?: string;
}

export default function MinaAudioPlayer({
  audioSrc,
  text,
  onContinue,
  className = '',
  showContinueButton = true,
  buttonText = '계속하기'
}: MinaAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isImageUpload, setIsImageUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsImageUpload(text.includes('사진을 업로드해주세요'));
  }, [text]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error("Audio play failed:", error);
          setIsPlaying(false);
        });
      }
    }
  }, [audioSrc]);

  const handlePlay = () => {
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error("Audio play failed:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleContinue = () => {
    if (isImageUpload && selectedFile) {
      onContinue?.(selectedFile);
    } else {
      onContinue?.();
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative w-64 h-64">
        <Image
          src={isPlaying ? MINA_TALKING_GIF_SRC : MINA_IDLE_PNG_SRC}
          alt="Mina"
          fill
          className="object-contain"
          priority
          unoptimized={isPlaying}
        />
      </div>
      <p className="text-xl text-center px-4 min-h-[6em] flex items-center justify-center whitespace-pre-line">{text}</p>
      <audio
        ref={audioRef}
        src={audioSrc}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        onError={(e) => {
          console.error("Error with audio element for src:", (e.target as HTMLAudioElement).src);
          setIsPlaying(false);
        }}
        preload="auto"
      />
      {isImageUpload && (
        <div className="w-full max-w-[200px]">
          <div 
            className="aspect-square border-2 border-dashed border-orange-300 rounded-lg p-2 text-center cursor-pointer hover:border-orange-500 transition-colors flex items-center justify-center bg-orange-50/50 hover:bg-orange-50"
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="Preview" 
                className="max-h-full max-w-full object-contain rounded-md"
              />
            ) : (
              <div className="text-orange-500 flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">클릭하여 사진 선택</p>
                <p className="text-xs mt-1">(JPG, PNG)</p>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png"
            className="hidden"
          />
        </div>
      )}
      {showContinueButton && (
        <button
          onClick={handleContinue}
          disabled={isImageUpload && !selectedFile}
          className={`w-full max-w-[200px] px-4 py-2 rounded-lg font-semibold text-white transition-colors shadow-md hover:shadow-lg ${
            isImageUpload && !selectedFile
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
          }`}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
} 