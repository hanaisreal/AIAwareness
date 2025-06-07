'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/layouts/PageLayout';
import { commonStyles } from '@/styles/common';

export default function GeneratedVideoPage() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [originalUrlForDisplay, setOriginalUrlForDisplay] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== GENERATED-VIDEO PAGE LOADED ===');
    const originalUrl = localStorage.getItem('generatedVideoToPlay');
    console.log('localStorage.getItem("generatedVideoToPlay") on load:', originalUrl);
    console.log('===================================');
    
    if (originalUrl) {
      setOriginalUrlForDisplay(originalUrl);
      const proxiedUrl = `/api/stream-video?url=${encodeURIComponent(originalUrl)}`;
      console.log('Setting proxied URL for video element:', proxiedUrl);
      setVideoUrl(proxiedUrl);
    } else {
      setError('재생할 생성된 비디오 URL을 찾을 수 없습니다. 이전 단계로 돌아가 다시 시도해주세요.');
      setIsLoading(false);
    }
  }, []);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = e.target as HTMLVideoElement;
    const videoError = videoElement.error;
    let errorMessage = '영상 재생에 실패했습니다';
    
    console.error('=== VIDEO ERROR DEBUG ===');
    console.error('Video element current src:', videoElement.currentSrc);
    console.error('Video element src attribute:', videoElement.src);
    console.error('Video error object:', videoError);
    console.error('Video readyState:', videoElement.readyState);
    console.error('Video networkState:', videoElement.networkState);
    
    if (videoError) {
      console.error('Error code:', videoError.code);
      console.error('Error message:', videoError.message);
      
      switch (videoError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = '영상 재생이 중단되었습니다'
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = '네트워크 오류로 영상 로드에 실패했습니다'
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = '영상 디코딩에 실패했습니다'
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = '영상 형식이 지원되지 않습니다'
          break;
      }
    }
    
    console.error('=========================');
    setError(errorMessage);
    setIsLoading(false);
  };

  return (
    <PageLayout>
      <div className="animate-fade-in w-full max-w-4xl mx-auto space-y-6 flex flex-col items-center">
        <h1 className={commonStyles.heading}>생성된 영상 시청</h1>
        
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-xl">
          {error ? (
            <div className="w-full h-full flex items-center justify-center text-red-500 p-4 text-center">
              오류: {error}
            </div>
          ) : videoUrl ? (
            <video
              key={videoUrl}
              className="w-full h-full"
              controls
              autoPlay
              onLoadStart={() => {
                console.log('Video load started...');
                setIsLoading(true);
                setError(null);
              }}
              onLoadedData={() => {
                console.log('Video data loaded.');
                setIsLoading(false);
              }}
              onError={handleVideoError}
            >
              <source src={videoUrl} type="video/mp4" />
              현재 브라우저에서는 비디오 재생을 지원하지 않습니다.
            </video>
          ) : !isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500 p-4 text-center">
                영상 URL을 설정하는 중입니다...
             </div>
          ) : null
        }
        </div>

        {isLoading && !error && (
          <div className="mt-4 text-center text-gray-600">
            영상 불러오는 중...
          </div>
        )}


        {!isLoading && (
          <button
            onClick={() => router.push('/scenarios/part3')}
            className={`${commonStyles.navigationButton} mt-8`}
            disabled={!!error || !videoUrl}
          >
            대응방안 알아보기
          </button>
        )}
      </div>
      <style jsx global>{`
        .animate-fade-in { animation: fadeIn 0.7s ease-out; }
        @keyframes fadeIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
    </PageLayout>
  );
} 