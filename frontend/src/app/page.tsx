'use client'
import { useState, useEffect, useCallback } from 'react'
import UserDataInput from '@/components/UserDataInput'
import EducationalVideo from '@/components/EducationalVideo'
import DeepfakeExperiencePlayer from '@/components/DeepfakeExperiencePlayer'
import ReflectionForm from '@/components/ReflectionForm'
import { uploadVoice, initiateFaceswapVideo, getFaceswapVideoStatus, getElevenLabsIntroAudio } from '@/lib/api'
import ListenToClonedVoice from '@/components/ListenToClonedVoice'

const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLS = 60;
//const ELEVEN_LABS_NARRATOR_TEXT = "Hello, this is a short introduction.";
const ELEVEN_LABS_NARRATOR_TEXT = "딥페이크 영상은 누구나 손쉽게 만들 수 있는데요.";
// const ELEVEN_LABS_NARRATOR_TEXT = "딥페이크 영상은 누구나 손쉽게 만들 수 있는데요.";
// const USER_VOICE_SCRIPT = "안녕하세요. 지금부터 목소리 녹음을 시작하겠습니다. 오늘은 날씨가 참 좋네요. 이런 날에는 산책을 하고 싶어집니다. 제가 요즘 즐겨 하는 취미는 책 읽기입니다. 새로운 지식을 배우는 즐거움이 큽니다. 제 목소리가 잘 녹음되기를 바랍니다. 감사합니다.";
const USER_VOICE_SCRIPT = "안녕하세요. 지금부터 목소리 녹음을 시작하겠습니다. 오늘은 날씨가 참 좋네요. 이런 날에는 산책을 하고 싶어집니다. 제가 요즘 즐겨 하는 취미는 책 읽기입니다. 새로운 지식을 배우는 즐거움이 큽니다. 제 목소리가 잘 녹음되기를 바랍니다. 감사합니다.";
const RECORDING_SCRIPT_KOREAN = "안녕하세요. 지금 제 목소리를 녹음하고 있습니다. 이 목소리가 어떻게 복제될지 기대되네요. AI 기술은 정말 놀랍습니다.";
const MIN_POLLS_FOR_STATUS_2_SUCCESS = 3;

