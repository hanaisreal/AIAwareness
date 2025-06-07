'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import MinaAudioPlayer from '@/components/MinaAudioPlayer';
import { VIDEO_URLS } from '@/constants/videos';

const SCENARIO2_SCRIPTS = {
  intro: {
    text: "이번엔 정반대 상황이에요. 당신이 거액의 겟돈을 들고 도망쳤다가 결국 구속됐다는 내용의 가짜 기사예요.",
    audioSrc: "/part1/part1_script_9.mp3"
  },
  conclusion: {
    text: "이처럼 전혀 사실이 아닌 내용이 진짜처럼 보이면 큰 피해로 이어질 수 있죠.",
    audioSrc: "/part1/part1_script_10.mp3"
  }
};

export default function Part1Scenario2Page() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [currentStep, setCurrentStep] = useState<'intro' | 'video' | 'conclusion'>('intro');
  const [showVideo, setShowVideo] = useState(false);
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [userImagePreviewUrl, setUserImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load stored image from Part 1
    const storedImageData = localStorage.getItem('part1UserFaceImageDataBase64');
    if (storedImageData) {
      fetch(storedImageData)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "user_face_from_part1.png", { type: blob.type });
          setUserImageFile(file);
          setUserImagePreviewUrl(URL.createObjectURL(file));
        })
        .catch(err => {
          console.error("Error loading stored image:", err);
        });
    }
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingMessage('이미지를 업로드하고 있습니다...');
      setError(null);

      const section = 'FAKE_NEWS';
      const scenario = 'SCENARIO2';

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
        console.error('No task_id received from backend for Scenario 2:', data);
        throw new Error('작업 ID를 받지 못했습니다. 백엔드 응답을 확인하세요.');
      }
      setProcessingMessage('얼굴 교체 이미지를 생성하고 있습니다 (시나리오 2)...');
      
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
              setError('생성된 이미지 URL을 받지 못했습니다 (시나리오 2).');
              setIsProcessing(false);
              return;
            }
            setCurrentStep('video');
            setIsProcessing(false);
          } else if (statusData.status_details && statusData.status_details.faceswap_status === 3) {
            clearInterval(pollInterval);
            pollingCompleted = true;
            setError(statusData.status_details.msg || '이미지 생성 중 오류가 발생했습니다 (시나리오 2). 다시 시도해주세요.');
            setIsProcessing(false);
          } else if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            pollingCompleted = true;
            setError('이미지 생성 시간이 초과되었습니다 (시나리오 2). 다시 시도해주세요.');
            setIsProcessing(false);
          }
        } catch (error) {
          clearInterval(pollInterval);
          if (!pollingCompleted) {
            pollingCompleted = true;
            console.error('Polling error for Scenario 2:', error);
            setError('생성 상태 확인 중 오류가 발생했습니다 (시나리오 2).');
            setIsProcessing(false);
          }
        }
      }, 2000);

    } catch (error: any) {
      console.error('Error in handleImageUpload for Scenario 2:', error);
      setError(error.message || '이미지 처리 중 오류가 발생했습니다 (시나리오 2).');
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <MinaAudioPlayer
            audioSrc={SCENARIO2_SCRIPTS.intro.audioSrc}
            text={SCENARIO2_SCRIPTS.intro.text}
            onContinue={() => setCurrentStep('video')}
          />
        );
      case 'video':
        return (
          <div className="flex flex-col items-center space-y-4">
            {showVideo ? (
              <div className="aspect-video w-full">
                <video 
                  src={VIDEO_URLS.FAKE_NEWS.EXPERIENCE.SCENARIO2.male.path}
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
            audioSrc={SCENARIO2_SCRIPTS.conclusion.audioSrc}
            text={SCENARIO2_SCRIPTS.conclusion.text}
            onContinue={() => router.push('/scenarios/part2')}
            buttonText="다음으로"
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
            className="text-gray-500 hover:text-orange-600 text-2xl transition-colors"
            aria-label="Back to Part 1 Main Page"
          >
            &times;
          </button>
        </div>

        <h1 className="text-3xl font-bold text-orange-600 mb-4">얼굴 교체 체험 - 시나리오 2</h1>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            <p className="font-semibold">오류 발생:</p>
            <p>{error}</p>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
} 