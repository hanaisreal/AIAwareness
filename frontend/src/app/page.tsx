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
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Voice Clone Awareness Project
        </h1>
        <div className="mb-6">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${step >= num ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
        {steps[step as keyof typeof steps]}
      </div>
    </main>
  )
}