export default function Home() {
  const [currentView, setCurrentView] = useState('welcome');
  const [step, setStep] = useState(1)
  const [userImageFile, setUserImageFile] = useState<File | null>(null)
  const [userClonedVoiceId, setUserClonedVoiceId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("참여자")
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [narratorIntroAudioUrl, setNarratorIntroAudioUrl] = useState<string | null>(null)
  const [userScriptAudioUrl, setUserScriptAudioUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [akoolTaskId, setAkoolTaskId] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [pollingMessage, setPollingMessage] = useState<string | null>(null)

  const [showNextButtonAfterEduVideo, setShowNextButtonAfterEduVideo] = useState(false);

  console.log("[Home Render] Step:", step, "isProcessing:", isProcessing, "akoolTaskId:", akoolTaskId, "genURL:", generatedVideoUrl, "pollCount:", pollCount, "processingMsg:", processingMessage, "pollingMsg:", pollingMessage, "error:", error);

  const handleImageUploadComplete = (imageFile: File) => {
    setUserImageFile(imageFile);
    setProcessingMessage("사진 업로드 완료. 다음은 음성 녹음 및 복제 단계입니다.");
    setError(null);
    setStep(2);
  };

  const handleVoiceRecordedAndClone = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setProcessingMessage("음성 파일 업로드 및 복제 중...");
    setError(null);
    try {
      const fileName = `${userName}_voice_${Date.now()}.webm`;
      const voiceId = await uploadVoice(audioBlob, fileName);
      if (voiceId && typeof voiceId === 'string') {
        setUserClonedVoiceId(voiceId);
        console.log("[handleVoiceRecordedAndClone] Voice ID successfully generated and set:", voiceId);
        setProcessingMessage("음성 복제 완료. 다음은 원본 교육 영상 시청 단계입니다.");
        setError(null);
        setStep(3);
      } else {
        throw new Error("음성 복제 후 유효한 voiceId를 받지 못했습니다.");
      }
    } catch (err: any) {
      console.error("Voice cloning failed:", err);
      setError("음성 복제 실패: " + (err.message || "알 수 없는 오류"));
      setProcessingMessage("음성 복제에 실패했습니다. 다시 시도해주세요.");
    }
    setIsProcessing(false);
  };

  const handleEducationalVideoComplete = () => {
    console.log("[handleEducationalVideoComplete] Educational video finished.");
    setShowNextButtonAfterEduVideo(true);
  };

  const handleProceedToListenClonedVoice = async () => {
    if (!userClonedVoiceId) {
      setError("복제된 음성 ID가 없어 사용자 스크립트 음성을 생성할 수 없습니다. 2단계 음성 복제를 확인해주세요.");
      setStep(2); 
      return;
    }

    console.log("[handleProceedToListenClonedVoice] Proceeding to generate user script audio.");
    setShowNextButtonAfterEduVideo(false);
    setIsProcessing(true);
    setError(null);
    setProcessingMessage("사용자 스크립트 음성 생성 중...");
    setUserScriptAudioUrl(null); 

    try {
      console.log(`[handleProceedToListenClonedVoice] Generating audio for USER_VOICE_SCRIPT with voice ID: ${userClonedVoiceId}`);
      const scriptAudioResponse = await getElevenLabsIntroAudio(USER_VOICE_SCRIPT, userClonedVoiceId);
      
      if (scriptAudioResponse && scriptAudioResponse.audioUrl) {
        setUserScriptAudioUrl(scriptAudioResponse.audioUrl);
        console.log("[handleProceedToListenClonedVoice] User script audio URL set:", scriptAudioResponse.audioUrl);
        setProcessingMessage(null); // Clear "generating" message
        setStep(4); 
      } else {
        throw new Error("사용자 스크립트 음성 URL을 받지 못했습니다 (API 응답 확인 필요).");
      }
    } catch (err: any) {
      console.error("[handleProceedToListenClonedVoice] User script audio generation failed:", err);
      setError("사용자 스크립트 음성 생성 실패: " + err.message);
      setProcessingMessage("사용자 스크립트 음성 생성에 실패했습니다.");
    }
    setIsProcessing(false);
  };

  const handlePrepareDeepfakeScenario = async () => {
    if (!userImageFile) {
      setError("이미지 파일이 필요합니다. 1단계에서 업로드해주세요.");
      setStep(1);
      return;
    }
    if (!userClonedVoiceId) {
      setError("복제된 음성 ID가 필요합니다. 2단계에서 음성 녹음 및 복제를 완료해주세요.");
      setStep(2);
      return;
    }

    setStep(5);
    setIsProcessing(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setAkoolTaskId(null);
    setPollCount(0);
    setPollingMessage(null);
    setProcessingMessage("준비 중...");
    setNarratorIntroAudioUrl(null);
    setUserScriptAudioUrl(null);

    let narratorAudioFailed = false;
    try {
      if (!userClonedVoiceId) {
        console.error("[handlePrepareDeepfakeScenario] User Cloned Voice ID is null. Cannot generate narrator audio.");
        throw new Error("사용자 음성 ID가 없습니다. 내레이션 음성을 생성할 수 없습니다.");
      }
      console.log(`[handlePrepareDeepfakeScenario] Generating narrator audio with text: \"${ELEVEN_LABS_NARRATOR_TEXT}\" and voice ID: ${userClonedVoiceId}`);
      setProcessingMessage("내레이션 음성 생성 중 (사용자 목소리)...");
      const narratorResponse = await getElevenLabsIntroAudio(ELEVEN_LABS_NARRATOR_TEXT, userClonedVoiceId);
      if (narratorResponse && narratorResponse.audioUrl) {
        setNarratorIntroAudioUrl(narratorResponse.audioUrl);
        console.log("[handlePrepareDeepfakeScenario] Narrator intro audio URL set (user voice):", narratorResponse.audioUrl);
      } else {
        throw new Error("내레이션 음성 URL을 받지 못했습니다 (API 응답 확인 필요).");
      }
    } catch (err: any) {
      console.error("[handlePrepareDeepfakeScenario] Narrator audio generation failed (user voice):", err);
      setError("내레이션 음성 생성 실패 (사용자 목소리): " + err.message);
      setProcessingMessage("내레이션 음성 생성에 실패했습니다 (사용자 목소리).");
      narratorAudioFailed = true;
    }

    try {
      console.log("[handlePrepareDeepfakeScenario] Initiating faceswap video...");
      setProcessingMessage(narratorAudioFailed ? "내레이션 음성 실패. 딥페이크 영상 생성 시도 중..." : "내레이션 음성 완료. 딥페이크 영상 생성 중...");
      if (!userImageFile) {
        console.error("[handlePrepareDeepfakeScenario] User image file is null. Cannot initiate faceswap.");
        throw new Error("사용자 이미지가 없어 얼굴 변환을 시작할 수 없습니다.");
      }
      const faceswapResponse = await initiateFaceswapVideo(userImageFile);
      console.log("[handlePrepareDeepfakeScenario] Faceswap Response from initiateFaceswapVideo:", faceswapResponse);

      if (faceswapResponse.direct_url) {
        console.log("[handlePrepareDeepfakeScenario] Akool provided direct URL:", faceswapResponse.direct_url);
        const backendStreamUrl = `/api/stream-video?url=${encodeURIComponent(faceswapResponse.direct_url)}`;
        setGeneratedVideoUrl(backendStreamUrl);
        setProcessingMessage(null);
        setPollingMessage(null);
        setAkoolTaskId(null); 
        setIsProcessing(false); 
        setStep(6);
        console.log("[handlePrepareDeepfakeScenario] Direct URL processed, moving to step 6.");
      } else if (faceswapResponse.akool_task_id) {
        setAkoolTaskId(faceswapResponse.akool_task_id);
        console.log("[handlePrepareDeepfakeScenario] Faceswap initiated for polling. Task ID:", faceswapResponse.akool_task_id);
        setProcessingMessage("딥페이크 영상 생성 작업 시작됨. 상태를 확인합니다...");
        setPollingMessage(faceswapResponse.message || "딥페이크 영상 생성 작업이 시작되었습니다...");
      } else {
        throw new Error(faceswapResponse.details || "딥페이크 영상 생성 시작 실패 (Task ID 또는 직접 URL 없음)");
      }
    } catch (err: any) {
      console.error("[handlePrepareDeepfakeScenario] Faceswap initiation or direct URL handling failed:", err);
      const faceswapError = "딥페이크 영상 생성 실패: " + err.message;
      setError((prevError) => prevError ? prevError + "; " + faceswapError : faceswapError);
      setProcessingMessage("딥페이크 영상 생성에 최종 실패했습니다.");
      setIsProcessing(false); 
      setPollingMessage(null);
      if(akoolTaskId) setAkoolTaskId(null); 
    }
  };

  const pollVideoStatus = useCallback(async () => {
    if (!akoolTaskId) {
      console.log("[pollVideoStatus] Attempted to poll but no akoolTaskId. pollCount was:", pollCount);
      return;
    }

    const currentPollAttempt = pollCount + 1;
    setPollCount(currentPollAttempt);

    console.log(`[pollVideoStatus] Polling attempt ${currentPollAttempt}/${MAX_POLLS} for task ${akoolTaskId}`);
    setPollingMessage(`영상 상태 확인 중... (시도 ${currentPollAttempt}/${MAX_POLLS})`);

    try {
      const statusResponse = await getFaceswapVideoStatus(akoolTaskId);
      const statusDetails = statusResponse.status_details;
      console.log(`[pollVideoStatus] Akool Status Response (Attempt ${currentPollAttempt}/${MAX_POLLS}, Task ${akoolTaskId}):`, statusDetails);

      const isSuccessStatus3 = statusDetails.faceswap_status === 3 && statusDetails.url;
      const isPotentialSuccessStatus2 =
        statusDetails.faceswap_status === 2 &&
        statusDetails.url &&
        currentPollAttempt >= MIN_POLLS_FOR_STATUS_2_SUCCESS;

      if (isSuccessStatus3 || isPotentialSuccessStatus2) {
        const backendStreamUrl = `/api/stream-video?url=${encodeURIComponent(statusDetails.url!)}`;
        console.log(`[pollVideoStatus] Success for Akool Task ${akoolTaskId}! Video URL: ${backendStreamUrl}. Attempting to set step to 5.`);
        console.log("[pollVideoStatus] Status details on success:", statusDetails);
        
        setGeneratedVideoUrl(backendStreamUrl);
        setProcessingMessage(null);
        setPollingMessage(null);
        setAkoolTaskId(null);
        setIsProcessing(false);
        setStep(5);
      } else if (statusDetails.faceswap_status === 4) {
        console.error(`[pollVideoStatus] Akool Task ${akoolTaskId} failed with status 4. Msg: ${statusDetails.msg}`);
        setError(statusDetails.msg || "딥페이크 영상 생성 실패 (Akool Status 4)");
        setProcessingMessage("딥페이크 영상 생성 중 오류가 발생했습니다.");
        setPollingMessage(null);
        setAkoolTaskId(null);
        setIsProcessing(false);
      } else if (currentPollAttempt >= MAX_POLLS) {
        console.warn(`[pollVideoStatus] Max polls reached for Akool Task ${akoolTaskId}.`);
        setError("딥페이크 영상 생성 시간 초과");
        setProcessingMessage("딥페이크 영상 생성에 시간이 너무 오래 소요됩니다.");
        setPollingMessage(null);
        setAkoolTaskId(null);
        setIsProcessing(false);
      } else {
        const statusKey = statusDetails.faceswap_status;
        const statusText = (statusKey === 1 || statusKey === 2) ? { 1: "작업 대기 중", 2: "영상 처리 중" }[statusKey] : '진행 중';
        console.log(`[pollVideoStatus] Akool Task ${akoolTaskId} still processing. Status: ${statusKey} (${statusText}). URL found: ${!!statusDetails.url}`);
        setProcessingMessage(`딥페이크 영상 처리 중 (${statusText})...`);
      }
    } catch (err: any) {
      console.error(`[pollVideoStatus] Error during getFaceswapVideoStatus call for Akool Task ${akoolTaskId}:`, err);
      setError("딥페이크 영상 상태 확인 중 오류 발생: " + err.message);
      setProcessingMessage("영상 상태 확인 중 오류가 발생했습니다.");
      setPollingMessage(null);
      setAkoolTaskId(null);
      setIsProcessing(false);
    }
  }, [akoolTaskId, pollCount, MAX_POLLS, MIN_POLLS_FOR_STATUS_2_SUCCESS]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (currentView === 'app' && step === 5 && akoolTaskId && !generatedVideoUrl && pollCount < MAX_POLLS && !error) {
      console.log(`[useEffect] Starting polling for Akool task ${akoolTaskId}. Current pollCount: ${pollCount}, Step: ${step}. Interval set.`);
      if (pollCount === 0) {
         console.log("[useEffect] Calling pollVideoStatus immediately as pollCount is 0 for this task.");
         pollVideoStatus();
      }
      intervalId = setInterval(pollVideoStatus, POLLING_INTERVAL);
      console.log(`[useEffect] Interval ID ${intervalId} set for task ${akoolTaskId}.`);
    } else {
      if (currentView === 'app' && step === 5) {
         console.log(`[useEffect] Polling not active or stopping. Conditions: step=${step}, akoolTaskId=${akoolTaskId}, !generatedVideoUrl=${!generatedVideoUrl}, pollCount<MAX_POLLS=${pollCount < MAX_POLLS}, !error=${!error}. Current intervalId was: ${intervalId}`);
      }
       if (intervalId) {
        console.warn("[useEffect] Clearing interval in 'else' block, this might indicate a logic flaw if polling was expected.");
        clearInterval(intervalId);
      }
    }

    return () => {
      if (intervalId) {
        console.log(`[useEffect cleanup] Clearing interval ID: ${intervalId} for task ${akoolTaskId}.`);
        clearInterval(intervalId);
      }
    };
  }, [currentView, step, akoolTaskId, pollVideoStatus, pollCount, generatedVideoUrl, error]);

  const currentAppProgressStep = () => {
    if (currentView !== 'app') return 0;
    return step;
  }
  const totalAppSteps = 7;

  const appStepTitles = [
    "1. 사진 업로드",
    "2. 음성 녹음/복제",
    "3. 원본 영상 시청",
    "4. 복제 음성 확인",
    "5. 딥페이크 생성 중",
    "6. 딥페이크 체험",
    "7. 성찰하기"
  ]

  const appStepComponents: { [key: number]: JSX.Element | null } = {
    1: <UserDataInput
        key="image-upload"
        onImageUpload={handleImageUploadComplete}
        isProcessing={isProcessing && step === 1}
        processingMessage={processingMessage}
        inputMode="image"
       />,
    2: <UserDataInput
        key="voice-upload"
        onVoiceRecording={handleVoiceRecordedAndClone}
        isProcessing={isProcessing && step === 2}
        processingMessage={processingMessage}
        inputMode="voice"
        scriptToRead={RECORDING_SCRIPT_KOREAN}
       />,
    3: (() => {
        let eduVideoUrl = process.env.NEXT_PUBLIC_EDUCATIONAL_VIDEO_URL || "/sample_educational_video.mp4";
        if (eduVideoUrl.startsWith('http')) {
          eduVideoUrl = `/api/stream-video?url=${encodeURIComponent(eduVideoUrl)}`;
        }
        return (
          <EducationalVideo
                key="edu-video"
                videoUrl={eduVideoUrl}
                userName={userName}
                onComplete={handleEducationalVideoComplete} // This will set showNextButtonAfterEduVideo to true
                showNextButton={showNextButtonAfterEduVideo} // Pass the state to the component
                onNextButtonClick={handleProceedToListenClonedVoice} // This is for the button's click
              />
        );
      })(),
    4: <ListenToClonedVoice
        key="listen-cloned-voice"
        audioUrl={userScriptAudioUrl}
        userName={userName}
        isProcessing={isProcessing && step === 4 && !userScriptAudioUrl} 
        processingMessage={processingMessage}
        onComplete={handlePrepareDeepfakeScenario} 
       />,
    5: <div className="text-center p-4">
          <h3 className="text-xl font-semibold mb-3">{appStepTitles[4]}</h3>
          {isProcessing && <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto my-4"></div>}
          <p className="text-gray-600 min-h-[40px]">{pollingMessage || processingMessage || "잠시만 기다려주세요..."}</p>
        </div>,
    6: <DeepfakeExperiencePlayer
        key="deepfake-experience"
        videoUrl={generatedVideoUrl}
        introAudioUrl={narratorIntroAudioUrl}
        isLoading={false} 
        error={error} 
        pollingMessage={null}
        onNext={() => setStep(6)}
       />,
    7: <ReflectionForm />
  }

  const renderAppView = () => (
    <>
      <div className="mb-6 md:mb-8">
        <div className="flex justify-between items-end mb-1">
          {appStepTitles.map((title, index) => {
            const stepNumber = index + 1;
            const isCompleted = currentAppProgressStep() > stepNumber;
            const isActive = currentAppProgressStep() === stepNumber;
  return (
              <div key={title} className={`flex flex-col items-center text-center flex-grow ${index > 0 ? 'ml-1 sm:ml-2' : ''}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm border-2 font-medium ${isCompleted ? 'bg-green-500 border-green-600 text-white' : isActive ? 'bg-blue-600 border-blue-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>
                  {stepNumber}
                </div>
                <span className={`mt-1.5 text-[10px] sm:text-xs leading-tight ${isActive || isCompleted ? 'text-blue-700 font-semibold' : 'text-gray-500'}`}>{title}</span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${(currentAppProgressStep() / totalAppSteps) * 100}%` }}></div>
        </div>
        {(error || (isProcessing && processingMessage && step !== 4) || (step === 4 && (isProcessing || pollingMessage || error)) ) && step < 5 && (
          <div className={`mt-4 p-3 rounded-md text-sm ${error ? 'bg-red-100 border-red-400 text-red-700' : 'bg-blue-100 border-blue-400 text-blue-700'}`}>
            {error ? `오류: ${error}` : (step === 4 && pollingMessage ? pollingMessage : (processingMessage || "진행 중..."))}
          </div>
        )}
      </div>
      <div className="mt-6 min-h-[350px]">
        {appStepComponents[step as keyof typeof appStepComponents]}
      </div>
    </>
  );

  if (currentView === 'welcome') {
    return (
      <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-lg bg-white shadow-xl rounded-lg p-8 text-center">
          <h1 className="text-3xl font-bold mb-5 text-slate-800">안녕하세요!</h1>
          <p className="text-lg mb-8 text-slate-600">AI 딥페이크 위험성 알림 및 체험 프로그램에 오신 것을 환영합니다.</p>
          <button onClick={() => setCurrentView('explanation')} className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150">
            다음으로
          </button>
        </div>
        <footer className="mt-8 text-xs text-gray-500">&copy; {new Date().getFullYear()} AI Awareness Project.</footer>
      </main>
    );
  }

  if (currentView === 'explanation') {
    return (
      <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-lg bg-white shadow-xl rounded-lg p-8 text-left">
          <h2 className="text-2xl font-semibold mb-5 text-slate-800">프로그램 안내</h2>
          <div className="space-y-3 text-slate-600 text-base">
            <p>이 프로그램은 AI 딥페이크 기술의 위험성을 알리고, 직접 체험을 통해 그 위험성을 인지하도록 돕기 위해 만들어졌습니다.</p>
            <p>총 {totalAppSteps}단계로 진행되며, 다음 순서로 구성됩니다:</p>
            <ul className="list-decimal list-inside ml-4 space-y-1">
              {appStepTitles.map(title => <li key={title}>{title.substring(title.indexOf(" ") + 1)}</li>)}
            </ul>
            <p className="pt-3">준비되셨다면, 아래 버튼을 눌러 체험을 시작해주세요.</p>
          </div>
          <button onClick={() => { setCurrentView('app'); setStep(1); }} className="w-full mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150">
            체험 시작하기
          </button>
        </div>
        <footer className="mt-8 text-xs text-gray-500">&copy; {new Date().getFullYear()} AI Awareness Project.</footer>
      </main>
    );
  }

  // Main App View (currentView === 'app')
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-slate-800">
          AI 딥페이크 위험성 알림 및 체험
        </h1>
        {renderAppView()}
      </div>
      <footer className="mt-8 mb-4 text-xs text-gray-500">&copy; {new Date().getFullYear()} AI Awareness Project. All rights reserved.</footer>
    </main>
  );
}