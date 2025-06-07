'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VIDEO_URLS } from '@/constants/videos';
import { commonStyles } from '@/styles/common';
import PageLayout from '@/components/layouts/PageLayout';

type Section = 'concept' | 'cases' | 'scenarios';
type CaseNumber = 1 | 2;
type ScenarioNumber = 1 | 2 | 3;

export default function Part2Page() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<Section>('concept');
  const [currentCase, setCurrentCase] = useState<CaseNumber>(1);
  const [currentScenario, setCurrentScenario] = useState<ScenarioNumber>(1);
  const [userName, setUserName] = useState("어르신");

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, []);

  const handleNextCase = () => {
    if (currentCase < 2) {
      setCurrentCase((prev) => (prev + 1) as CaseNumber);
    } else {
      router.push('/scenarios/part2/scenario1'); // Navigate to scenario1 page instead of showing scenarios
    }
  };

  const handleNextScenario = () => {
    if (currentScenario < 3) {
      setCurrentScenario((prev) => (prev + 1) as ScenarioNumber);
    } else {
      router.push('/completion'); // Navigate to completion page when all scenarios are done
    }
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'concept':
        return (
          <div className="animate-fade-in w-full space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-purple-600">개념: 신원 도용이란?</h1>
            <div className="aspect-video w-full">
              <video 
                src={VIDEO_URLS.IDENTITY_THEFT.CONCEPT.MAIN}
                controls
                className="w-full rounded-lg shadow-xl"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <button
              onClick={() => setCurrentSection('cases')}
              className="w-full py-3 px-6 bg-purple-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-purple-600 transition duration-150 ease-in-out mt-4"
            >
              다음으로
            </button>
          </div>
        );

      case 'cases':
        return (
          <div className="animate-fade-in w-full space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-purple-600">사례 영상 {currentCase}</h1>
            <div className="aspect-video w-full">
              <video 
                src={VIDEO_URLS.IDENTITY_THEFT.CASES[`CASE${currentCase}`]}
                controls
                className="w-full rounded-lg shadow-xl"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <button
              onClick={handleNextCase}
              className="w-full py-3 px-6 bg-purple-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-purple-600 transition duration-150 ease-in-out mt-4"
            >
              {currentCase < 2 ? '다음으로' : '체험하기'}
            </button>
          </div>
        );

      case 'scenarios':
        return (
          <div className="animate-fade-in w-full space-y-4">
            <h1 className={commonStyles.heading}>신원 도용 체험 {currentScenario}</h1>
            <p className={commonStyles.subheading}>
              {userName}님, 반가워요!
            </p>
            <div className="aspect-video w-full">
              <video 
                src={VIDEO_URLS.IDENTITY_THEFT.EXPERIENCE.SCENARIO3.male}
                controls
                className="w-full rounded-lg shadow-xl"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <button
              onClick={handleNextScenario}
              className="w-full py-3 px-6 bg-purple-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-purple-600 transition duration-150 ease-in-out mt-4"
            >
              {currentScenario < 3 ? '다음으로' : '완료하기'}
            </button>
          </div>
        );
    }
  };

  return (
    <PageLayout>
      {renderContent()}
    </PageLayout>
  );
} 