'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function GeneratedVoicePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [blobVoiceUrl, setBlobVoiceUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const voiceUrl = searchParams.get('voiceUrl');

  useEffect(() => {
    if (!voiceUrl) {
      setError('음성 URL이 제공되지 않았습니다.');
      setIsLoading(false);
      return;
    }

    const fetchVoiceAsBlob = async () => {
      try {
        // Initial delay to allow the URL to become accessible
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const maxRetries = 3;
        let currentRetry = 0;

        while (currentRetry < maxRetries) {
          try {
            setRetryCount(currentRetry + 1);
            const response = await fetch(`/api/proxy-voice?url=${encodeURIComponent(voiceUrl)}`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setBlobVoiceUrl(url);
            setIsLoading(false);
            return;
          } catch (err) {
            currentRetry++;
            if (currentRetry === maxRetries) {
              throw err;
            }
            // Wait 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '음성을 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };

    fetchVoiceAsBlob();

    // Cleanup function
    return () => {
      if (blobVoiceUrl) {
        URL.revokeObjectURL(blobVoiceUrl);
      }
    };
  }, [voiceUrl]);

  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      const timer = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLoading]);

  if (!voiceUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">음성 URL이 없습니다</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold">생성된 음성</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              음성을 불러오는 중입니다... (시도 {retryCount}/3)
            </p>
            <div className="w-full max-w-md mx-auto mt-4 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          </div>
        ) : blobVoiceUrl ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <audio
                controls
                className="w-full"
                src={blobVoiceUrl}
              >
                Your browser does not support the audio element.
              </audio>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">음성 정보</h2>
              <pre className="bg-white p-4 rounded overflow-auto">
                {JSON.stringify({
                  originalUrl: voiceUrl,
                  blobUrl: blobVoiceUrl,
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
} 