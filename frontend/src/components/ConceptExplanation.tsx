'use client'

interface VideoContent {
  url: string;
  title: string;
  description: string;
}

interface ConceptExplanationProps {
  title: string;
  description: string;
  videos: VideoContent[];
  onComplete: () => void;
  userName: string;
}

export default function ConceptExplanation({
  title,
  description,
  videos,
  onComplete,
  userName
}: ConceptExplanationProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <p className="mb-6 text-gray-700">{description}</p>
      
      <div className="space-y-8">
        {videos.map((video, index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">{video.title}</h3>
            <p className="text-gray-600">{video.description}</p>
            <div className="aspect-w-16 aspect-h-9">
              <video
                src={video.url}
                controls
                className="w-full rounded"
                onError={(e) => console.error("Video player error:", e)}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onComplete}
        className="w-full mt-8 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-150"
      >
        다음으로
      </button>
    </div>
  );
} 