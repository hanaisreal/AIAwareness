'use client'
import { useState, useEffect, useCallback } from 'react'
import UserDataInput from '@/components/UserDataInput'
import EducationalVideo from '@/components/EducationalVideo'
import DeepfakeExperiencePlayer from '@/components/DeepfakeExperiencePlayer'
import ReflectionForm from '@/components/ReflectionForm'
import { uploadVoice, initiateFaceswapVideo, getFaceswapVideoStatus, getElevenLabsIntroAudio } from '@/lib/api'
import ListenToClonedVoice from '@/components/ListenToClonedVoice'

const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLS = 60; // 5 minutes max polling
const ELEVEN_LABS_NARRATOR_TEXT = "딥페이크 영상은 누구나 손쉽게 만들 수 있는데요.";
const USER_VOICE_SCRIPT = "여보세요? 이번에 건강검진 예약해놨거든? 그런데 거기서 주민등록증 사본이랑 건강보험증 필요하다고 하네. 그거 사진 찍어서 지금 좀 보내줄 수 있어? 급하니까 빨리!!";
const RECORDING_SCRIPT_KOREAN = "안녕하세요. 지금 제 목소리를 녹음하고 있습니다. 이 목소리가 어떻게 복제될지 기대되네요.";
const MIN_POLLS_FOR_STATUS_2_SUCCESS = 3;

