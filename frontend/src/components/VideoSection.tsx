import React, { useState, useRef, useEffect } from 'react';
import { commonStyles } from '@/styles/common';
import MinaDialogue from './MinaDialogue';
import { MinaScript } from '@/constants/minaScripts';

interface VideoSectionProps {
  videos: string[];
  introScript: MinaScript;
  outroScript: MinaScript;
  onComplete: () => void;
  colorScheme?: {
    bg: string;
    text: string;
    button: string;
    buttonHover: string;
  };
}

type Step = 'mina-intro' | 'video' | 'mina-outro';

export default function VideoSection({
  videos,
  introScript,
  outroScript,
  onComplete,
  colorScheme = commonStyles.colorSchemes.default
}: VideoSectionProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<Step>('mina-intro');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const playMinaAudio = async (text: string) => {
    if (!audioRef.current) return;
    setIsLoadingAudio(true);
    setCurrentText(text);
    try {
      const response = await fetch('/api/generate-elevenlabs-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          model_id: "eleven_multilingual_v2"
        }),
      });
      if (!response.ok) throw new Error('Failed to fetch audio');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
      
      // Set up the onended handler before playing
      audioRef.current.onended = () => {
        setIsLoadingAudio(false);
        // Don't clear the text here, let the continue button handle it
        URL.revokeObjectURL(url);
      };

      // Play the audio
      await audioRef.current.play();
    } catch (error) {
      console.error("Error playing Mina's audio:", error);
      setIsLoadingAudio(false);
      setCurrentText(null);
    }
  };

  const handleSkipAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      if(audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
      audioRef.current.src = '';
    }
    setIsLoadingAudio(false);
    setCurrentText(null);
    if (currentStep === 'mina-intro') {
      setCurrentStep('video');
    } else if (currentStep === 'mina-outro') {
      onComplete();
    }
  };

  const handleVideoEnd = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleNextCase = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentStep('mina-intro');
      setCurrentVideoIndex(prev => prev + 1);
    } else {
      setCurrentStep('mina-outro');
    }
  };

  const handleProceed = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setCurrentStep('mina-outro');
  };

  const handleContinueAfterIntro = () => {
    setCurrentText(null); // Clear the text when continuing
    setCurrentStep('video');
  };

  const handleContinueAfterOutro = () => {
    setCurrentText(null); // Clear the text when continuing
    onComplete();
  };

  useEffect(() => {
    if (currentStep === 'mina-intro') {
      playMinaAudio(introScript.text);
    }
  }, [currentStep, currentVideoIndex]);

  return (
    <div className="w-full">
      {currentStep !== 'video' && (
        <>
          <div className="relative">
            <img 
              src={isLoadingAudio ? "/talking.gif" : "/mina_idle.png"} 
              alt="Mina guiding" 
              className={commonStyles.minaImage} 
            />
            {isLoadingAudio && !currentText && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full animate-pulse">
                로딩중...
              </div>
            )}
          </div>
          <audio ref={audioRef} />

          <MinaDialogue 
            text={currentText}
            isLoadingAudio={isLoadingAudio}
            colorScheme={colorScheme}
          />

          {!isLoadingAudio && currentText && (
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={currentStep === 'mina-intro' ? handleContinueAfterIntro : handleContinueAfterOutro}
                className={commonStyles.primaryButton}
              >
                계속하기
              </button>
              <button
                onClick={handleSkipAudio}
                className={commonStyles.secondaryButton}
              >
                넘어가기
              </button>
            </div>
          )}
        </>
      )}

      {currentStep === 'video' && (
        <>
          <div className={commonStyles.videoContainer}>
            <video 
              ref={videoRef} 
              src={videos[currentVideoIndex]} 
              controls 
              className={commonStyles.video}
              onEnded={handleVideoEnd}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {videos.length > 1 && (
            <div className="flex space-x-4 mb-6">
              {videos.map((_, index) => (
                <div
                  key={index}
                  className={`${commonStyles.progressDot} ${
                    currentVideoIndex === index 
                      ? commonStyles.progressDotActive 
                      : commonStyles.progressDotInactive
                  }`}
                />
              ))}
            </div>
          )}

          <div className="flex space-x-4">
            {currentVideoIndex < videos.length - 1 ? (
              <button 
                onClick={handleNextCase}
                className={commonStyles.primaryButton}
              >
                다음 사례
              </button>
            ) : (
              <button 
                onClick={handleProceed}
                className={commonStyles.primaryButton}
              >
                다음으로
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
} 