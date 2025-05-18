'use client'
import { useState, useRef, useEffect } from 'react'

interface DeepfakeExperiencePlayerProps {
  videoUrl: string | null;
  introAudioUrl?: string | null;
  isLoading: boolean; // isLoading from parent (true if step 4 is processing)
  error: string | null; // error from parent (if step 4 failed)
  pollingMessage?: string | null; // Pass this from parent if needed for display
  onNext: () => void;
}

export default function DeepfakeExperiencePlayer({
  videoUrl,
  introAudioUrl,
  isLoading: parentIsLoading,
  error: parentError,
  pollingMessage, // Added prop
  onNext
}: DeepfakeExperiencePlayerProps) {
  const introAudioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Stages: 'idle', 'loading_intro', 'playing_intro', 'loading_video', 'playing_video', 'error'
  const [currentStage, setCurrentStage] = useState<'idle' | 'loading_intro' | 'playing_intro' | 'loading_video' | 'playing_video' | 'error'>('idle');
  const [internalError, setInternalError] = useState<string | null>(null);

  useEffect(() => {
    setInternalError(parentError);
    if (parentError) {
        setCurrentStage('error');
    }
  }, [parentError]);

  // Determine initial stage based on props when not already in a playing/error state
  useEffect(() => {
    if (parentIsLoading && currentStage !== 'error' && currentStage !== 'playing_intro' && currentStage !== 'playing_video') {
      setCurrentStage(introAudioUrl ? 'loading_intro' : 'loading_video');
      return;
    }
    if (parentError && currentStage !== 'error') {
        setCurrentStage('error');
        return;
    }

    if (!parentIsLoading && !parentError && currentStage !== 'playing_intro' && currentStage !== 'playing_video' && currentStage !== 'error') {
        if (introAudioUrl && !videoUrl) { 
            setCurrentStage('loading_intro');
        } else if (videoUrl) { 
            setCurrentStage(introAudioUrl ? 'loading_intro' : 'loading_video');
        } else if (introAudioUrl) { 
            setCurrentStage('loading_intro');
        } else {
            setCurrentStage('idle');
        }
    }

  }, [introAudioUrl, videoUrl, parentIsLoading, parentError, currentStage]);

  // Effect to handle actual playback based on stage
  useEffect(() => {
    const introElement = introAudioRef.current;
    const videoElement = videoRef.current;

    if (currentStage === 'loading_intro' && introElement && introAudioUrl) {
      console.log("DFEP: Loading intro audio:", introAudioUrl);
      introElement.src = introAudioUrl;
      introElement.load();
      introElement.play()
        .then(() => setCurrentStage('playing_intro'))
        .catch(err => {
          console.error("DFEP: Intro audio play error:", err);
          setInternalError("소개 음성 재생 실패: " + err.message);
          setCurrentStage('error');
        });
    } else if (currentStage === 'loading_video' && videoElement && videoUrl) {
      console.log("DFEP: Loading main video:", videoUrl);
      videoElement.src = videoUrl;
      videoElement.load();
      videoElement.play()
        .then(() => setCurrentStage('playing_video'))
        .catch(err => {
          console.error("DFEP: Main video play error:", err);
          setInternalError("딥페이크 영상 재생 실패: " + err.message);
          setCurrentStage('error');
        });
    }
    // Cleanup function to pause and reset src when component unmounts or videoUrl/introAudioUrl changes
    return () => {
        if (introElement) {
            introElement.pause();
            if (introAudioUrl) introElement.src = ''; // Reset src to ensure it stops loading/playing
        }
        if (videoElement) {
            videoElement.pause();
            if (videoUrl) videoElement.src = ''; // Reset src
        }
    };
  }, [currentStage, introAudioUrl, videoUrl]);

  const handleIntroAudioEnded = () => {
    console.log("DFEP: Intro audio ended.");
    if (videoUrl) {
      setCurrentStage('loading_video');
    } else if (parentIsLoading) {
      setCurrentStage('loading_video'); 
      setInternalError(null);
    } else {
      // If intro ends and no videoUrl, and not parentIsLoading, it implies video is missing or failed to load prior.
      // The main useEffect for props handling should ideally set to error or idle.
      // However, if onNext is the only way forward, this might be an issue.
      // For now, if no video, consider it an issue or rely on onNext button if appropriate.
      setInternalError("소개 음성 후 재생할 딥페이크 영상이 없습니다.");
      setCurrentStage('error'); // Or, allow onNext if that makes sense.
    }
  };

  const handleVideoEnded = () => {
    console.log("DFEP: Main video ended.");
    // onNext(); // Typically, a button press handles onNext for user control
  };
  
  const handleMediaError = (e: React.SyntheticEvent<HTMLAudioElement | HTMLVideoElement, Event>, type: string) => {
    const mediaElement = e.currentTarget;
    let errorMsg = `알 수 없는 ${type} 오류입니다.`;
    if (mediaElement.error) {
        // See: https://developer.mozilla.org/en-US/docs/Web/API/MediaError/code
        switch (mediaElement.error.code) {
            case 1: /* MEDIA_ERR_ABORTED */ errorMsg = `${type} 로딩이 중단되었습니다.`; break;
            case 2: /* MEDIA_ERR_NETWORK */ errorMsg = `네트워크 오류로 ${type} 재생에 실패했습니다.`; break;
            case 3: /* MEDIA_ERR_DECODE */ errorMsg = `${type} 디코딩 중 오류가 발생했습니다.`; break;
            case 4: /* MEDIA_ERR_SRC_NOT_SUPPORTED */ errorMsg = `${type} 형식을 지원하지 않거나, 파일을 찾을 수 없습니다.`; break;
        }
    }
    console.error(`DFEP: ${type} Error:`, errorMsg, mediaElement.error);
    setInternalError(errorMsg);
    setCurrentStage('error');
  };

  // Consolidate isLoading state. If parent says it's loading, this component reflects that for its UI.
  const effectiveIsLoading = parentIsLoading || currentStage.startsWith('loading');
  const displayError = internalError || parentError;

  return (
    <div className="flex flex-col items-center space-y-4 w-full p-4 bg-gray-50 rounded-lg shadow-md">
      {/* Title is now dynamic based on parent step context in page.tsx */}
      {/* <h2 className="text-xl font-semibold text-gray-800">5. 딥페이크 시나리오 체험</h2> */}
      
      <div className="w-full max-w-xl aspect-video bg-black rounded-md overflow-hidden relative">
        {/* Error Display takes precedence */} 
        {displayError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-95 p-4 z-20">
            <p className="text-red-400 font-semibold text-lg mb-2">! 오류 발생 !</p>
            <p className="text-white text-center text-sm">{displayError}</p>
          </div>
        )}

        {/* Loading Spinner (only if no error) */} 
        {effectiveIsLoading && !displayError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-70 z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-400"></div>
            <p className="text-white mt-3 text-sm">
              {pollingMessage ? pollingMessage : 
                (currentStage === 'loading_intro' ? "소개 음성 준비 중..." : 
                 currentStage === 'loading_video' ? "딥페이크 영상 준비 중..." : 
                 "콘텐츠 로딩 중...")}
            </p>
          </div>
        )}

        {/* Intro Audio Player (plays if stage allows and no error/loading overlay) */} 
        {introAudioUrl && (
           <audio 
            ref={introAudioRef} 
            onEnded={handleIntroAudioEnded} 
            onError={(e) => handleMediaError(e, "소개 음성")}
            onCanPlay={() => {if (currentStage === 'loading_intro') introAudioRef.current?.play().catch(e => console.error('DFEP: Intro autoplay failed', e));}}
            onPlay={() => { console.log("DFEP: Intro playing"); setCurrentStage('playing_intro');}}
            onPause={() => { if(currentStage === 'playing_intro' && introAudioRef.current && !introAudioRef.current.ended) setCurrentStage('loading_intro');}}
            preload="auto"
            className={(currentStage === 'playing_intro' || currentStage === 'loading_intro') && !displayError && !effectiveIsLoading ? '' : 'hidden'}
          />
        )}

        {/* Video Player (plays if stage allows and no error/loading overlay) */} 
        {videoUrl && (
          <video
            ref={videoRef}
            className={`w-full h-full ${(currentStage === 'playing_video' || (currentStage === 'loading_video' && !introAudioUrl)) && !displayError && !effectiveIsLoading ? 'block' : 'hidden'}`}
            controls
            onEnded={handleVideoEnded}
            onError={(e) => handleMediaError(e, "딥페이크 영상")}
            onCanPlay={() => {if (currentStage === 'loading_video') videoRef.current?.play().catch(e => console.error('DFEP: Video autoplay failed', e));}}
            onPlay={() => { console.log("DFEP: Video playing"); setCurrentStage('playing_video');}}
            onPause={() => { if(currentStage === 'playing_video' && videoRef.current && !videoRef.current.ended) setCurrentStage('loading_video');}}
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
            죄송합니다. 브라우저에서 비디오를 지원하지 않습니다.
          </video>
        )}
        
        {/* Idle/Empty state if nothing else is shown */} 
        {currentStage === 'idle' && !effectiveIsLoading && !displayError && (
             <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-400">체험을 로드할 준비가 되었습니다.</p>
            </div>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={effectiveIsLoading || currentStage === 'playing_intro' || currentStage === 'playing_video' || !!displayError}
        className={`w-full max-w-xs mt-4 px-6 py-3 rounded-lg font-semibold text-white transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          (effectiveIsLoading || currentStage === 'playing_intro' || currentStage === 'playing_video' || !!displayError)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        다음 단계로 이동
      </button>
    </div>
  );
} 