export default function Home() {
  const [currentView, setCurrentView] = useState('welcome');
  const [step, setStep] = useState(1);
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [userClonedVoiceId, setUserClonedVoiceId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("참여자");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [narratorIntroAudioUrl, setNarratorIntroAudioUrl] = useState<string | null>(null);
  const [userScriptAudioUrl, setUserScriptAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // General processing state, e.g. for voice cloning, narrator audio
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [akoolTaskId, setAkoolTaskId] = useState<string | null>(null); // For Akool video polling
  const [pollCount, setPollCount] = useState(0);
  const [pollingMessage, setPollingMessage] = useState<string | null>(null); // Specific for video polling status updates

  const [showNextButtonAfterEduVideo, setShowNextButtonAfterEduVideo] = useState(false);

  console.log("[Home Render] Step:", step, "isProcessing:", isProcessing, "akoolTaskId:", akoolTaskId, "genURL:", generatedVideoUrl, "pollCount:", pollCount, "processingMsg:", processingMessage, "pollingMsg:", pollingMessage, "error:", error, "narratorAudioUrl:", narratorIntroAudioUrl);

  // Step 1: Handle Image Upload AND Initiate Faceswap
  const handleImageUploadComplete = async (imageFile: File) => {
    setUserImageFile(imageFile);
    setError(null); // Clear previous errors
    setProcessingMessage("사진 업로드 완료. 백그라운드에서 얼굴 변환 영상 생성을 시작합니다...");
    
    // Don't await, let it run in the background. UI proceeds to Step 2.
    handleInitiateFaceswapEarly(imageFile); 

    // UI update for proceeding to next step
    // Keep the processing message about background task for a moment
    // The user will be on step 2, so this message might not be visible for long.
    // Or, set a message specific to step 2's action.
    setProcessingMessage("음성 녹음 및 복제 단계로 이동합니다."); 
    setStep(2);
  };

  // New function to initiate faceswap early (called from handleImageUploadComplete)
  const handleInitiateFaceswapEarly = async (imageFile: File) => {
    console.log("[handleInitiateFaceswapEarly] Initiating faceswap early.");
    setGeneratedVideoUrl(null); // Reset previous video URL
    setAkoolTaskId(null);       // Reset previous task ID
    setPollCount(0);            // Reset poll count for new task
    setPollingMessage("얼굴 변환 영상 초기화 중..."); // Initial message

    try {
      const faceswapResponse = await initiateFaceswapVideo(imageFile);
      console.log("[handleInitiateFaceswapEarly] Faceswap API Response:", faceswapResponse);

      if (faceswapResponse.direct_url) {
        console.log("[handleInitiateFaceswapEarly] Akool provided direct URL:", faceswapResponse.direct_url);
        const backendStreamUrl = `/api/stream-video?url=${encodeURIComponent(faceswapResponse.direct_url)}`;
        setGeneratedVideoUrl(backendStreamUrl);
        setPollingMessage("얼굴 변환 영상이 즉시 준비되었습니다."); 
        setAkoolTaskId(null); // No polling needed
      } else if (faceswapResponse.akool_task_id) {
        setAkoolTaskId(faceswapResponse.akool_task_id);
        setPollingMessage(faceswapResponse.message || "얼굴 변환 영상 생성 작업 시작됨. 백그라운드에서 상태를 확인합니다...");
        // The main polling useEffect (dependent on akoolTaskId) will automatically start.
      } else {
        throw new Error(faceswapResponse.details || "얼굴 변환 영상 생성 시작 실패 (Task ID 또는 직접 URL 없음)");
      }
    } catch (err: any) {
      console.error("[handleInitiateFaceswapEarly] Faceswap initiation failed:", err);
      const earlyFaceswapError = "백그라운드 얼굴 변환 시작 실패: " + (err.message || "알 수 없는 오류");
      setError((prevError) => prevError ? `${prevError}; ${earlyFaceswapError}` : earlyFaceswapError);
      setPollingMessage("백그라운드 얼굴 변환 영상 시작에 실패했습니다."); 
      setAkoolTaskId(null); // Ensure no polling if initiation failed
    }
  };

  // Step 2: Handle Voice Recording and Cloning
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

  // Step 3: Educational Video Completion
  const handleEducationalVideoComplete = () => {
    console.log("[handleEducationalVideoComplete] Educational video finished.");
    setShowNextButtonAfterEduVideo(true);
  };

  // After Step 3, user clicks "Next" -> Proceed to Listen to Cloned Voice (Step 4)
  const handleProceedToListenClonedVoice = async () => {
    if (!userClonedVoiceId) {
      setError("복제된 음성 ID가 없어 사용자 스크립트 음성을 생성할 수 없습니다. 2단계 음성 복제를 확인해주세요.");
      setStep(2); 
      return;
    }
    console.log("[handleProceedToListenClonedVoice] Proceeding to generate user script audio for Step 4.");
    setShowNextButtonAfterEduVideo(false);
    setIsProcessing(true); // For user script audio generation
    setError(null);
    setProcessingMessage("사용자 스크립트 음성 생성 중...");
    setUserScriptAudioUrl(null); 

    try {
      console.log(`[handleProceedToListenClonedVoice] Generating audio for USER_VOICE_SCRIPT with voice ID: ${userClonedVoiceId}`);
      const scriptAudioResponse = await getElevenLabsIntroAudio(USER_VOICE_SCRIPT, userClonedVoiceId);
      
      if (scriptAudioResponse && scriptAudioResponse.audioUrl) {
        setUserScriptAudioUrl(scriptAudioResponse.audioUrl);
        console.log("[handleProceedToListenClonedVoice] User script audio URL set:", scriptAudioResponse.audioUrl);
        setProcessingMessage(null); 
        setStep(4); 
      } else {
        throw new Error("사용자 스크립트 음성 URL을 받지 못했습니다 (API 응답 확인 필요).");
      }
    } catch (err: any) {
      console.error("[handleProceedToListenClonedVoice] User script audio generation failed:", err);
      setError("사용자 스크립트 음성 생성 실패: " + (err.message || "알 수 없는 오류"));
      setProcessingMessage("사용자 스크립트 음성 생성에 실패했습니다.");
      // setStep(4); // Still go to step 4, but with error message
    }
    setIsProcessing(false);
  };

  // After Step 4, user clicks "Next" -> Prepare for Deepfake Scenario (Step 5 UI)
  const handlePrepareDeepfakeScenario = async () => {
    // This function is called when user completes Step 4 (ListenToClonedVoice)
    // Faceswap was initiated in Step 1. Here we primarily generate narrator audio
    // and then the UI for Step 5 will show combined status.
    if (!userClonedVoiceId) {
      setError("복제된 음성 ID가 필요합니다. 2단계에서 음성 녹음 및 복제를 완료해주세요.");
      setStep(2);
      return;
    }

    console.log("[handlePrepareDeepfakeScenario] Preparing for Step 5: Narrator audio & Deepfake video display.");
    setStep(5); // Move to Step 5 UI
    setIsProcessing(true); // For narrator audio generation
    // Don't clear global error, as an early faceswap error might be important.
    // setError(null); 
    setNarratorIntroAudioUrl(null); // Reset narrator audio for this attempt

    let narratorAudioSuccess = false;
    try {
      console.log(`[handlePrepareDeepfakeScenario] Generating narrator audio with text: \"${ELEVEN_LABS_NARRATOR_TEXT}\" and voice ID: ${userClonedVoiceId}`);
      setProcessingMessage("내레이션 음성 생성 중 (사용자 목소리)...");
      const narratorResponse = await getElevenLabsIntroAudio(ELEVEN_LABS_NARRATOR_TEXT, userClonedVoiceId);
      if (narratorResponse && narratorResponse.audioUrl) {
        setNarratorIntroAudioUrl(narratorResponse.audioUrl);
        console.log("[handlePrepareDeepfakeScenario] Narrator intro audio URL set:", narratorResponse.audioUrl);
        narratorAudioSuccess = true;
        setProcessingMessage("내레이션 음성 생성 완료.");
      } else {
        throw new Error("내레이션 음성 URL을 받지 못했습니다.");
      }
    } catch (err: any) {
      console.error("[handlePrepareDeepfakeScenario] Narrator audio generation failed:", err);
      const narratorErrorMsg = "내레이션 음성 생성 실패 (사용자 목소리): " + (err.message || "알 수 없는 오류");
      setError((prevError) => prevError ? `${prevError}; ${narratorErrorMsg}` : narratorErrorMsg);
      setProcessingMessage(narratorErrorMsg);
    }
    setIsProcessing(false); // Narrator audio generation attempt is complete.

    // Update UI message for Step 5 based on current video and narrator status.
    // The pollingMessage will show video status if it's still polling.
    // processingMessage will reflect narrator status or combined if video is ready.
    if (generatedVideoUrl) { // Video is ready
      if (narratorAudioSuccess) {
        setProcessingMessage("내레이션 음성 및 딥페이크 영상 준비 완료.");
      } else {
        // Processing message for narrator failure is already set.
        // We might add to it if needed: "딥페이크 영상은 준비되었으나, 내레이션 음성 생성에 실패했습니다."
      }
    } else if (akoolTaskId) { // Video not ready, but polling is (or should be) active
      setProcessingMessage(narratorAudioSuccess ? "내레이션 음성 완료. 딥페이크 영상 백그라운드 생성 중..." : "내레이션 음성 생성 실패. 딥페이크 영상 백그라운드 생성 중...");
      // pollingMessage should be active from the polling useEffect.
    } else if (!error) { // No video, no task ID, and no pre-existing general error - implies early faceswap failed silently or didn't run
        const missingVideoError = "딥페이크 영상 정보를 찾을 수 없습니다. 1단계 이미지 업로드부터 다시 시도해주세요.";
        setError((prevError) => prevError ? `${prevError}; ${missingVideoError}` : missingVideoError);
        setProcessingMessage("딥페이크 영상 정보를 찾을 수 없습니다.");
    }
    // The useEffect watching for (step 5 && generatedVideoUrl && narratorIntroAudioUrl) will handle auto-transition to step 6.
  };
  
  // Background Polling for Akool Video Status
  const pollVideoStatus = useCallback(async () => {
    if (!akoolTaskId) {
      // console.log("[pollVideoStatus] No akoolTaskId to poll."); // Can be noisy
      return;
    }

    const currentPollAttempt = pollCount + 1; // Important: use a local var for current attempt if setPollCount is async
    setPollCount(c => c + 1); // Increment for next time or UI display

    console.log(`[pollVideoStatus] Polling attempt ${currentPollAttempt}/${MAX_POLLS} for task ${akoolTaskId}`);
    setPollingMessage(`얼굴 변환 영상 상태 확인 중... (시도 ${currentPollAttempt}/${MAX_POLLS})`);

    try {
      const statusResponse = await getFaceswapVideoStatus(akoolTaskId);
      const statusDetails = statusResponse.status_details;
      console.log(`[pollVideoStatus] Akool Status Response (Attempt ${currentPollAttempt}):`, statusDetails);

      const isSuccessStatus3 = statusDetails.faceswap_status === 3 && statusDetails.url;
      const isPotentialSuccessStatus2 =
        statusDetails.faceswap_status === 2 &&
        statusDetails.url &&
        currentPollAttempt >= MIN_POLLS_FOR_STATUS_2_SUCCESS;

      if (isSuccessStatus3 || isPotentialSuccessStatus2) {
        const backendStreamUrl = `/api/stream-video?url=${encodeURIComponent(statusDetails.url!)}`;
        console.log(`[pollVideoStatus] Success for Akool Task ${akoolTaskId}! Video URL: ${backendStreamUrl}.`);
        
        setGeneratedVideoUrl(backendStreamUrl);
        setPollingMessage("딥페이크 영상 생성 완료.");
        setAkoolTaskId(null); // Stop polling for THIS task
      } else if (statusDetails.faceswap_status === 4) { // Failure
        console.error(`[pollVideoStatus] Akool Task ${akoolTaskId} failed with status 4. Msg: ${statusDetails.msg}`);
        const videoGenError = "딥페이크 영상 생성 실패 (Akool 서버 오류): " + (statusDetails.msg || "알 수 없는 오류");
        setError((prevError) => prevError ? `${prevError}; ${videoGenError}` : videoGenError);
        setPollingMessage(videoGenError);
        setAkoolTaskId(null); // Stop polling
      } else if (currentPollAttempt >= MAX_POLLS) { // Timeout
        console.warn(`[pollVideoStatus] Max polls reached for Akool Task ${akoolTaskId}.`);
        const timeoutError = "딥페이크 영상 생성 시간 초과";
        setError((prevError) => prevError ? `${prevError}; ${timeoutError}` : timeoutError);
        setPollingMessage(timeoutError);
        setAkoolTaskId(null); // Stop polling
      } else { // Still processing
        const statusKey = statusDetails.faceswap_status;
        const statusText = (statusKey === 0) ? "대기 중" : (statusKey === 1 || statusKey === 2) ? "영상 처리 중" : `알 수 없는 상태 ${statusKey}`;
        console.log(`[pollVideoStatus] Akool Task ${akoolTaskId} still processing. Status: ${statusKey} (${statusText}).`);
        // Polling message is already set at the start of the function.
        // If step 5 is active, its processingMessage might show narrator status.
      }
    } catch (err: any) {
      console.error(`[pollVideoStatus] Error during getFaceswapVideoStatus call for Akool Task ${akoolTaskId}:`, err);
      const pollErrorMsg = "딥페이크 영상 상태 확인 중 API 오류 발생: " + (err.message || "알 수 없는 네트워크 오류");
      setError((prevError) => prevError ? `${prevError}; ${pollErrorMsg}` : pollErrorMsg);
      setPollingMessage(pollErrorMsg);
      setAkoolTaskId(null); // Stop polling on API error
    }
  }, [akoolTaskId, pollCount, MAX_POLLS, MIN_POLLS_FOR_STATUS_2_SUCCESS]); // Removed getFaceswapVideoStatus from deps, assuming it's stable

  // useEffect for Managing Akool Video Polling (runs in background after Step 1)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (currentView === 'app' && akoolTaskId && !generatedVideoUrl && pollCount < MAX_POLLS) {
      console.log(`[useEffect Polling] Akool task ${akoolTaskId} is active. Starting/Continuing polling. Poll count: ${pollCount}.`);
      if (pollCount === 0) { // Call immediately on first poll for a new task ID
         console.log("[useEffect Polling] Calling pollVideoStatus immediately for new task.");
         pollVideoStatus(); 
      }
      intervalId = setInterval(pollVideoStatus, POLLING_INTERVAL);
    } else {
      if (intervalId) {
        clearInterval(intervalId); // Clear if conditions no longer met
      }
      if (akoolTaskId && generatedVideoUrl) {
          // console.log("[useEffect Polling] Video URL received, polling stopped for task:", akoolTaskId);
      } else if (akoolTaskId && pollCount >= MAX_POLLS) {
          // console.log("[useEffect Polling] Max polls reached, polling stopped for task:", akoolTaskId);
      }
    }
    return () => { // Cleanup
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentView, akoolTaskId, generatedVideoUrl, pollCount, pollVideoStatus]);


  // useEffect to transition from Step 5 to Step 6 when assets are ready
  useEffect(() => {
    // Condition: User is on Step 5, video is ready, narrator audio generation is no longer processing.
    if (step === 5 && generatedVideoUrl && !isProcessing) {
      console.log("[useEffect Step5->6] Conditions met: On Step 5, Video Ready, Narrator Processing Done. Moving to Step 6.");
      setProcessingMessage(null); // Clear any "generating..." messages from narrator
      
      // Error state might contain narrator error, video error, or both.
      // If only narrator failed, we proceed. If video failed, error should reflect that.
      if (narratorIntroAudioUrl) {
        // setError(null); // Optionally clear if narrator also succeeded.
      }
      setStep(6);
    }
  }, [step, generatedVideoUrl, narratorIntroAudioUrl, isProcessing, error]);


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
  ];

  const appStepComponents: { [key: number]: JSX.Element | null } = {
    1: <UserDataInput
        key="image-upload"
        onImageUpload={handleImageUploadComplete}
        isProcessing={isProcessing && step === 1} // isProcessing might be true from previous step, only show if current step
        processingMessage={step === 1 ? processingMessage : null}
        inputMode="image"
       />,
    2: <UserDataInput
        key="voice-upload"
        onVoiceRecording={handleVoiceRecordedAndClone}
        isProcessing={isProcessing && step === 2}
        processingMessage={step === 2 ? processingMessage : null}
        inputMode="voice"
        scriptToRead={RECORDING_SCRIPT_KOREAN}
       />,
    3: (() => {
        let eduVideoUrl = process.env.NEXT_PUBLIC_EDUCATIONAL_VIDEO_URL || "/sample_educational_video.mp4";
        // Proxy non-local videos through backend if needed, or use direct URL if CORS allows
        if (eduVideoUrl.startsWith('http') && !eduVideoUrl.includes(window.location.hostname) ) { // Basic check
          eduVideoUrl = `/api/stream-video?url=${encodeURIComponent(eduVideoUrl)}`;
        }
        return (
          <EducationalVideo
                key="edu-video"
                videoUrl={eduVideoUrl}
                userName={userName}
                onComplete={handleEducationalVideoComplete}
                showNextButton={showNextButtonAfterEduVideo}
                onNextButtonClick={handleProceedToListenClonedVoice}
              />
        );
      })(),
    4: <ListenToClonedVoice
        key="listen-cloned-voice"
        audioUrl={userScriptAudioUrl}
        userName={userName}
        isProcessing={isProcessing && step === 4 && !userScriptAudioUrl} 
        processingMessage={step === 4 && isProcessing ? processingMessage : null}
        onComplete={handlePrepareDeepfakeScenario} 
       />,
    5: <div className="text-center p-4">
          <h3 className="text-xl font-semibold mb-3">{appStepTitles[4]}</h3> {/* 딥페이크 생성 중 */}
          {(!generatedVideoUrl || (isProcessing && !narratorIntroAudioUrl)) && 
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto my-4"></div>
          }
          <p className="text-gray-600 min-h-[40px] mt-2">
            {pollingMessage && !generatedVideoUrl ? pollingMessage : processingMessage || "잠시만 기다려주세요..."}
          </p>
          {generatedVideoUrl && narratorIntroAudioUrl && <p className="text-green-600">모든 준비가 완료되었습니다. 잠시 후 체험이 시작됩니다.</p>}
          {generatedVideoUrl && !narratorIntroAudioUrl && error?.includes("내레이션") && <p className="text-orange-600">딥페이크 영상은 준비되었으나, 내레이션 음성 생성에 문제가 발생했습니다. 영상만으로 체험합니다.</p>}
        </div>,
    6: <DeepfakeExperiencePlayer
        key="deepfake-experience"
        videoUrl={generatedVideoUrl}
        introAudioUrl={narratorIntroAudioUrl} // Can be null if narrator failed
        isLoading={!generatedVideoUrl} // Show loading if video URL isn't set yet (should be rare here due to useEffect transition)
        error={error} // Pass down any relevant errors (e.g., narrator error, or video error if it somehow bypassed earlier checks)
        pollingMessage={null} // Polling is done
        onNext={() => { setError(null); setStep(7);}} // Corrected: Go to Step 7 (Reflection), clear error before moving
       />,
    7: <ReflectionForm />
  };

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
        {/* Global error display area - shows errors not specific to a component, or general processing messages */}
        {(error && step !==4 /* Step 4 has its own error display in ListenToClonedVoice */ && step !==6 /* Step 6 player handles its own error display */) && (
          <div className={`mt-4 p-3 rounded-md text-sm bg-red-100 border-red-400 text-red-700`}>
            오류: {error}
          </div>
        )}
         {/* Show general processing messages if not an error and not handled by specific step components */}
        {isProcessing && processingMessage && ![1,2,4].includes(step) && (step !== 5 || (step === 5 && !pollingMessage)) && ( 
            <div className={`mt-4 p-3 rounded-md text-sm bg-blue-100 border-blue-400 text-blue-700`}>
                {processingMessage}
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
          <button onClick={() => { setCurrentView('app'); setStep(1); setError(null); setProcessingMessage(null); /* Reset states */ }} className="w-full mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150">
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