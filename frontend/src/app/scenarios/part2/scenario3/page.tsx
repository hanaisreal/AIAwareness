'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VIDEO_URLS } from '@/constants/videos';
import { commonStyles } from '@/styles/common';
import PageLayout from '@/components/layouts/PageLayout';
import ImageUpload from '@/components/ImageUpload';

export default function Part2Scenario3Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [userImagePreviewUrl, setUserImagePreviewUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const storedGender = localStorage.getItem('gender') as 'male' | 'female';
    if (storedGender && (storedGender === 'male' || storedGender === 'female')) {
      setGender(storedGender);
    } else {
      setErrorMessage('사용자 성별이 설정되지 않았습니다. 이전 단계에서 성별을 선택해주세요.');
    }

    // Load stored image from Part 1
    const part1ImageDataBase64 = localStorage.getItem('part1UserFaceImageDataBase64');
    if (part1ImageDataBase64) {
      fetch(part1ImageDataBase64)
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUserImageFile(file);
      setUserImagePreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleGenerateVideo = async () => {
    if (!userImageFile) {
      setErrorMessage('얼굴 이미지를 업로드해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('영상 생성 중...');

    const formData = new FormData();
    formData.append('user_image', userImageFile);
    formData.append('section', 'IDENTITY_THEFT');
    formData.append('scenario', 'SCENARIO1');
    formData.append('gender', gender);
    formData.append('face_enhance', '0');

    console.log('Sending video generation request...');

    try {
      const response = await fetch('/api/initiate-video-faceswap', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', { status: response.status, body: errorText });
        throw new Error(`영상 생성 요청 실패: ${errorText}`);
      }

      const data = await response.json();
      const taskId = data.akool_task_id;
      setStatusMessage('작업 ID 확인됨, 결과 폴링 중...');

      // Polling loop
      while (true) {
        const statusResponse = await fetch(`/api/faceswap-status/${taskId}`);
        const statusData = await statusResponse.json();
        
        console.log('=== POLLING DEBUG ===');
        console.log('Task ID:', taskId);
        console.log('Status response:', statusData);
        console.log('faceswap_status:', statusData.status_details?.faceswap_status);
        console.log('URL in response:', statusData.status_details?.url);
        console.log('=====================');
        
        if (statusData.status_details.faceswap_status === 2) { // Success
          const originalGeneratedUrl = statusData.status_details.url;
          if (originalGeneratedUrl) {
            console.log('SUCCESS: Original generated video URL received:', originalGeneratedUrl);
            console.log('Setting localStorage with key "generatedVideoToPlay"');
            localStorage.setItem('generatedVideoToPlay', originalGeneratedUrl);
            
            // Verify localStorage was set
            const storedUrl = localStorage.getItem('generatedVideoToPlay');
            console.log('Verification - URL retrieved from localStorage:', storedUrl);
            
            setStatusMessage('영상 생성 완료! 10초 후 재생 페이지로 이동합니다...');
            // Wait for 10 seconds before redirecting
            console.log('Starting 10 second countdown...');
            await new Promise(resolve => setTimeout(resolve, 10000)); 
            console.log('10 seconds elapsed, navigating to generated-video page...');
            router.push('/scenarios/part2/generated-video');
          } else {
            console.error('Akool success response missing URL');
            throw new Error('영상 생성은 성공했으나 URL이 제공되지 않았습니다.');
          }
          break; // Exit polling loop
        } else if (statusData.status_details.faceswap_status === 3) { // Failed
          const failMsg = statusData.status_details.alg_msg || 'Akool에서 영상 생성 실패.';
          console.error('Akool video generation failed:', statusData.status_details);
          throw new Error(failMsg);
        } else if (statusData.status_details.faceswap_status === 1 || statusData.status_details.faceswap_status === 0) {
          setStatusMessage(`영상 처리 중... (상태: ${statusData.status_details.faceswap_status === 1 ? '진행중' : '대기중'})`);
        } else {
          setStatusMessage(`알 수 없는 영상 처리 상태: ${statusData.status_details.faceswap_status}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
      }
    } catch (err) {
      console.error('Error during video generation or polling:', err);
      const errorMessageString = (err instanceof Error) ? err.message : '영상 생성 중 알 수 없는 오류.';
      setErrorMessage(errorMessageString + ' 다시 시도해주세요.');
      setStatusMessage(null);
    } finally {
      setIsLoading(false); // Stop loading once polling ends (success or fail) or error caught
    }
  };

  return (
    <PageLayout>
      <div className="animate-fade-in w-full space-y-4">
        <h1 className={commonStyles.heading}>영상 얼굴 적용 체험</h1>
        <p className={commonStyles.subheading}>
          이제 영상에 얼굴을 적용해보겠습니다. 
          이 체험을 통해 딥페이크 기술이 얼마나 위험할 수 있는지 직접 경험해보세요.
        </p>

        {errorMessage && (
          <div className="w-full p-3 my-4 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
            <p className='font-semibold'>오류:</p> {errorMessage}
          </div>
        )}

        {!isLoading && (
           <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <div className="mb-6">
              <label htmlFor="gender-select" className="block text-sm font-medium text-gray-700 mb-1">
                캐릭터 성별 선택:
              </label>
              <select 
                id="gender-select"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">얼굴 이미지 업로드</h3>
              {userImagePreviewUrl ? (
                <div className="mb-4">
                  <img 
                    src={userImagePreviewUrl} 
                    alt="User face preview" 
                    className="w-full max-w-xs h-auto rounded-lg shadow-md mx-auto mb-3" 
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-3">얼굴 이미지를 업로드해주세요.</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleGenerateVideo}
              disabled={!userImageFile}
              className={`${commonStyles.primaryButton} ${(!userImageFile) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              영상 생성하기
            </button>
          </div>
        )}

        {isLoading && statusMessage && (
          <div className="mt-4 p-6 text-center bg-blue-50 rounded-lg border border-blue-200">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium text-lg mb-2">{statusMessage}</p>
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