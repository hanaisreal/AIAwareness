'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VIDEO_URLS } from '@/constants/videos'; // Assuming this path
// import CaseStudies from '@/components/CaseStudies'; // No longer using CaseStudies component here

// TODO: Replace with actual video URL from constants or props
// const CONCEPT_VIDEO_URL = VIDEO_URLS.FAKE_NEWS.CONCEPT.MAIN;

// Updated MINA_SCRIPTS to point to local MP3 files
const MINA_SCRIPTS = {
  // For scripts with names, ensure you have generic MP3 versions or handle them differently
  CONCEPT_EXPLANATION_GENERIC: '/part1/CONCEPT_EXPLANATION_GENERIC.mp3', // Assumes generic version without name
  COMPREHENSION_QUESTION: '/part1/COMPREHENSION_QUESTION.mp3',
  RESPONSE_YES: '/part1/RESPONSE_YES.mp3',
  RESPONSE_NO: '/part1/RESPONSE_NO.mp3',
  CASE_STUDY_1_AUDIO: '/part1/CASE_STUDY_1_AUDIO.mp3',
  CASE_STUDY_2_AUDIO: '/part1/CASE_STUDY_2_AUDIO.mp3',
  CASE_STUDY_3_AUDIO: '/part1/CASE_STUDY_3_AUDIO.mp3',
  POST_ALL_CASES_PROMPT: '/part1/POST_ALL_CASES_PROMPT.mp3',
  INTRO_SCENARIOS_AUDIO_GENERIC: '/part1/INTRO_SCENARIOS_AUDIO_GENERIC.mp3', // Assumes generic version without name
};

const fakeNewsCaseStudies = [
  {
    // title: "사례 1: 김정은, 김여정 로제 아파트 합성", // Title for internal reference, not displayed
    videoUrl: VIDEO_URLS.FAKE_NEWS.CASES.CASE1,
    minaScriptKey: "CASE_STUDY_1_AUDIO" as keyof typeof MINA_SCRIPTS,
  },
  {
    // title: "사례 2: 허위 정보 유포",
    videoUrl: VIDEO_URLS.FAKE_NEWS.CASES.CASE2,
    minaScriptKey: "CASE_STUDY_2_AUDIO" as keyof typeof MINA_SCRIPTS,
  },
  {
    // title: "사례 3: 유명인 이미지 도용",
    videoUrl: VIDEO_URLS.FAKE_NEWS.CASES.CASE3,
    minaScriptKey: "CASE_STUDY_3_AUDIO" as keyof typeof MINA_SCRIPTS,
  },
];

