'use client'
import { useState } from 'react'
import VoiceRecorder from '@/components/VoiceRecorder'
import EducationalVideo from '@/components/EducationalVideo'
import ScamSimulation from '@/components/ScamSimulation'
import ReflectionForm from '@/components/ReflectionForm'

export default function Home() {
  const [step, setStep] = useState(1)
  const [voiceId, setVoiceId] = useState<string | null>(null)

  const steps = {
    1: <VoiceRecorder onVoiceCloned={(id: string) => {
      setVoiceId(id)
      setStep(2)
    }} />,
    2: <EducationalVideo onComplete={() => setStep(3)} />,
    3: <ScamSimulation voiceId={voiceId} onComplete={() => setStep(4)} />,
    4: <ReflectionForm />
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-lg p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 md:mb-8 text-center text-slate-700">
          목소리 복제 위험 알림
        </h1>
        
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4].map((num, index, arr) => (
              <div key={num} className="flex flex-col items-center flex-grow">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base
                    ${step >= num ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-200 text-gray-600'}`}
                >
                  {num}
                </div>
                <span className={`mt-1 text-xs sm:text-sm ${step >= num ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {index === 0 && "음성 녹음"}
                  {index === 1 && "교육"}
                  {index === 2 && "시나리오"}
                  {index === 3 && "생각하기"}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(step / 4) * 100}%` }}>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {steps[step as keyof typeof steps]}
        </div>
      </div>
      <footer className="mt-8 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} 음성 복제 인식 개선 프로젝트. 모든 권리 보유.</p>
      </footer>
    </main>
  )
}
