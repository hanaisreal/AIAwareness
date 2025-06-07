'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { commonStyles } from '@/styles/common';
import { IDENTITY_THEFT_VOICE_SCENARIOS } from '@/constants/voiceScenarios';
import PageLayout from '@/components/layouts/PageLayout';

export default function Part2Scenario2Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const storedVoiceId = localStorage.getItem('cloned_voice_id');
    if (storedVoiceId) {
      setClonedVoiceId(storedVoiceId);
    } else {
      setErrorMessage("복제된 목소리 ID를 찾을 수 없습니다. 먼저 시나리오 1을 완료해주세요.");
    }
  }, []);

  const handleGenerateVoice = async () => {
    if (!clonedVoiceId) {
      setErrorMessage("복제된 목소리 ID가 없습니다. 시나리오 1을 먼저 완료해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-narrator-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: IDENTITY_THEFT_VOICE_SCENARIOS.SCENARIO2.script,
          voice_id: clonedVoiceId,
          model_id: "eleven_multilingual_v2"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice sample');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setGeneratedAudioUrl(audioUrl);
      setIsLoading(false);
    } catch (err) {
      console.error("Error generating voice sample:", err);
      setErrorMessage("음성 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="animate-fade-in w-full space-y-4">
        <h1 className={commonStyles.heading}>{IDENTITY_THEFT_VOICE_SCENARIOS.SCENARIO2.title}</h1>
        <p className={commonStyles.subheading}>
          {IDENTITY_THEFT_VOICE_SCENARIOS.SCENARIO2.description}
        </p>

        {errorMessage && (
          <div className="w-full p-3 my-4 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
            <p className='font-semibold'>오류:</p> {errorMessage}
          </div>
        )}

        {!generatedAudioUrl && !isLoading && (
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <p className="mb-4 text-gray-700">
              아래는 AI가 생성한 음성입니다. 실제로 이런 음성이 생성될 수 있다는 것을 체험해보세요.
            </p>
            <button
              onClick={handleGenerateVoice}
              disabled={isLoading}
              className={commonStyles.primaryButton}
            >
              {isLoading ? '음성 생성 중...' : '음성 생성하기'}
            </button>
          </div>
        )}

        {isLoading && (
          <div className="mt-4 p-3 text-center bg-orange-50 rounded-lg border border-orange-200">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mx-auto mb-3"></div>
            <p className="text-orange-600 font-medium">음성을 생성하고 있습니다...</p>
          </div>
        )}

        {generatedAudioUrl && !isLoading && (
          <div className="w-full mt-6 p-4 border border-green-300 rounded-lg bg-green-50/70 animate-fade-in">
            <h3 className="text-xl font-semibold text-green-700 mb-3 text-center">생성된 두 번째 음성:</h3>
            <audio controls src={generatedAudioUrl} className="w-full rounded-md" ref={audioRef}>
              Your browser does not support the audio element.
            </audio>
            <button
              onClick={() => router.push('/scenarios/part2/scenario3')}
              className={commonStyles.navigationButton}
            >
              다음 체험으로 이동 (영상 얼굴 적용)
            </button>
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