'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

export default function Part1Scenario2Page() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');

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
            router.push(`/generated-image?url=${encodeURIComponent(imageUrl)}&fromScenario=2`);
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
        <img src="/talking.gif" alt="Mina guiding" className="w-48 h-auto mx-auto mb-6" />

        <h1 className="text-3xl font-bold text-orange-600 mb-4">얼굴 교체 체험 - 시나리오 2</h1> 
        <p className="text-gray-700 mb-6">
          두 번째 얼굴 교체 시나리오입니다. 다른 배경에서 어떻게 얼굴이 바뀌는지 체험해보세요!
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            <p className="font-semibold">오류 발생:</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="gender-select-s2" className="block text-sm font-medium text-gray-700 mb-1">캐릭터 성별 선택:</label>
          <select 
            id="gender-select-s2"
            value={gender}
            onChange={(e) => setGender(e.target.value as 'male' | 'female')}
            disabled={isProcessing}
            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <ImageUpload
              onImageUpload={handleImageUpload}
              isProcessing={isProcessing}
              processingMessage={processingMessage}
            />
        </div>

        {isProcessing && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mx-auto mb-3"></div>
            <p className="text-orange-600 font-medium">{processingMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
} 