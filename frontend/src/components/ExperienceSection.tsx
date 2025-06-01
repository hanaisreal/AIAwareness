'use client'

import React, { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload'
import VoiceRecorder from './VoiceRecorder'
import { VIDEO_URLS } from '../constants/videos'
import { IDENTITY_THEFT_VOICE_SCENARIOS } from '../constants/voiceScenarios'
import { useRouter } from 'next/navigation';

interface ExperienceSectionProps {
  type: 'image' | 'voice';
  onImageUpload: (file: File) => void;
  onVoiceRecording: (audioBlob: Blob) => void;
  isProcessing: boolean;
  processingMessage: string;
  generatedVideoUrl: string | null;
  userScriptAudioUrl: string | null;
  error: string | null;
  onNext: () => void;
  userName: string;
  scriptToRead?: string;
  gender: 'male' | 'female';
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  type,
  onImageUpload,
  onVoiceRecording,
  isProcessing,
  processingMessage,
  generatedVideoUrl,
  userScriptAudioUrl,
  error,
  onNext,
  userName,
  scriptToRead,
  gender
}) => {
  const [currentScenario, setCurrentScenario] = useState(1);
  const [hasCompletedScenario, setHasCompletedScenario] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isGeneratedImageLoading, setIsGeneratedImageLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [blobImageUrl, setBlobImageUrl] = useState<string | null>(null);
  const router = useRouter();

  const fetchImageAsBlob = async (url: string) => {
    try {
      console.log('Fetching image as blob:', url);
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      console.log('Using proxy URL:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*,*/*;q=0.8',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setBlobImageUrl(objectUrl);
      console.log('Successfully created blob URL for image');
    } catch (error) {
      console.error('Error fetching image as blob:', error);
      setImageError('이미지를 불러오는데 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleImageGeneration = async (imageUrl: string) => {
    // Add a small delay before navigation to ensure the URL is ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Ensure the URL is properly encoded
    const encodedUrl = encodeURIComponent(imageUrl);
    console.log('Navigating to generated image page with URL:', imageUrl);
    console.log('Encoded URL:', encodedUrl);
    router.push(`/generated-image?url=${encodedUrl}`);
  };

  // Update the useEffect that handles image generation
  useEffect(() => {
    if (generatedVideoUrl) {
      console.log('Generated video URL changed:', generatedVideoUrl);
      handleImageGeneration(generatedVideoUrl);
    }
  }, [generatedVideoUrl]);

  const handleScenarioComplete = () => {
    if (currentScenario === 1) {
      setCurrentScenario(2);
      setHasCompletedScenario(false);
      onImageUpload(new File([], ''));
    } else {
      onNext();
    }
  };

  const getProxyImageUrl = (url: string) => {
    if (!url) return '';
    
    console.log('getProxyImageUrl input:', url);
    
    // For all URLs, use the proxy
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    console.log('Using proxy URL:', proxyUrl);
    return proxyUrl;
  };

  const renderLoadingSpinner = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
          style={{ width: `${loadingProgress}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm text-gray-600">얼굴 교체 이미지 생성 중... {loadingProgress}%</p>
    </div>
  );

  const renderScenario = () => {
    if (type === 'image') {
      const scenarioConfig = currentScenario === 1 
        ? VIDEO_URLS.FAKE_NEWS.EXPERIENCE.SCENARIO1[gender]
        : VIDEO_URLS.FAKE_NEWS.EXPERIENCE.SCENARIO2[gender];

      const targetImageUrl = currentScenario === 1 
        ? (gender === 'male' 
          ? "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario1_man.png"
          : "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario1_female.png")
        : (gender === 'male'
          ? "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario2_man.png"
          : "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario2_female.png");

      return (
        <div className="space-y-8">
          <h3 className="text-xl font-semibold">
            시나리오 {currentScenario}: 얼굴 교체 체험
          </h3>
          <p className="text-gray-600">
            {currentScenario === 1
              ? "첫 번째 시나리오에서는 가짜 뉴스에 사용될 수 있는 얼굴 교체를 체험해보겠습니다."
              : "두 번째 시나리오에서는 다른 상황에서의 얼굴 교체를 체험해보겠습니다."}
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium mb-2">변환될 이미지</h4>
              <div className="relative aspect-[4/3] w-full bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={getProxyImageUrl(targetImageUrl)}
                  alt="Target image" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error("Error loading target image:", e);
                    setImageError('변환될 이미지를 불러오는데 실패했습니다.');
                  }}
                />
                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                    <p className="text-red-600 text-sm">{imageError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <ImageUpload 
            onImageUpload={onImageUpload}
            isProcessing={isProcessing}
            processingMessage={processingMessage}
            key={`image-upload-${currentScenario}`}
          />
          {isProcessing && (
            <div className="mt-4">
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">{processingMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      const scenarioConfig = currentScenario === 1 
        ? IDENTITY_THEFT_VOICE_SCENARIOS.SCENARIO1
        : IDENTITY_THEFT_VOICE_SCENARIOS.SCENARIO2;

      return (
        <div className="space-y-8">
          <h3 className="text-xl font-semibold">
            시나리오 {currentScenario}: {scenarioConfig.title}
          </h3>
          <p className="text-gray-600">
            {scenarioConfig.description}
          </p>
          {!userScriptAudioUrl ? (
            <VoiceRecorder
              onVoiceRecording={onVoiceRecording}
              isProcessing={isProcessing}
              processingMessage={processingMessage}
              scriptToRead={scriptToRead}
            />
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-2">복제된 음성으로 생성된 시나리오:</h4>
                <p className="text-gray-700 mb-4">{scenarioConfig.script}</p>
                <audio src={userScriptAudioUrl} controls className="w-full rounded-md" />
              </div>
              <button 
                onClick={handleScenarioComplete}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
              >
                {currentScenario === 1 ? '다음 시나리오로 이동' : '체험 완료'}
              </button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">
        {type === 'image' ? '얼굴 교체 체험' : '음성 복제 체험'}
      </h2>
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      {isProcessing ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{processingMessage}</p>
        </div>
      ) : (
        renderScenario()
      )}
    </div>
  );
};

export default ExperienceSection; 