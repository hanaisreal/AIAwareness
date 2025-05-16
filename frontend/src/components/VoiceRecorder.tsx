'use client'
import { useState, useRef, useEffect } from 'react'

interface VoiceRecorderProps {
  onVoiceCloned: (id: string) => void
}

export default function VoiceRecorder({ onVoiceCloned }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // The short script
  const recordingScript = "안녕하세요. 지금부터 목소리 녹음을 시작하겠습니다. 오늘은 날씨가 참 좋네요. 이런 날에는 산책을 하고 싶어집니다. 제가 요즘 즐겨 하는 취미는 책 읽기입니다. 새로운 지식을 배우는 즐거움이 큽니다. 제 목소리가 잘 녹음되기를 바랍니다. 감사합니다.";

  useEffect(() => {
    console.log("Audio URL updated:", audioUrl);
    return () => {
      if (audioUrl) {
        console.log("Revoking old audio URL:", audioUrl);
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      console.log("Attempting to start recording...");
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setAudioBlob(null);
        console.log("Revoked previous audio URL and cleared blob.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100, // Common sample rate
        }
      });
      console.log("Microphone stream obtained.");

      // Try a more common MIME type if 'audio/webm;codecs=opus' is problematic
      // Browsers usually support 'audio/webm' or 'audio/ogg'
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4', // Less common for MediaRecorder but worth a try if others fail
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        console.error("No suitable MIME type found for MediaRecorder.");
        alert("Your browser doesn't support the required audio recording formats.");
        return;
      }
      console.log("Using MIME type:", selectedMimeType);


      const recorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log("Data available, chunk size:", e.data.size);
        }
      };

      recorder.onstop = () => {
        console.log("Recording stopped. Number of chunks:", chunksRef.current.length);
        if (chunksRef.current.length === 0) {
          console.error("No data chunks recorded.");
          alert("No audio data was recorded. Please check your microphone.");
          return;
        }
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        const url = URL.createObjectURL(blob);
        console.log("Blob created:", blob);
        console.log("Generated audio URL for playback:", url);
        setAudioBlob(blob);
        setAudioUrl(url); // This should trigger the useEffect and update the <audio> src
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        alert(`Recording error: ${event.error.name} - ${event.error.message}`);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Start recording, and get data every 1 second (optional)
      setIsRecording(true);
      console.log("Recording started.");
    } catch (error: any) {
      console.error('Error starting recording:', error);
      alert(`Could not access microphone: ${error.message}. Please ensure microphone permissions are granted and your microphone is working.`);
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stream tracks are stopped by the browser when MediaRecorder stops,
      // but explicit stop can be a good practice.
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      console.log("Recording stop requested by user.");
    }
  }

  const handleUpload = async () => {
    if (!audioBlob) {
      console.error("No audio blob to upload.");
      alert("No recording available to upload.");
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      const fileExtension = audioBlob.type.split('/')[1].split(';')[0];
      
      formData.append('audio_file', audioBlob, `recording.${fileExtension}`);
      console.log("Uploading audio blob with field 'audio_file':", audioBlob.type, audioBlob.size);

      const response = await fetch('http://localhost:8000/api/clone-voice', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed with status:", response.status, errorText);
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Upload successful, voice_id:", data.voice_id);
      onVoiceCloned(data.voice_id);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Failed to upload recording: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg text-gray-800">
      <h2 className="text-2xl font-semibold mb-4 text-center">Step 1: Record Your Voice</h2>
      
      {/* Display the script */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-medium text-blue-700 mb-2">Please read the following text aloud:</h3>
        <p className="text-blue-900 whitespace-pre-line leading-relaxed">
          {recordingScript}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-8 py-3 rounded-full text-white font-semibold text-lg transition-colors duration-150
            ${isRecording 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={isProcessing}
        >
          {isRecording ? '🔴 Stop Recording' : '🎤 Start Recording'}
        </button>

        {audioUrl && (
          <div className="w-full max-w-md mt-6 p-4 bg-gray-50 rounded-lg shadow">
            <div className="mb-3">
              <p className="text-md font-medium text-gray-700 mb-1">Preview your recording:</p>
              <audio 
                src={audioUrl} 
                controls 
                className="w-full"
                preload="auto"
                onLoadedData={() => console.log("Audio data loaded into player.")}
                onError={(e: any) => console.error("Audio player error:", e.target.error)}
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={!audioBlob || isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold text-lg transition-colors duration-150 disabled:bg-gray-400 disabled:opacity-70"
            >
              {isProcessing ? 'Processing...' : 'Continue to Next Step'}
            </button>
          </div>
        )}
      </div>
      {/* Optional: Add recording tips */}
      <div className="mt-8 text-sm text-gray-600 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-1">Quick Recording Tips:</h4>
        <ul className="list-disc list-inside text-yellow-700">
          <li>Ensure your room is quiet.</li>
          <li>Speak clearly and naturally.</li>
          <li>Maintain a consistent distance from your microphone.</li>
        </ul>
      </div>
    </div>
  )
}