export default function Part1ScenariosPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // For reading query parameters
  const [userName, setUserName] = useState("어르신"); 
  const [currentInteractionStep, setCurrentInteractionStep] = useState(0); // 0: initial, 1: playing_concept_audio, 2: show_video, 3: playing_question_audio, 4: show_question_options, 5: playing_response_audio, 6: show_cases_scenarios
  const [currentCaseStudyIndex, setCurrentCaseStudyIndex] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false); // Will be set briefly while audio loads
  const audioRef = useRef<HTMLAudioElement>(null);
  const caseVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);

    const videoPlayed = searchParams.get('videoPlayed');
    if (videoPlayed === 'true' && currentInteractionStep < 3) {
      // Use COMPREHENSION_QUESTION directly as it's a path now
      playLocalAudio(MINA_SCRIPTS.COMPREHENSION_QUESTION, 3);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // userName is not needed here as generic audios are used for personalized parts

  useEffect(() => {
    if (audioSrc && audioRef.current) {
      const audioElement = audioRef.current;
      audioElement.src = audioSrc;
      audioElement.load(); 
      // Autoplay can be tricky, ensure user interaction has occurred on the page before this step
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.then(_ => {
          // Automatic playback started!
          setIsLoadingAudio(false); // Stop loading indicator once playback starts
        }).catch(error => {
          console.error("Audio play error or interrupted:", error);
          setIsLoadingAudio(false); // Stop loading indicator even if play fails
          // Potentially show a play button if autoplay fails due to browser policy
          // For now, we assume it will play or fail silently after user interaction
        });
      }

      const handleAudioEnd = () => {
        setAudioSrc(null); // Clear src to allow re-playing the same audio if needed
        setIsLoadingAudio(false);

        if (currentInteractionStep === 1) {
            router.push('/scenarios/part1/concept-video');
        } else if (currentInteractionStep === 3) {
            setCurrentInteractionStep(4); 
        } else if (currentInteractionStep === 5) {
            setCurrentInteractionStep(6); 
        } else if (currentInteractionStep === 8.1) {
            const nextCaseIndex = currentCaseStudyIndex + 1;
            if (nextCaseIndex < fakeNewsCaseStudies.length) {
                setCurrentCaseStudyIndex(nextCaseIndex);
                setCurrentInteractionStep(8);
            } else {
                playLocalAudio(MINA_SCRIPTS.POST_ALL_CASES_PROMPT, 8.5);
            }
        } else if (currentInteractionStep === 8.5) {
             playLocalAudio(MINA_SCRIPTS.INTRO_SCENARIOS_AUDIO_GENERIC, 9);
        } else if (currentInteractionStep === 9) {
            setCurrentInteractionStep(10);
        }
      };
      audioElement.addEventListener('ended', handleAudioEnd);
      // Add an error listener too
      const handleAudioError = (e: Event) => {
        console.error("Audio element error:", e);
        setIsLoadingAudio(false);
        setAudioSrc(null);
        // Decide on next step if audio fails to load/play
        // This fallback is similar to API failure, but might need adjustment for local files
        if (currentInteractionStep === 1) router.push('/scenarios/part1/concept-video');
        else if (currentInteractionStep === 3) setCurrentInteractionStep(4);
        else if (currentInteractionStep === 5) setCurrentInteractionStep(6);
        else if (currentInteractionStep === 8.1) {
            const nextCaseIndex = currentCaseStudyIndex + 1;
            if (nextCaseIndex < fakeNewsCaseStudies.length) {
                setCurrentCaseStudyIndex(nextCaseIndex);
                setCurrentInteractionStep(8);
            } else {
                playLocalAudio(MINA_SCRIPTS.POST_ALL_CASES_PROMPT, 8.5);
            }
        } else if (currentInteractionStep === 8.5) playLocalAudio(MINA_SCRIPTS.INTRO_SCENARIOS_AUDIO_GENERIC, 9);
        else if (currentInteractionStep === 9) setCurrentInteractionStep(10);
      };
      audioElement.addEventListener('error', handleAudioError);

      return () => {
        audioElement.removeEventListener('ended', handleAudioEnd);
        audioElement.removeEventListener('error', handleAudioError);
      };
    }
  }, [audioSrc, currentInteractionStep, router, currentCaseStudyIndex]); // Added currentCaseStudyIndex to deps for error fallback

  // New function to play local audio files
  const playLocalAudio = (audioPath: string, audioPlayingStep: number) => {
    console.log(`Playing local audio: ${audioPath} for step ${audioPlayingStep}`);
    setCurrentInteractionStep(audioPlayingStep);
    setIsLoadingAudio(true); // Indicate that we are preparing to play audio
    setAudioSrc(audioPath); 
    // isLoadingAudio will be set to false once audio starts playing or errors out in the useEffect for audioRef
  };

  const handlePlayConceptExplanation = () => playLocalAudio(MINA_SCRIPTS.CONCEPT_EXPLANATION_GENERIC, 1);
  
  const handleComprehensionResponse = (understood: boolean) => {
    const scriptPath = understood ? MINA_SCRIPTS.RESPONSE_YES : MINA_SCRIPTS.RESPONSE_NO;
    playLocalAudio(scriptPath, 5);
  };

  const handleStartCaseStudyFlow = () => {
    // Go directly to showing the first case study video
    setCurrentCaseStudyIndex(0);
    setCurrentInteractionStep(8);
  };
  
  const handleProceedToExplanation = () => {
    if (currentInteractionStep === 8 && !isLoadingAudio) {
        if (currentCaseStudyIndex < fakeNewsCaseStudies.length) {
            const currentCaseScriptKey = fakeNewsCaseStudies[currentCaseStudyIndex].minaScriptKey;
            playLocalAudio(MINA_SCRIPTS[currentCaseScriptKey], 8.1);
        } else {
            console.warn("handleProceedToExplanation called with invalid currentCaseStudyIndex");
            playLocalAudio(MINA_SCRIPTS.POST_ALL_CASES_PROMPT, 8.5);
        }
    }
  };

  const navigateToScenario = (id: number) => router.push(`/scenarios/part1/scenario${id}`);
  const replayConcept = () => {
    router.push('/scenarios/part1'); 
    setCurrentInteractionStep(0); 
  }
  const replayVideo = () => router.push('/scenarios/part1/concept-video');

  let mainButtonText = "";
  let mainButtonAction = () => {};

  if (currentInteractionStep === 0) {
    mainButtonText = "미나 설명 듣기";
    mainButtonAction = handlePlayConceptExplanation;
  } else if (currentInteractionStep === 6) {
    mainButtonText = "실제 사례 학습 시작하기";
    mainButtonAction = handleStartCaseStudyFlow;
  }

  // Show Mina GIF by default, hide for step 8 (video display)
  const showMinaGif = currentInteractionStep !== 8;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-4 text-gray-800">
      {/* Main content area that might change width based on step */} 
      <div className={`w-full ${currentInteractionStep === 8 ? 'max-w-3xl' : 'max-w-md'} mx-auto flex flex-col items-center text-center`}>
        
        {showMinaGif && (
          <img src="/talking.gif" alt="안내 캐릭터 미나" className="w-72 h-auto mb-6" /> 
        )}
        <audio ref={audioRef} />

        {/* Step 0: Initial button to hear concept */} 
        {currentInteractionStep === 0 && (
          <div className="animate-fade-in w-full space-y-4 p-4 bg-white/80 rounded-xl shadow-xl">
            <h1 className="text-2xl font-bold text-orange-600">Part 1: 가짜 뉴스</h1>
            <p className="text-lg">미나의 설명을 듣고 딥페이크 가짜 뉴스에 대해 알아볼까요?</p>
            <button onClick={mainButtonAction} disabled={isLoadingAudio} 
                    className="w-full py-3 px-6 bg-orange-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out disabled:opacity-60">
              {isLoadingAudio ? "음성 준비 중..." : mainButtonText}
            </button>
          </div>
        )}

        {/* Step 1 (Mina concept audio), 3 (Mina question audio), 5 (Mina response audio), 8.1 (Mina case explanation audio), 8.5 (POST_ALL_CASES_PROMPT), 9 (Mina scenario intro audio) */} 
        {[1, 3, 5, 8.1, 8.5, 9].includes(currentInteractionStep) && isLoadingAudio && (
          <p className="text-orange-600 animate-pulse text-lg font-medium p-4 bg-white/80 rounded-xl shadow-xl">
            미나가 말하고 있어요...
          </p>
        )}
        
        {/* Step 4: Comprehension Question Options */} 
        {currentInteractionStep === 4 && (
             <div className="animate-fade-in w-full space-y-4 p-4 bg-white/80 rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold text-orange-600">이해가 되셨나요?</h2>
                <p className="text-gray-700">딥페이크 가짜 뉴스가 무엇인지 이해되셨는지 알려주세요.</p>
                <div className="flex space-x-4">
                    <button onClick={() => handleComprehensionResponse(true)} className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">네, 이해됐어요</button>
                    <button onClick={() => handleComprehensionResponse(false)} className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">아니요, 조금 더...</button>
                </div>
            </div>
        )}
        
        {/* Step 6: Button to start Case Studies */} 
        {currentInteractionStep === 6 && (
            <div className="animate-fade-in w-full space-y-4 p-4 bg-white/80 rounded-xl shadow-xl">
                <h2 className="text-xl font-semibold text-orange-600">실제 사례 학습</h2>
                <p className="text-gray-700">미나의 안내에 따라 실제 사례들을 영상으로 확인하고, 각 사례가 왜 위험한지 설명을 들어보세요.</p>
                <button onClick={mainButtonAction} disabled={isLoadingAudio} 
                        className="w-full py-3 px-6 bg-orange-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out disabled:opacity-60">
                {isLoadingAudio ? "음성 준비 중..." : mainButtonText}
                </button>
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <button onClick={replayConcept} className="w-full mb-2 py-2.5 px-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm">개념 설명 다시 듣기</button>
                    <button onClick={replayVideo} className="w-full py-2.5 px-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm">개념 영상 다시 보기</button>
                </div>
            </div>
        )}

        {/* Step 8: Display Current Case Study Video (Mina GIF hidden) */} 
        {currentInteractionStep === 8 && currentCaseStudyIndex < fakeNewsCaseStudies.length && (
            <div className="animate-fade-in w-full space-y-4 p-4">
                <h3 className="text-xl font-semibold text-orange-600 mb-2">
                    사례 영상 {currentCaseStudyIndex + 1}
                </h3>
                <video 
                  ref={caseVideoRef} 
                  src={fakeNewsCaseStudies[currentCaseStudyIndex].videoUrl} 
                  controls 
                  autoPlay 
                  onEnded={handleProceedToExplanation}
                  className="w-full rounded-lg shadow-2xl aspect-video mb-6"
                >
                  Your browser does not support the video tag.
                </video>
                <button 
                  onClick={handleProceedToExplanation}
                  disabled={isLoadingAudio}
                  className="w-full py-3 px-6 bg-orange-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out disabled:opacity-60"
                >
                  {isLoadingAudio ? "음성 준비 중..." : "해설 듣기"}
                </button>
            </div>
        )}
        
        {/* Step 10: Show scenario navigation buttons */} 
        {currentInteractionStep === 10 && (
          <div className="animate-fade-in w-full space-y-6 p-4 bg-white/80 rounded-xl shadow-xl">
            <h2 className="text-xl font-semibold text-orange-600">체험 활동</h2>
            <p className="text-gray-700">이제 직접 딥페이크 기술을 체험해볼 시간입니다. 아래 활동을 선택해주세요.</p>
            
            <button onClick={() => navigateToScenario(1)} className="w-full py-3 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold">
                얼굴 교체 체험하기
            </button>
            <button onClick={() => navigateToScenario(2)} className="w-full py-3 px-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold">
                다른 유형 체험 (준비 중)
            </button>
            
            <div className="mt-6 pt-6 border-t border-gray-300">
                <p className="text-sm text-gray-600 mb-2">이전 내용 다시보기:</p>
                <div className="flex space-x-2">
                    <button onClick={replayConcept} className="flex-1 py-2.5 px-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm">개념 설명</button>
                    <button onClick={replayVideo} className="flex-1 py-2.5 px-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm">개념 영상</button>
                    <button onClick={handleStartCaseStudyFlow} className="flex-1 py-2.5 px-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm">사례 학습 다시</button> 
                </div>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        .animate-fade-in { animation: fadeIn 0.7s ease-out; }
        @keyframes fadeIn { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-pulse { animation: pulse 1.5s infinite ease-in-out; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  );
} 