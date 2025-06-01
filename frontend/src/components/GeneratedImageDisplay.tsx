import React, { useState, useEffect, useRef } from 'react';

interface GeneratedImageDisplayProps {
  imageUrl: string;
  onClose?: () => void;
  onNext?: () => void;
}

const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ imageUrl, onClose, onNext }) => {
  const [blobImageUrl, setBlobImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const imageSuccessfullyFetched = useRef(false); // Ref to track successful fetch

  useEffect(() => {
    let progressTimer: NodeJS.Timeout | null = null;
    let retryTimer: NodeJS.Timeout | null = null;
    let initialFetchDelayTimer: NodeJS.Timeout | null = null;
    
    const fetchImageAsBlob = async () => {
      console.log('Fetching image as blob:', imageUrl);
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      console.log('Using proxy URL:', proxyUrl);
      
      // Reset for fetch attempt, but keep spinner if already loading
      if (!isLoading) setIsLoading(true);
      if (loadingProgress < 100 && !imageSuccessfullyFetched.current) setLoadingProgress(0); // Reset progress only if not already completed from a successful fetch
      setError(null);
      imageSuccessfullyFetched.current = false;

      try {
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'image/*,*/*;q=0.8',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setBlobImageUrl(objectUrl);
        imageSuccessfullyFetched.current = true; // Mark as successful
        console.log('Successfully created blob URL for image');
        // Progress will continue to 100% and then isLoading will be set to false

      } catch (err: any) {
        console.error('Error fetching image as blob:', err);
        if (progressTimer) clearInterval(progressTimer);
        
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setError(`이미지 로딩 오류 (${err.message || 'Unknown error'}). ${retryCount + 1}/3 번째 재시도 중...`);
          retryTimer = setTimeout(() => {
            fetchImageAsBlob();
          }, 5000);
        } else {
          setError(`이미지를 불러오는데 실패했습니다 (${err.message || 'Unknown error'}). 새로고침하거나 다시 시도해주세요.`);
          setIsLoading(false); // Stop loading on final failure
        }
      }
    };

    // Start loading progress simulation only if not already successfully fetched
    if (isLoading && !imageSuccessfullyFetched.current) {
        progressTimer = setInterval(() => {
            setLoadingProgress(prev => {
              if (prev >= 100) {
                if (progressTimer) clearInterval(progressTimer);
                // If image is fetched successfully, now we can stop loading
                if (imageSuccessfullyFetched.current) {
                    setIsLoading(false);
                }
                // If it reached 100% but image fetch failed and no retries left, setIsLoading(false) is handled in catch.
                // If retries are happening, isLoading should remain true.
                return 100;
              }
              return prev + 10;
            });
          }, 200); // Faster progress for better UX
    }

    // Initial delay before first fetch attempt
    initialFetchDelayTimer = setTimeout(() => {
      fetchImageAsBlob();
    }, 1000); // Reduced initial delay, was 5000ms

    return () => {
      if (progressTimer) clearInterval(progressTimer);
      if (retryTimer) clearTimeout(retryTimer);
      if (initialFetchDelayTimer) clearTimeout(initialFetchDelayTimer);
      if (blobImageUrl) {
        URL.revokeObjectURL(blobImageUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, retryCount]); // Trigger effect if imageUrl changes or on new retry attempt

  // Effect to handle successful fetch completion when progress reaches 100
  useEffect(() => {
    if (loadingProgress >= 100 && imageSuccessfullyFetched.current) {
      setIsLoading(false);
    }
  }, [loadingProgress]);

  const renderLoadingState = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 backdrop-blur-sm">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
      <div className="w-60 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-orange-500 transition-all duration-200 ease-linear"
          style={{ width: `${loadingProgress}%` }}
        ></div>
      </div>
      <p className="mt-3 text-sm text-orange-700 font-medium">
        {error && error.includes('재시도') ? error : 
         error ? '오류 발생' : `이미지 생성 완료! 표시 준비 중... ${loadingProgress}%`}
      </p>
      {error && !error.includes('재시도') && <p className="text-xs text-gray-600 mt-1 px-4 text-center">{error}</p>}
    </div>
  );

  const renderErrorState = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-4">
        <p className="text-red-700 font-semibold mb-2">이미지 로딩 실패</p>
        <p className="text-red-600 text-sm text-center">{error}</p>
        {/* You could add a manual retry button here if desired */}
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-xl flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-4">
        <h1 className="text-2xl font-bold text-orange-600">생성된 얼굴 교체 이미지</h1>
        {/* onClose can be used if a direct close is needed, e.g. from a modal. 
            For page flow, onNext is primary. */}
        {onClose && !onNext && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-orange-600 text-2xl"
            aria-label="Close"
          >
            &times;
          </button>
        )}
      </div>
      
      <div className="relative w-full aspect-[4/3] max-h-[60vh] bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center shadow-md">
        <img
          src={blobImageUrl || ''} 
          alt={blobImageUrl ? "Generated Deepfake Image" : "Loading image"}
          className={`w-full h-full object-contain transition-opacity duration-500 ease-in-out ${
            isLoading || !blobImageUrl || error ? 'opacity-0' : 'opacity-100'
          }`}
          // onError not very useful here as we fetch via proxy first.
          // If blob URL itself fails (e.g. revoked), it won't trigger onError well.
        />
        
        {/* Loading or specific error overlay */} 
        {isLoading && renderLoadingState()}
        {!isLoading && error && renderErrorState()} 

      </div>
      
      {!isLoading && !error && onNext && (
        <button 
          onClick={onNext}
          className="mt-8 px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          다음 단계로
        </button>
      )}
       {/* Optional: Show a close/return button if onNext is not primary or as a fallback */}
      {!isLoading && !error && !onNext && onClose && (
         <button 
          onClick={onClose}
          className="mt-8 px-8 py-3 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition duration-150 ease-in-out"
        >
          닫기
        </button>
      )}
    </div>
  );
};

export default GeneratedImageDisplay; 