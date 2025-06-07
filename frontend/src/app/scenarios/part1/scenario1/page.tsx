'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import MinaAudioPlayer from '@/components/MinaAudioPlayer';
import { VIDEO_URLS } from '@/constants/videos';

const SCENARIO1_SCRIPTS = {
  intro: {
    text: "이번엔 나에게 이런 기술이 적용된다면 어떤 일이 생길지 체험해볼게요. 먼저, 본인의 사진을 업로드해주세요.",
    audioSrc: "/part1/part1_script_6.mp3"
  },
  description: {
    text: "첫 번째 시나리오는 당신이 로또 1등에 당첨되어 기사에 나온 상황이에요.",
    audioSrc: "/part1/part1_script_7.mp3"
  },
  conclusion: {
    text: "이런 식으로 사람들의 관심을 끌기 위해 허위 기사가 만들어질 수 있어요.",
    audioSrc: "/part1/part1_script_8.mp3"
  }
};

export default function Scenario1Page() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [currentStep, setCurrentStep] = useState<'intro' | 'upload' | 'description' | 'video' | 'conclusion'>('intro');
  const [showVideo, setShowVideo] = useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingMessage('이미지를 업로드하고 있습니다...');
      setError(null);

      const section = 'FAKE_NEWS';
      const scenario = 'SCENARIO1';

      const formData = new FormData();
      formData.append('user_image', file);
      
      const apiUrl = `/api/initiate-faceswap?section=${encodeURIComponent(section)}&scenario=${encodeURIComponent(scenario)}&gender=${encodeURIComponent(gender)}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '이미지 업로드에 실패했습니다. 응답을 파싱할 수 없습니다.' }));
        console.error('Upload failed:', response.status, errorData);
        throw new Error(errorData.detail || '이미지 업로드에 실패했습니다.');
      }

      const data = await response.json();
      const taskId = data.akool_task_id;

      if (!taskId) {
        console.error('No task_id received from backend:', data);
        throw new Error('작업 ID를 받지 못했습니다. 백엔드 응답을 확인하세요.');
      }
      setProcessingMessage('얼굴 교체 이미지를 생성하고 있습니다...');
      
      let pollCount = 0;
      const maxPolls = 60;
      let pollingCompleted = false;

      const pollInterval = setInterval(async () => {
        if (pollingCompleted) {
          clearInterval(pollInterval);
          return;
        }
        pollCount++;
        try {
          const statusResponse = await fetch(`/api/faceswap-status/${taskId}`);
          const statusData = await statusResponse.json();
          
          if (statusData.status_details && statusData.status_details.faceswap_status === 2) {
            clearInterval(pollInterval);
            pollingCompleted = true;
            const imageUrl = statusData.status_details.url;
            if (!imageUrl) {
              setError('생성된 이미지 URL을 받지 못했습니다.');
              setIsProcessing(false);
              return;
            }
            // Store the original uploaded image data in localStorage
            const reader = new FileReader();
            reader.onloadend = () => {
              localStorage.setItem('part1UserFaceImageDataBase64', reader.result as string);
            };
            reader.readAsDataURL(file);
            setCurrentStep('description');
            setIsProcessing(false);
          } else if (statusData.status_details && statusData.status_details.faceswap_status === 3) {
            clearInterval(pollInterval);
            pollingCompleted = true;
            setError(statusData.status_details.msg || '이미지 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
            setIsProcessing(false);
          } else if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            pollingCompleted = true;
            setError('이미지 생성 시간이 초과되었습니다. 다시 시도해주세요.');
            setIsProcessing(false);
          }
        } catch (error) {
          clearInterval(pollInterval);
          if (!pollingCompleted) {
            pollingCompleted = true;
            console.error('Polling error:', error);
            setError('생성 상태 확인 중 오류가 발생했습니다.');
            setIsProcessing(false);
          }
        }
      }, 2000);

    } catch (error: any) {
      console.error('Error in handleImageUpload:', error);
      setError(error.message || '이미지 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <MinaAudioPlayer
            audioSrc={SCENARIO1_SCRIPTS.intro.audioSrc}
            text={SCENARIO1_SCRIPTS.intro.text}
            onContinue={() => setCurrentStep('upload')}
          />
        );
      case 'upload':
        return (
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <ImageUpload
              onImageUpload={handleImageUpload}
              isProcessing={isProcessing}
              processingMessage={processingMessage}
            />
          </div>
        );
      case 'description':
        return (
          <MinaAudioPlayer
            audioSrc={SCENARIO1_SCRIPTS.description.audioSrc}
            text={SCENARIO1_SCRIPTS.description.text}
            onContinue={() => setCurrentStep('video')}
          />
        );
      case 'video':
        return (
          <div className="flex flex-col items-center space-y-4">
            {showVideo ? (
              <div className="aspect-video w-full">
                <video 
                  src={VIDEO_URLS.FAKE_NEWS.EXPERIENCE.SCENARIO1.male.path}
                  controls
                  className="w-full rounded-lg shadow-xl"
                  onEnded={() => setCurrentStep('conclusion')}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <button
                onClick={() => setShowVideo(true)}
                className="w-full max-w-[200px] px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                영상 보기
              </button>
            )}
          </div>
        );
      case 'conclusion':
        return (
          <MinaAudioPlayer
            audioSrc={SCENARIO1_SCRIPTS.conclusion.audioSrc}
            text={SCENARIO1_SCRIPTS.conclusion.text}
            onContinue={() => router.push('/scenarios/part1/scenario2')}
            buttonText="다음 시나리오"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-4">
      <div className="w-full max-w-lg mx-auto bg-white/90 p-8 rounded-xl shadow-2xl text-center">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => router.push('/scenarios/part1')}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Back to Part 1 Scenarios"
          >
            &times;
          </button>
        </div>

        <h1 className="text-3xl font-bold text-orange-600 mb-4">얼굴 교체 체험 - 시나리오 1</h1>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            <p className="font-semibold">오류 발생:</p>
            <p>{error}</p>
          </div>
        )}
        
        {currentStep === 'upload' && (
          <div className="mb-6">
            <label htmlFor="gender-select" className="block text-sm font-medium text-gray-700 mb-1">캐릭터 성별 선택:</label>
            <select 
              id="gender-select"
              value={gender}
              onChange={(e) => setGender(e.target.value as 'male' | 'female')}
              disabled={isProcessing}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
} 