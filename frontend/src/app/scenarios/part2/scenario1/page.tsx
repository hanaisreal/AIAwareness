'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { commonStyles } from '@/styles/common';
import PageLayout from '@/components/layouts/PageLayout';
import VoiceRecorder from '@/components/VoiceRecorder';
import { IDENTITY_THEFT_VOICE_SCENARIOS } from '@/constants/voiceScenarios';

export default function Part2Scenario1Page() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("어르신");
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'recording' | 'scenario'>('recording');

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, []);

  const handleVoiceUpload = async (recordedBlob: Blob) => {
    setIsProcessing(true);
    setProcessingMessage('음성을 분석하고 있습니다...');
    setError(null);

    try {
      // Step 1: Clone the voice
      const formData = new FormData();
      formData.append('audio_file', recordedBlob);

      console.log('Sending voice to clone-voice endpoint...');
      const cloneResponse = await fetch('/api/clone-voice', {
        method: 'POST',
        body: formData,
      });

      const responseText = await cloneResponse.text();
      console.log('Clone voice response:', responseText);

      if (!cloneResponse.ok) {
        throw new Error(`음성 분석에 실패했습니다. (${cloneResponse.status}): ${responseText}`);
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('서버 응답을 처리할 수 없습니다.');
      }

      if (!responseData.voice_id) {
        console.error('No voice_id in response:', responseData);
        throw new Error('음성 ID를 받지 못했습니다.');
      }

      const { voice_id } = responseData;
      console.log('Successfully got voice_id:', voice_id);
      
      setVoiceId(voice_id);
      localStorage.setItem('cloned_voice_id', voice_id);
      setIsProcessing(false);
      setCurrentStep('scenario');

    } catch (err) {
      console.error('Voice cloning error:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  const handleGenerateScenarioVoice = async () => {
    if (!voiceId) return;

    setIsProcessing(true);
    setProcessingMessage('음성을 생성하고 있습니다...');
    setError(null);

    try {
      const speechResponse = await fetch('/api/generate-elevenlabs-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: IDENTITY_THEFT_VOICE_SCENARIOS.SCENARIO1.script,
          voice_id: voiceId,
          model_id: "eleven_multilingual_v2"
        }),
      });

      if (!speechResponse.ok) {
        throw new Error('음성 생성에 실패했습니다.');
      }

      const audioBlob = await speechResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Store the generated voice URL in localStorage for the next page
      localStorage.setItem('generatedVoiceUrl', audioUrl);
      
      // Create and play the audio
      const audio = new Audio(audioUrl);
      
      // Wait for the audio to be loaded before playing
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
        audio.load();
      });

      // Play the audio and wait for it to finish
      await new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.play().catch(reject);
      });

      // Only navigate to scenario 2 after the audio has finished playing
      router.push('/scenarios/part2/scenario2');
      
      setIsProcessing(false);

    } catch (err) {
      console.error('Error playing audio:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  return (
    <PageLayout>
      <div className="animate-fade-in w-full space-y-4">
        {currentStep === 'recording' ? (
          <>
            <h1 className={commonStyles.heading}>음성 녹음</h1>
            <p className={commonStyles.subheading}>
              {userName}님, 음성 복제를 위해 30초 정도의 음성을 녹음해주세요.
              <br />
              아래 문장을 천천히, 또박또박 읽어주시면 됩니다.
            </p>

            {error && (
              <div className="w-full p-3 my-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
                <p className='font-semibold'>오류:</p> {error}
              </div>
            )}

            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <VoiceRecorder
                onVoiceRecording={handleVoiceUpload}
                isProcessing={isProcessing}
                processingMessage={processingMessage}
                scriptToRead="안녕하세요, 저는 AI 음성 복제의 위험성을 알리기 위해 이 영상을 만들었습니다. 여러분도 함께 주의해주세요."
              />
            </div>
          </>
        ) : (
          <>
            <h1 className={commonStyles.heading}>{IDENTITY_THEFT_VOICE_SCENARIOS.SCENARIO1.title}</h1>
            <p className={commonStyles.subheading}>
              {userName}님, {IDENTITY_THEFT_VOICE_SCENARIOS.SCENARIO1.description}
            </p>

            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <p className="mb-4 text-gray-700">
                아래는 AI가 생성한 음성입니다. 실제로 이런 음성이 생성될 수 있다는 것을 체험해보세요.
              </p>
              <button
                onClick={handleGenerateScenarioVoice}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? '음성 생성 중...' : '음성 생성하기'}
              </button>
            </div>

            {error && (
              <div className="w-full p-3 my-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
                <p className='font-semibold'>오류:</p> {error}
              </div>
            )}

            {isProcessing && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mx-auto mb-3"></div>
                <p className="text-purple-600 font-medium">{processingMessage}</p>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
} 