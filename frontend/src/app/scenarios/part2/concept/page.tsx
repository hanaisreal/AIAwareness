'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VIDEO_URLS } from '@/constants/videos';
import { MINA_DIALOGUE, SCRIPT_KEY_MAP } from '@/constants/minaScripts';
import MinaDialogue from '@/components/MinaDialogue';

const identityTheftCaseStudies = [
  {
    videoUrl: VIDEO_URLS.IDENTITY_THEFT.CASES.CASE1,
    dialogueKey: SCRIPT_KEY_MAP.VOICE_PHISHING_CASE, 
    title: "금융 사기 목소리 복제",
  },
  {
    videoUrl: VIDEO_URLS.IDENTITY_THEFT.CASES.CASE2,
    dialogueKey: SCRIPT_KEY_MAP.FAMOUS_VOICE_CASE, 
    title: "온라인 계정 탈취 목소리 복제",
  },
];

export default function Part2ConceptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState("어르신"); 
  const [currentInteractionStep, setCurrentInteractionStep] = useState(0);
  const [currentCaseStudyIndex, setCurrentCaseStudyIndex] = useState(0);
  
  const [currentMinaText, setCurrentMinaText] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const caseVideoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  const playMinaAudio = async (text: string) => {
    if (!audioRef.current) return;
    setIsLoadingAudio(true);
    setCurrentMinaText(text);
    try {
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error('Failed to fetch audio for Part 2 Concept');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
      audioRef.current.play();
      audioRef.current.onended = () => {
        setIsLoadingAudio(false);
        setCurrentMinaText(null);
        URL.revokeObjectURL(url);
        advanceStateAfterAudio();
      };
    } catch (error) {
      console.error("Error playing Mina's audio (Part 2 Concept):", error);
      setIsLoadingAudio(false);
      setCurrentMinaText(MINA_DIALOGUE.ERROR_AUDIO_GENERAL.text);
      setTimeout(() => {
        setCurrentMinaText(null);
        advanceStateAfterAudio(); 
      }, 3000);
    }
  };

  const setMinaSpeech = (dialogueKey: string | undefined, interactionStepForAudio: number) => {
    if (!dialogueKey || !MINA_DIALOGUE[dialogueKey]) {
      console.error("Invalid dialogueKey for Part 2 Concept:", dialogueKey);
      setCurrentMinaText("오류: 스크립트를 찾을 수 없습니다.");
      setIsLoadingAudio(false);
      return;
    }
    setCurrentInteractionStep(interactionStepForAudio);
    playMinaAudio(MINA_DIALOGUE[dialogueKey].text);
  };
  
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);

    const videoPlayed = searchParams.get('videoPlayed');
    if (videoPlayed === 'true') {
      setMinaSpeech(SCRIPT_KEY_MAP.COMPREHENSION_QUESTION_P2, 3);
    } else if (currentInteractionStep === 0 && !isLoadingAudio && !currentMinaText) {
      setMinaSpeech(SCRIPT_KEY_MAP.GREETING_P2 || 'PART2_MAIN_INTRO', 0.1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const advanceStateAfterAudio = () => {
    console.log("Part 2 Concept - Advancing state from: ", currentInteractionStep);
    if (currentInteractionStep === 0.1) { // After PART2_MAIN_INTRO
      setCurrentInteractionStep(0.5); // Show button to start concept explanation
    } else if (currentInteractionStep === 1) { // After PART2_CONCEPT_EXPLANATION
        router.push('/scenarios/part2/concept-video');
    } else if (currentInteractionStep === 3) { // After PART2_COMPREHENSION_QUESTION_PROMPT
        setCurrentInteractionStep(4); // Show comprehension choice buttons
    } else if (currentInteractionStep === 5) { // After Comprehension Feedback
        setCurrentInteractionStep(6); // Show button to start case studies intro speech
    } else if (currentInteractionStep === 6.1) { // After PART2_CASE_STUDIES_INTRO speech
        startActualCaseStudies(); // This will set step 7 and play first case intro
    } else if (currentInteractionStep === 7.1) { // After individual case study video intro by Mina
        setShowVideo(true); // Show the video player
    } else if (currentInteractionStep === 8.5) { // After PART2_CASE_STUDIES_OUTRO
        setMinaSpeech(SCRIPT_KEY_MAP.SCENARIOS_INTRO_P2 || 'PART2_EXPERIENCE_INTRO_VOICE_CLONING', 9);
    } else if (currentInteractionStep === 9) { // After PART2_EXPERIENCE_INTRO_VOICE_CLONING
        router.push('/scenarios/part2/scenario1'); 
    }
  };

  const handlePlayConceptExplanation = () => setMinaSpeech(SCRIPT_KEY_MAP.CONCEPT_EXPLANATION_P2, 1);
  
  const handleComprehensionResponse = (understood: boolean) => {
    const dialogueKey = understood 
        ? MINA_DIALOGUE.PART2_COMPREHENSION_FEEDBACK_CORRECT.id 
        : MINA_DIALOGUE.PART2_COMPREHENSION_FEEDBACK_INCORRECT.id;
    setMinaSpeech(dialogueKey, 5);
  };

  const handleStartCaseStudyIntroSpeech = () => {
    setMinaSpeech(MINA_DIALOGUE.PART2_CASE_STUDIES_INTRO.id, 6.1); 
  };

  const startActualCaseStudies = () => {
    setCurrentCaseStudyIndex(0);
    if (identityTheftCaseStudies.length > 0) {
      setMinaSpeech(identityTheftCaseStudies[0].dialogueKey, 7.1); // Introduce first case video
    } else {
      // No case studies, skip to outro
      setMinaSpeech(SCRIPT_KEY_MAP.POST_ALL_CASES_PROMPT_P2 || 'PART2_CASE_STUDIES_OUTRO', 8.5);
    }
  };

  const handleVideoEnd = () => {
    setShowVideo(false);
    const nextCaseIndex = currentCaseStudyIndex + 1;
    if (nextCaseIndex < identityTheftCaseStudies.length) {
      setCurrentCaseStudyIndex(nextCaseIndex);
      setMinaSpeech(identityTheftCaseStudies[nextCaseIndex].dialogueKey, 7.1); // Introduce next video
    } else {
      setMinaSpeech(SCRIPT_KEY_MAP.POST_ALL_CASES_PROMPT_P2 || 'PART2_CASE_STUDIES_OUTRO', 8.5);
    }
  };
  
  const handleSkipAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      if(audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
      audioRef.current.src = '';
    }
    setIsLoadingAudio(false);
    setCurrentMinaText(null);
    advanceStateAfterAudio();
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 via-red-100 to-yellow-100 p-4 text-gray-800">
      <div className={`w-full ${showVideo ? 'max-w-3xl' : 'max-w-md'} mx-auto flex flex-col items-center text-center`}>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-700">Part 2: 목소리 복제 개념</h1>
             <button
                onClick={() => router.push('/scenarios/part2')}
                className="text-gray-500 hover:text-indigo-600 text-2xl transition-colors"
                aria-label="Back to Part 2 Main"
                disabled={isLoadingAudio}
            >
                &times;
            </button>
        </div>

        <MinaDialogue 
              text={currentMinaText}
              isLoadingAudio={isLoadingAudio}
              colorScheme={{
                bg: 'bg-sky-50/80',
                text: 'text-sky-700'
              }}
            />

        {/* Step 0.5: Button to start Concept Explanation */} 
        {currentInteractionStep === 0.5 && !isLoadingAudio && (
          <div className="animate-fade-in w-full space-y-4 p-4 bg-white/80 rounded-xl shadow-xl">
            <h1 className="text-2xl font-bold text-orange-600">딥보이스(목소리 위변조) 알아보기</h1>
            <p className="text-lg">미나의 설명을 듣고 딥보이스에 대해 자세히 알아볼까요?</p>
            <button onClick={handlePlayConceptExplanation} 
                    className="w-full py-3 px-6 bg-orange-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out">
              개념 설명 듣기
            </button>
          </div>
        )}
        
        {/* Step 4: Comprehension Question Options */} 
        {currentInteractionStep === 4 && !isLoadingAudio && (
             <div className="animate-fade-in w-full space-y-4 p-4 bg-white/80 rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold text-orange-600">이해가 되셨나요?</h2>
                {/* Question text was spoken by Mina */}
                <div className="flex space-x-4">
                    <button onClick={() => handleComprehensionResponse(true)} className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">네, 이해됐어요</button>
                    <button onClick={() => handleComprehensionResponse(false)} className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">아니요, 조금 더...</button>
                </div>
            </div>
        )}

        {/* Step 6: Button to start Case Studies Intro Speech */} 
        {currentInteractionStep === 6 && !isLoadingAudio && (
            <div className="animate-fade-in w-full space-y-4 p-4 bg-white/80 rounded-xl shadow-xl">
                <h1 className="text-2xl font-bold text-orange-600">실제 사례 학습 (목소리 위변조)</h1>
                <p className="text-lg">딥보이스 관련 실제 사례들을 미나의 설명과 함께 알아볼게요.</p>
                <button onClick={handleStartCaseStudyIntroSpeech} 
                        className="w-full py-3 px-6 bg-orange-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out">
                  사례 학습 소개 듣기
                </button>
            </div>
        )}

        {/* Step 7.1 (Video Player) - Shown after Mina introduces a case study video */} 
        {showVideo && currentInteractionStep === 7.1 && identityTheftCaseStudies[currentCaseStudyIndex] && (
            <div className="animate-fade-in w-full space-y-4 p-1 bg-black rounded-xl shadow-xl">
                <h3 className="text-white text-center py-2 text-lg">{identityTheftCaseStudies[currentCaseStudyIndex].title}</h3>
                <video ref={caseVideoRef} src={identityTheftCaseStudies[currentCaseStudyIndex]?.videoUrl} controls autoPlay onEnded={handleVideoEnd} className="w-full rounded" />
                <button onClick={handleVideoEnd} className="mt-2 w-full py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                    영상 그만보기 / 다음 사례 설명듣기
                </button>
            </div>
        )}
        
        {/* No direct scenario selection buttons here; flow continues to /scenarios/part2/scenario1 */}

      </div>
      <style jsx global>{`
        .animate-fade-in { animation: fadeIn 0.7s ease-out; }
        @keyframes fadeIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
 