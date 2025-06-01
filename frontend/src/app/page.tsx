'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UserInfoForm from './components/UserInfoForm'

// Assume you have a pre-recorded greeting in /public
const INITIAL_GREETING_AUDIO = '/greeting.mp3'

export default function HomePage() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0: initial welcome, 1: input, 2: personalized greeting, 3: show personalized greeting
  const [user, setUser] = useState<{ name: string; age: string } | null>(null)
  const [personalizedAudioUrl, setPersonalizedAudioUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showNextStepButton, setShowNextStepButton] = useState(false)
  const [isPlayingInitialAudio, setIsPlayingInitialAudio] = useState(false)

  const initialAudioRef = useRef<HTMLAudioElement>(null)
  const personalizedAudioRef = useRef<HTMLAudioElement>(null)

  // Handle personalized audio playback and show next button
  useEffect(() => {
    if (personalizedAudioUrl && personalizedAudioRef.current && step === 2) {
      const audioEl = personalizedAudioRef.current
      const playAudio = async () => {
        try {
          await audioEl.play()
          setShowNextStepButton(false) // Hide button while audio plays
        } catch (e) {
          console.error("Error playing personalized audio:", e)
          setShowNextStepButton(true) // Show button if play fails
        }
      }
      playAudio()

      const handleAudioEnd = () => setShowNextStepButton(true)
      audioEl.addEventListener('ended', handleAudioEnd)
      return () => audioEl.removeEventListener('ended', handleAudioEnd)
    }
  }, [personalizedAudioUrl, step])

  const handlePlayInitialGreeting = async () => {
    if (initialAudioRef.current) {
      try {
        await initialAudioRef.current.play()
        setIsPlayingInitialAudio(true)
        // Listen for the end of the initial greeting to auto-proceed or show a next button
        initialAudioRef.current.onended = () => {
          setIsPlayingInitialAudio(false)
          setStep(1) // Auto-proceed to name/age input after initial greeting
        }
      } catch (e) {
        console.error("Error playing initial audio:", e)
        // If autoplay fails, directly go to next step or show an error
        setIsPlayingInitialAudio(false)
        setStep(1) // Fallback to next step
      }
    } else {
      setStep(1) // Fallback if audio element not ready
    }
  }

  const handleUserSubmit = async (name: string, age: string) => {
    setUser({ name, age })
    setIsLoading(true)
    setShowNextStepButton(false)

    try {
      const res = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setPersonalizedAudioUrl(url)
        setStep(2) // Move to step where personalized audio will play
      } else {
        console.error("Failed to generate personalized speech")
        setShowNextStepButton(true)
        setStep(3) // Move to a step to show error or just the button
      }
    } catch (error) {
      console.error("Error submitting user info:", error)
      setShowNextStepButton(true)
      setStep(3) // Move to a step to show error or just the button
    }
    setIsLoading(false)
  }

  const navigateToPart1Concept = () => {
    router.push('/scenarios/part1') // Navigate to Part 1 main page (which starts with concept)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-4 text-gray-800">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
        {(step !== 1 || !isPlayingInitialAudio) && (
          <img src="/talking.gif" alt="안내 캐릭터 미나" className="w-64 h-auto mb-6" />
        )}

        {step === 0 && (
          <div className="animate-fade-in w-full">
            <h1 className="text-3xl font-bold mb-4">딥페이크 체험</h1>
            <p className="text-lg text-gray-700 mb-8">
              안녕하세요! 저는 미나예요.<br />
              체험을 시작해볼까요?
            </p>
            <audio ref={initialAudioRef} src={INITIAL_GREETING_AUDIO} preload="auto" />
            <button
              onClick={handlePlayInitialGreeting}
              disabled={isPlayingInitialAudio}
              className={`w-full py-3 px-6 bg-orange-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out ${isPlayingInitialAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPlayingInitialAudio ? '듣는 중...' : '시작하기'}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in w-full">
            {isPlayingInitialAudio && <p className="text-md text-gray-600 mb-6">미나가 안내 중입니다...</p>}
            {!isPlayingInitialAudio && (
              <>
                <h2 className="text-2xl font-semibold mb-3">이름과 나이를 알려주세요</h2>
                <p className="text-md text-gray-600 mb-6">
                  체험 중 미나가 어르신의 성함을 불러드릴 거예요. <br/> 이 정보는 저장되지 않으니 안심하세요.
                </p>
                <UserInfoForm onSubmit={handleUserSubmit} />
              </>
            )}
          </div>
        )}

        {(step === 2 || step === 3) && user && (
          <div className="animate-fade-in w-full">
            <h2 className="text-2xl font-bold mb-4">{user.name}님, 반가워요!</h2>
            {isLoading && <div className="text-orange-600 my-4">음성 준비 중...</div>}
            {step === 2 && personalizedAudioUrl && <audio ref={personalizedAudioRef} src={personalizedAudioUrl} />}
            
            {showNextStepButton && !isLoading && (
              <button
                onClick={navigateToPart1Concept}
                className="mt-8 text-orange-600 hover:text-orange-700 font-semibold text-lg py-2 transition duration-150 ease-in-out"
              >
                다음 단계로 →
              </button>
            )}
            {step === 3 && !isLoading && !personalizedAudioUrl && (
              <p className="text-red-500 my-4">음성 로딩에 실패했어요. 하지만 다음 단계로 진행할 수 있습니다.</p>
            )}
          </div>
        )}
      </div>
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.7s ease-out;
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}