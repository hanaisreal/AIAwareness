'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import UserInfoForm from '@/components/UserInfoForm'
import Image from 'next/image'

const MINA_TALKING_GIF_SRC = "/talking.gif"
const MINA_IDLE_PNG_SRC = "/mina_idle.png"

interface UserInfo {
  name: string;
  age: string;
  gender: 'male' | 'female';
}

const PART0_CONTENT = {
  welcome: {
    text: "안녕하세요! 요즘 자주 들리는 딥페이크와 딥보이스, 어떤 기술인지 함께 알아볼까요?",
    audioSrc: "/part0/part0_script_1.mp3",
  },
  userInfoPrompt: {
    text: "진행을 도와드리기 위해 성함과 나이, 성별을 먼저 입력해주세요.",
    audioSrc: "/part0/part0_script_2.mp3",
  },
}

export default function HomePage() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0: initial welcome, 1: input
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentScriptText, setCurrentScriptText] = useState("")

  useEffect(() => {
    let audioSrc = ""
    let scriptText = ""

    if (step === 0) {
      scriptText = PART0_CONTENT.welcome.text
      audioSrc = PART0_CONTENT.welcome.audioSrc
    } else if (step === 1) {
      scriptText = PART0_CONTENT.userInfoPrompt.text
      audioSrc = PART0_CONTENT.userInfoPrompt.audioSrc
    }

    setCurrentScriptText(scriptText)

    if (audioRef.current && audioSrc && step !== 0) {
      if (!audioRef.current.paused) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      audioRef.current.src = audioSrc
      audioRef.current.load()
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsAudioPlaying(true)
        }).catch(error => {
          console.error("Audio play failed:", error)
          setIsAudioPlaying(false)
        })
      }
    } else {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause()
      }
      setIsAudioPlaying(false)
    }
  }, [step])

  const handleStart = () => {
    if (step === 0 && audioRef.current) {
      if (!audioRef.current.paused) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      audioRef.current.src = PART0_CONTENT.welcome.audioSrc
      audioRef.current.load()
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsAudioPlaying(true)
        }).catch(error => {
          console.error("Welcome audio play failed:", error)
          setIsAudioPlaying(false)
          setStep(1)
        })
      }
    } else if (step === 0) {
      setStep(1)
    }
  }

  const handleUserSubmit = async (submittedUserInfo: UserInfo) => {
    setUser(submittedUserInfo)
    setIsLoading(true)
    
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsAudioPlaying(false)
    }

    try {
      localStorage.setItem('userName', submittedUserInfo.name)
      localStorage.setItem('userAge', submittedUserInfo.age)
      localStorage.setItem('userGender', submittedUserInfo.gender)
      router.push('/scenarios/part1')
    } catch (error) {
      console.error("Error submitting user info:", error)
      setIsLoading(false)
    }
  }

  const currentMinaImage = isAudioPlaying ? MINA_TALKING_GIF_SRC : MINA_IDLE_PNG_SRC

  const handleAudioEnded = () => {
    setIsAudioPlaying(false)
    if (step === 0 && audioRef.current?.src.includes(PART0_CONTENT.welcome.audioSrc)) {
      setStep(1)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-4 text-gray-800">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
        <div className="w-64 h-64 relative mb-6">
          <Image 
            key={currentMinaImage}
            src={currentMinaImage} 
            alt="안내 캐릭터 미나" 
            layout="fill" 
            objectFit="contain" 
            unoptimized={currentMinaImage.endsWith('.gif')}
            priority
          />
        </div>

        {step === 0 && (
          <div className="animate-fade-in w-full">
            <h1 className="text-3xl font-bold mb-4">딥페이크/딥보이스 체험하기</h1>
            <p className="text-lg text-gray-700 mb-8 min-h-[6em] flex items-center justify-center whitespace-pre-line">
              {currentScriptText}
            </p>
            <button
              onClick={handleStart}
              className="w-full py-3 px-6 bg-orange-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out"
              disabled={isAudioPlaying}
            >
              시작하기
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in w-full">
            <p className="text-md text-gray-600 mb-6 min-h-[4em] flex items-center justify-center whitespace-pre-line">
              {currentScriptText}
            </p>
            <UserInfoForm onSubmit={handleUserSubmit} />
            {isLoading && <div className="text-orange-600 my-4">처리 중...</div>}
          </div>
        )}
      </div>
      <audio 
        ref={audioRef} 
        className="hidden" 
        onPlay={() => setIsAudioPlaying(true)} 
        onEnded={handleAudioEnded}
        onError={(e) => {
          console.error("Error with audio element for src:", (e.target as HTMLAudioElement).src)
          setIsAudioPlaying(false)
          if (step === 0 && audioRef.current?.src.includes(PART0_CONTENT.welcome.audioSrc)) {
            setStep(1)
          }
        }}
      />
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