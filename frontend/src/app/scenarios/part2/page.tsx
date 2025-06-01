'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function Part2ScenariosPage() {
  const router = useRouter();

  const navigateToScenario = (scenario: number) => {
    router.push(`/scenarios/part2/scenario${scenario}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-8">Part 2: 신원 도용</h1>
        
        <div className="space-y-8">
          <section className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">개념 설명</h2>
            <p className="text-gray-700 mb-4">
              신원 도용은 다른 사람의 신원 정보를 무단으로 사용하는 범죄입니다.
              딥페이크 기술을 활용한 신원 도용은 더욱 정교해져서 
              피해를 입기 쉽고, 발견하기 어려워지고 있습니다.
            </p>
          </section>

          <section className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">사례</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-2">사례 1: 금융 사기</h3>
                <p className="text-gray-600">
                  딥페이크 기술로 다른 사람의 얼굴과 목소리를 복제하여 
                  금융 거래를 시도하는 사례가 증가하고 있습니다.
                </p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-2">사례 2: 온라인 계정 탈취</h3>
                <p className="text-gray-600">
                  얼굴 인증이나 음성 인증을 우회하기 위해 딥페이크를 
                  이용하는 사례가 발생하고 있습니다.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">체험하기</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigateToScenario(1)}
                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">시나리오 1</h3>
                <p className="text-gray-600">
                  음성 복제를 통한 신원 도용을 체험해보세요.
                </p>
              </button>
              <button
                onClick={() => navigateToScenario(2)}
                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">시나리오 2</h3>
                <p className="text-gray-600">
                  다른 상황에서의 음성 복제를 체험해보세요.
                </p>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 