'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/layouts/PageLayout';
import { commonStyles } from '@/styles/common';
import { part3Scripts, TALKING_GIF_SRC, MINA_IDLE_PNG_SRC } from '@/constants/part3Content';
import Image from 'next/image';

export default function Part3Page() {
  const router = useRouter();
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);

  const currentScriptData = part3Scripts[currentScriptIndex];

  // Effect to play audio when script changes or when showing thank you (no audio for thank you)
  useEffect(() => {
    if (showThankYouMessage) {
      setIsAudioPlaying(true); // To show talking.gif for "감사합니다"
      if (audioRef.current) audioRef.current.pause(); // Ensure no other audio plays
      return; 
    }
    if (audioRef.current && currentScriptData?.audioSrc) {
      audioRef.current.src = currentScriptData.audioSrc;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(_ => {
          setIsAudioPlaying(true);
          setError(null);
        }).catch(playError => {
          console.error("Audio play failed in Part 3:", playError);
          setIsAudioPlaying(false);
        });
      }
    } else {
      setIsAudioPlaying(false); 
    }
  }, [currentScriptIndex, currentScriptData, showThankYouMessage, router]);

  const handleNextScript = () => {
    setError(null);
    
    if (showThankYouMessage) {
      router.push('/completion');
      return;
    }

    setIsAudioPlaying(false); 
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; 
    }

    if (currentScriptIndex < part3Scripts.length - 1) {
      setCurrentScriptIndex(prevIndex => prevIndex + 1);
    } else {
      // Last script, show thank you message
      setShowThankYouMessage(true);
      // isAudioPlaying will be set to true by useEffect for talking.gif
    }
  };

  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
    // If it was the last script's audio that ended, show thank you message
    if (currentScriptIndex === part3Scripts.length - 1 && !showThankYouMessage) {
      setShowThankYouMessage(true);
    }
  };

  // Determine image source
  let imageToDisplay = MINA_IDLE_PNG_SRC;
  if (showThankYouMessage) {
    imageToDisplay = TALKING_GIF_SRC; // Mina talking for "감사합니다"
  } else if (isAudioPlaying) {
    imageToDisplay = TALKING_GIF_SRC;
  }

  if (!showThankYouMessage && !currentScriptData) {
    return <PageLayout><p className="text-center text-red-500">Error: Script data not found for Part 3.</p></PageLayout>;
  }

  return (
    <PageLayout>
      <div className="animate-fade-in w-full max-w-2xl mx-auto space-y-6 flex flex-col items-center text-center">
        <h1 className={commonStyles.heading}>Part 3: 스스로를 지키는 대응방안</h1>
        
        <div className="my-6 w-60 h-60 sm:w-72 sm:h-72 relative overflow-hidden rounded-lg shadow-lg bg-gray-100">
          <Image 
            key={imageToDisplay} 
            src={imageToDisplay} 
            alt={isAudioPlaying || showThankYouMessage ? "Mina talking" : "Mina idle"} 
            layout="fill" 
            objectFit="contain" 
            unoptimized={imageToDisplay.endsWith('.gif')} 
            priority 
          />
        </div>

        <div className="bg-orange-50 p-6 rounded-lg shadow-md min-h-[150px] w-full flex items-center justify-center">
          <p className="text-gray-800 text-lg sm:text-xl leading-relaxed whitespace-pre-line">
            {showThankYouMessage ? "감사합니다!" : currentScriptData.text}
          </p>
        </div>

        {error && (
          <div className="my-2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg w-full text-sm">
            <p className="font-semibold">알림:</p> {error}
          </div>
        )}

        {!showThankYouMessage && (
          <audio 
            ref={audioRef} 
            className="hidden" 
            onPlay={() => setIsAudioPlaying(true)}
            onEnded={handleAudioEnded} // Use new handler
            onError={(e) => {
              console.error("Audio element error in Part 3:", e);
              setIsAudioPlaying(false);
              // Check currentScriptData exists before accessing audioSrc
              const audioSrc = currentScriptData?.audioSrc || '알 수 없는 오디오 파일';
              setError("오디오 파일을 불러오거나 재생할 수 없습니다. 파일 경로를 확인해주세요: " + audioSrc);
            }}
            controls 
          />
        )}

        {!showThankYouMessage && (
          <button
            onClick={handleNextScript}
            className={`${commonStyles.primaryButton} w-full md:w-auto px-10 py-3 text-lg mt-4`}
          >
            {currentScriptIndex < part3Scripts.length - 1 ? '계속하기' : '모든 내용 확인 완료'}
          </button>
        )}

         {!showThankYouMessage && (
            <div className="mt-2 text-sm text-gray-600">
                {currentScriptIndex + 1} / {part3Scripts.length}
            </div>
         )}
      </div>
       <style jsx global>{`
        .animate-fade-in { animation: fadeIn 0.7s ease-out; }
        @keyframes fadeIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
    </PageLayout>
  );
} 