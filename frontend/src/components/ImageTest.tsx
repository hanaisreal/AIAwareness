import React, { useState, useEffect } from 'react';

const ImageTest: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>('https://d2qf6ukcym4kn9.cloudfront.net/final_deepfake_scenario1_man-90643d3c-4ab4-4760-a7fa-9f27dfddf10e-1851.png');
  const [blobImageUrl, setBlobImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const fetchImageAsBlob = async () => {
      try {
        console.log('Fetching image as blob:', imageUrl);
        setIsLoading(true);
        setLoadingProgress(0);
        setError(null);
        
        // Start loading progress simulation
        timer = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 100) {
              clearInterval(timer);
              return 100;
            }
            return prev + 10;
          });
        }, 500);

        // Use the backend proxy endpoint
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        console.log('Using proxy URL:', proxyUrl);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'image/*,*/*;q=0.8',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setBlobImageUrl(objectUrl);
        console.log('Successfully created blob URL for image');
      } catch (error) {
        console.error('Error fetching image as blob:', error);
        setError('이미지를 불러오는데 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
        if (timer) {
          clearInterval(timer);
        }
      }
    };

    fetchImageAsBlob();

    return () => {
      if (timer) {
        clearInterval(timer);
      }
      if (blobImageUrl) {
        URL.revokeObjectURL(blobImageUrl);
      }
    };
  }, [imageUrl]);

  const renderLoadingSpinner = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
          style={{ width: `${loadingProgress}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm text-gray-600">이미지 로딩 중... {loadingProgress}%</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">이미지 테스트 페이지</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이미지 URL:
        </label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        {isLoading && renderLoadingSpinner()}
        <img
          src={blobImageUrl || imageUrl}
          alt="Test image"
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={(e) => {
            console.error('Image loading error:', e);
            setError('이미지를 불러오는데 실패했습니다. 다시 시도해주세요.');
          }}
        />
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">디버그 정보:</h2>
        <pre className="text-sm text-gray-600 overflow-x-auto">
          {JSON.stringify({
            imageUrl,
            blobImageUrl,
            isLoading,
            error,
            loadingProgress
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ImageTest; 