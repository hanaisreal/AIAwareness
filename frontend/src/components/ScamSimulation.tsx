'use client'
import { useState, useRef, useEffect } from 'react';

interface ScamSimulationProps {
  voiceId: string | null;
  onComplete: () => void;
}

export default function ScamSimulation({ voiceId, onComplete }: ScamSimulationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const scamText = "여보세요? 나야, 나. 이번에 건강검진 예약해놨거든. 그런데 거기서 주민등록증 사본이랑 건강보험증 필요하다고 하네.";

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        console.log("Revoked audio URL:", audioUrl);
      }
    };
  }, [audioUrl]);

  const generateScamAudio = async () => {
    if (!voiceId) {
      setError("Voice ID is missing. Cannot generate audio.");
      console.error("Voice ID is missing in ScamSimulation.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
    }

    try {
      console.log(`Requesting speech generation for voiceId: ${voiceId} with text: "${scamText}"`);
      const response = await fetch('http://localhost:8000/api/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({
          voice_id: voiceId,
          text: scamText,
          model_id: "eleven_multilingual_v2",
          stability: 0.40,         // Lower stability for more expression
          similarity_boost: 0.70   // Slightly lower similarity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to parse error response from server." }));
        console.error('Error generating scam audio:', response.status, errorData);
        setError(`Error ${response.status}: ${errorData.detail || "Could not generate audio."}`);
        throw new Error(`Server error: ${response.status} - ${errorData.detail}`);
      }

      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        setError("Received empty audio stream. Please check backend logs.");
        console.error("Received empty audio blob from /api/generate-speech");
        return;
      }
      const newAudioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(newAudioUrl);
      console.log("Generated new audio URL:", newAudioUrl);

    } catch (err: any) {
      console.error('Error in generateScamAudio:', err);
      if (!error) {
        setError(`Failed to generate audio: ${err.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(playError => {
        console.error("Error attempting to play audio:", playError);
        setError("Audio playback failed. You might need to interact with the page first.");
      });
    }
  }, [audioUrl]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Step 3: Experience a Scam Attempt</h2>
      <p className="mb-2 text-gray-700">
        Now, you'll hear how your cloned voice could potentially be used. Click the button below to hear a simulated scam call using your voice.
      </p>
      <p className="mb-4 text-sm text-gray-500">
        The voice will say: "{scamText}"
      </p>
      
      <div className="flex flex-col items-center gap-4 mt-6">
        <button
          onClick={generateScamAudio}
          disabled={isGenerating || !voiceId}
          className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-medium text-lg disabled:bg-gray-400"
        >
          {isGenerating ? 'Generating Audio...' : 'Hear Your Cloned Voice in a Scam'}
        </button>

        {error && (
          <p className="text-red-500 mt-2 text-sm">{error}</p>
        )}

        {audioUrl && (
          <div className="mt-6 w-full max-w-md">
            <p className="text-md font-semibold text-gray-700 mb-2">Simulated Scam Call:</p>
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full"
              onEnded={onComplete}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        
        {!audioUrl && !isGenerating && (
             <button
                onClick={onComplete}
                className="mt-8 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
            >
                Skip Simulation / Continue
            </button>
        )}
      </div>
    </div>
  );
} 