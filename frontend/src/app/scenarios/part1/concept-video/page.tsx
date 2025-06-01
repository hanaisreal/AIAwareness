'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VIDEO_URLS } from '@/constants/videos';

const CONCEPT_VIDEO_URL = VIDEO_URLS.FAKE_NEWS.CONCEPT.MAIN;

export default function ConceptVideoPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Attempt to autoplay, browsers might block this without user interaction
    videoRef.current?.play().catch(error => {
      console.warn("Video autoplay was prevented:", error);
      // User might need to click play manually if autoplay fails
    });
  }, []);

  const handleVideoEnd = () => {
    // Optionally, automatically navigate back when video ends
    // router.push('/scenarios/part1?videoPlayed=true');
  };

  const handleProceed = () => {
    router.push('/scenarios/part1?videoPlayed=true');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-3xl">
        <video 
          ref={videoRef} 
          src={CONCEPT_VIDEO_URL} 
          controls 
          className="w-full rounded-lg shadow-2xl aspect-video mb-6"
          onEnded={handleVideoEnd} // Hook for when video finishes
        >
          Your browser does not support the video tag.
        </video>
        <button 
          onClick={handleProceed}
          className="w-full py-3 px-6 bg-orange-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out"
        >
          영상 시청 완료 및 다음 단계로
        </button>
      </div>
    </div>
  );
} 