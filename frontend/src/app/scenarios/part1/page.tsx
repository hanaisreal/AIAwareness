'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VIDEO_URLS } from '@/constants/videos';
import { commonStyles } from '@/styles/common';
import PageLayout from '@/components/layouts/PageLayout';
import MinaAudioPlayer from '@/components/MinaAudioPlayer';
import GeneratedImageDisplay from '@/components/GeneratedImageDisplay';

type Section = 'concept' | 'cases' | 'scenarios';
type CaseNumber = 1 | 2 | 3;
type ScenarioNumber = 1 | 2;

const PART1_SCRIPTS = {
  concept: {
    text: "'가짜 뉴스'라는 말, 들어보셨죠? 가짜 뉴스는 오해의 소지가 있는 정보를 퍼뜨리는 것을 의미합니다. 요즘은 얼굴과 목소리까지 그럴듯하게 바꿀 수 있어서 더 주의가 필요해요. 어떤 식으로 만들어지는지 영상을 통해 함께 알아볼게요.",
    audioSrc: "/part1/part1_script_1.mp3"
  },
  case1: {
    text: "좋아요! 그럼 구체적인 사례들을 하나씩 살펴볼게요. 우선 첫 번째 사례는 김정은과 김여정이 뮤직비디오에 나오는 가짜 영상이에요.",
    audioSrc: "/part1/part1_script_2.mp3"
  },
  case2: {
    text: "재미로 만들어졌지만, 이런 기술이 악용되면 문제가 될 수 있겠죠? 다음 영상은 조금 더 심각한 사례예요.",
    audioSrc: "/part1/part1_script_3.mp3"
  },
  case3: {
    text: "2022년, 젤렌스키 우크라이나 대통령이 항복을 선언하는 영상이 퍼졌는데요, 사실은 조작된 영상이었습니다. 정치적으로 큰 혼란을 일으킬 수 있는 위험한 사례예요. 이어서 볼 영상은 젤렌스키 대통령이 트럼프 전 대통령을 주먹으로 때리는 장면이 담긴 가짜 영상입니다.",
    audioSrc: "/part1/part1_script_4.mp3"
  },
  case3End: {
    text: "SNS를 통해 급속히 퍼지며 여론을 왜곡하는 데 사용되었어요. 이렇게 딥페이크는 정치 선전이나 조작에 악용될 수 있습니다.",
    audioSrc: "/part1/part1_script_5.mp3"
  },
  scenario1Intro: {
    text: "이번엔 나에게 이런 기술이 적용된다면 어떤 일이 생길지 체험해볼게요. 먼저, 본인의 사진을 업로드해주세요.",
    audioSrc: "/part1/part1_script_6.mp3"
  },
  scenario1Description: {
    text: "첫 번째 시나리오는 당신이 로또 1등에 당첨되어 기사에 나온 상황이에요.",
    audioSrc: "/part1/part1_script_7.mp3"
  },
  scenario1Conclusion: {
    text: "이런 식으로 사람들의 관심을 끌기 위해 허위 기사가 만들어질 수 있어요.",
    audioSrc: "/part1/part1_script_8.mp3"
  },
  scenario2Intro: {
    text: "이번엔 정반대 상황이에요. 당신이 거액의 겟돈을 들고 도망쳤다가 결국 구속됐다는 내용의 가짜 기사예요.",
    audioSrc: "/part1/part1_script_9.mp3"
  },
  scenario2Conclusion: {
    text: "이처럼 전혀 사실이 아닌 내용이 진짜처럼 보이면 큰 피해로 이어질 수 있죠.",
    audioSrc: "/part1/part1_script_10.mp3"
  }
};

