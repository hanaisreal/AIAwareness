'use client'
import { useState } from 'react'

interface CaseStudy {
  title: string;
  description: string;
  videoUrl: string;
}

interface CaseStudiesProps {
  title: string;
  description: string;
  cases: CaseStudy[];
  onComplete: () => void;
  userName: string;
}

export default function CaseStudies({
  title,
  description,
  cases,
  onComplete,
  userName
}: CaseStudiesProps) {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);

  const handleNext = () => {
    if (currentCaseIndex < cases.length - 1) {
      setCurrentCaseIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const currentCase = cases[currentCaseIndex];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <p className="mb-6 text-gray-700">{description}</p>
      
      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">{currentCase.title}</h3>
        <p className="text-gray-600 mb-4">{currentCase.description}</p>
        <video 
          src={currentCase.videoUrl} 
          controls 
          className="w-full rounded-lg shadow-md"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          사례 {currentCaseIndex + 1} / {cases.length}
        </span>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {currentCaseIndex < cases.length - 1 ? '다음 사례' : '다음 단계'}
        </button>
      </div>
    </div>
  );
} 