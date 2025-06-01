'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Part2Scenario1Page() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleVoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingMessage('음성을 업로드하고 있습니다...');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload the voice file
      const uploadResponse = await fetch('/api/upload-voice', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('음성 업로드에 실패했습니다.');
      }

      const { taskId } = await uploadResponse.json();
      setProcessingMessage('음성을 처리하고 있습니다...');

      // Poll for status
      const startTime = Date.now();
      const timeout = 120000; // 2 minutes timeout

      while (Date.now() - startTime < timeout) {
        const statusResponse = await fetch(`/api/voice-status/${taskId}`);
        const status = await statusResponse.json();

        if (status.status === 'completed') {
          // Navigate to the generated voice page
          router.push(`/generated-voice?voiceUrl=${encodeURIComponent(status.voiceUrl)}`);
          return;
        } else if (status.status === 'failed') {
          throw new Error('음성 처리에 실패했습니다.');
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      throw new Error('음성 처리 시간이 초과되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

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
          <h1 className="text-3xl font-bold">시나리오 1: 음성 복제 체험</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <section className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">시나리오 설명</h2>
            <p className="text-gray-700 mb-4">
              이 시나리오에서는 음성 복제 기술을 체험해볼 수 있습니다.
              자신의 음성을 녹음하여 업로드하면, AI가 이를 분석하고 
              다른 문장을 같은 목소리로 말하도록 변환합니다.
            </p>
          </section>

          <section className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <input
                type="file"
                accept="audio/*"
                onChange={handleVoiceUpload}
                disabled={isProcessing}
                className="hidden"
                id="voice-upload"
              />
              <label
                htmlFor="voice-upload"
                className={`inline-block px-6 py-3 rounded-lg cursor-pointer
                  ${isProcessing 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                {isProcessing ? '처리 중...' : '음성 파일 업로드'}
              </label>
              {isProcessing && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">{processingMessage}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 