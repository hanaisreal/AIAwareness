'use client'

interface EducationalVideoProps {
  onComplete: () => void;
}

export default function EducationalVideo({ onComplete }: EducationalVideoProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Understanding Voice Clone Scams</h2>
      <div className="aspect-w-16 aspect-h-9 mb-4">
        <video
          src="/educational-video.mp4"
          controls
          onEnded={onComplete}
          className="w-full rounded"
        />
      </div>
      <button
        onClick={onComplete}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
      >
        Continue
      </button>
    </div>
  );
} 