export default function Part1Page() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<Section>('concept');
  const [currentCase, setCurrentCase] = useState<CaseNumber>(1);
  const [currentScenario, setCurrentScenario] = useState<ScenarioNumber>(1);
  const [userName, setUserName] = useState("어르신");
  const [showVideo, setShowVideo] = useState(false);
  const [showCase3Explanation, setShowCase3Explanation] = useState(false);
  const [scenarioStep, setScenarioStep] = useState<'intro' | 'description' | 'video' | 'conclusion'>('intro');
  const [imageUploaded, setImageUploaded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) setUserName(storedName);
  }, []);

  const handleNextCase = () => {
    if (currentCase < 3) {
      setCurrentCase((prev) => (prev + 1) as CaseNumber);
      setShowVideo(false);
    } else if (showCase3Explanation) {
      setCurrentSection('scenarios');
      setShowVideo(false);
      setImageUploaded(false);
      setScenarioStep('intro');
    } else {
      setShowCase3Explanation(true);
    }
  };

  const handleNextScenario = () => {
    if (currentScenario === 1) {
      setCurrentScenario(2);
      setScenarioStep('intro');
      setShowVideo(false);
    } else {
      router.push('/scenarios/part2');
    }
  };

  const handleContinue = () => {
    setShowVideo(true);
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    setUploadedImage(file);
    
    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('user_image', file);
      
      // First, initiate the faceswap with POST method
      const initiateResponse = await fetch(`/api/initiate-faceswap?section=FAKE_NEWS&scenario=SCENARIO${currentScenario}&gender=male`, {
        method: 'POST',
        body: formData
      });
      
      if (!initiateResponse.ok) {
        const errorData = await initiateResponse.json().catch(() => ({ detail: '이미지 변환을 시작할 수 없습니다.' }));
        throw new Error(errorData.detail || '이미지 변환을 시작할 수 없습니다.');
      }
      
      const data = await initiateResponse.json();
      const taskId = data.akool_task_id;
      
      if (!taskId) {
        throw new Error('작업 ID를 받지 못했습니다.');
      }
      
      console.log('Initiated faceswap with task_id:', taskId);
      
      // Poll for status
      let attempts = 0;
      const maxAttempts = 30; // 1 minute maximum (2 seconds * 30)
      
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/faceswap-status/${taskId}`);
          if (!statusResponse.ok) {
            throw new Error('상태 확인 중 오류가 발생했습니다.');
          }
          
          const statusData = await statusResponse.json();
          console.log('Faceswap status:', statusData);
          
          if (statusData.status_details?.faceswap_status === 2) {
            // Success! Move to description step
            setScenarioStep('description');
            setIsLoading(false);
            return;
          } else if (statusData.status_details?.faceswap_status === 3) {
            // Check if we have a URL in the response
            const imageUrl = statusData.status_details?.url;
            if (imageUrl) {
              console.log('Generated image URL:', imageUrl);
              router.push(`/generated-image?url=${encodeURIComponent(imageUrl)}&fromScenario=${currentScenario}`);
              return;
            }
            throw new Error(statusData.status_details?.msg || '이미지 생성 중 오류가 발생했습니다.');
          }
          
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('이미지 생성 시간이 초과되었습니다.');
          }
          
          // Continue polling
          setTimeout(pollStatus, 2000);
        } catch (error) {
          console.error('Error polling status:', error);
          setError(error instanceof Error ? error.message : '이미지 생성 중 오류가 발생했습니다.');
          setIsLoading(false);
        }
      };
      
      // Start polling
      pollStatus();
      
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      setError(error instanceof Error ? error.message : '이미지 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleScenarioContinue = () => {
    if (currentScenario === 1) {
      if (scenarioStep === 'description') {
        setShowVideo(true);
      } else if (scenarioStep === 'conclusion') {
        setCurrentScenario(2);
        setScenarioStep('intro');
        setShowVideo(false);
      }
    } else {
      if (scenarioStep === 'description') {
        setShowVideo(true);
      } else if (scenarioStep === 'conclusion') {
        router.push('/scenarios/part2');
      }
    }
  };

  const handleVideoEnd = () => {
    setScenarioStep('conclusion');
    setShowVideo(false);
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'concept':
        return (
          <div className="animate-fade-in w-full space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-orange-600">개념: 딥페이크란?</h1>
            {!showVideo ? (
              <MinaAudioPlayer
                audioSrc={PART1_SCRIPTS.concept.audioSrc}
                text={PART1_SCRIPTS.concept.text}
                onContinue={handleContinue}
              />
            ) : (
              <>
                <div className="aspect-video w-full">
                  <video 
                    src={VIDEO_URLS.FAKE_NEWS.CONCEPT.MAIN}
                    controls
                    className="w-full rounded-lg shadow-xl"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <button
                  onClick={() => {
                    setCurrentSection('cases');
                    setShowVideo(false);
                  }}
                  className="w-full py-3 px-6 bg-orange-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out mt-4"
                >
                  다음으로
                </button>
              </>
            )}
          </div>
        );

      case 'cases':
        if (currentCase === 3 && showCase3Explanation) {
          return (
            <div className="animate-fade-in w-full space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold text-orange-600">사례 영상 {currentCase}</h1>
              <MinaAudioPlayer
                audioSrc={PART1_SCRIPTS.case3End.audioSrc}
                text={PART1_SCRIPTS.case3End.text}
                onContinue={handleNextCase}
                buttonText="체험하기"
              />
            </div>
          );
        }

        return (
          <div className="animate-fade-in w-full space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-orange-600">사례 영상 {currentCase}</h1>
            {!showVideo ? (
              <MinaAudioPlayer
                audioSrc={PART1_SCRIPTS[`case${currentCase}`].audioSrc}
                text={PART1_SCRIPTS[`case${currentCase}`].text}
                onContinue={handleContinue}
              />
            ) : (
              <>
                <div className="aspect-video w-full">
                  <video 
                    src={VIDEO_URLS.FAKE_NEWS.CASES[`CASE${currentCase}`]}
                    controls
                    className="w-full rounded-lg shadow-xl"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <button
                  onClick={handleNextCase}
                  className="w-full py-3 px-6 bg-orange-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out mt-4"
                >
                  {currentCase < 3 ? '다음으로' : '다음으로'}
                </button>
              </>
            )}
          </div>
        );

      case 'scenarios':
        return (
          <div className="animate-fade-in w-full space-y-4">
            <h1 className={commonStyles.heading}>딥페이크/딥보이스 체험 {currentScenario}</h1>
            <p className={commonStyles.subheading}>
              {userName}님, 반가워요!
            </p>
            {renderScenarioContent()}
          </div>
        );
    }
  };

  const renderScenarioContent = () => {
    switch (scenarioStep) {
      case 'intro':
        return (
          <MinaAudioPlayer
            audioSrc={currentScenario === 1 ? PART1_SCRIPTS.scenario1Intro.audioSrc : PART1_SCRIPTS.scenario2Intro.audioSrc}
            text={currentScenario === 1 ? PART1_SCRIPTS.scenario1Intro.text : PART1_SCRIPTS.scenario2Intro.text}
            onContinue={handleImageUpload}
          />
        );
      case 'description':
        return (
          <MinaAudioPlayer
            audioSrc={currentScenario === 1 ? PART1_SCRIPTS.scenario1Description.audioSrc : PART1_SCRIPTS.scenario2Intro.audioSrc}
            text={currentScenario === 1 ? PART1_SCRIPTS.scenario1Description.text : PART1_SCRIPTS.scenario2Intro.text}
            onContinue={() => setShowVideo(true)}
          />
        );
      case 'video':
        return (
          <div className="flex flex-col items-center space-y-4">
            {showVideo ? (
              <GeneratedImageDisplay
                imageUrl={`/api/faceswap?scenario=FAKE_NEWS/SCENARIO${currentScenario}`}
                onVideoEnd={() => {
                  setShowVideo(false);
                  setScenarioStep('conclusion');
                }}
              />
            ) : (
              <button
                onClick={() => setShowVideo(true)}
                className="w-full max-w-[200px] px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                생성된 이미지 보기
              </button>
            )}
          </div>
        );
      case 'conclusion':
        return (
          <MinaAudioPlayer
            audioSrc={currentScenario === 1 ? PART1_SCRIPTS.scenario1Conclusion.audioSrc : PART1_SCRIPTS.scenario2Conclusion.audioSrc}
            text={currentScenario === 1 ? PART1_SCRIPTS.scenario1Conclusion.text : PART1_SCRIPTS.scenario2Conclusion.text}
            onContinue={handleNextScenario}
            buttonText={currentScenario === 1 ? "다음 시나리오" : "다음으로"}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PageLayout>
      {renderContent()}
    </PageLayout>
  );
} 