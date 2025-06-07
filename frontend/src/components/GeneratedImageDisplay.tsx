'use client';

import React, { useState, useEffect } from 'react';

interface GeneratedImageDisplayProps {
  imageUrl: string;
  onNext?: () => void;
}

const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ imageUrl, onNext }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching image from:', imageUrl);

        // If the URL starts with /api/, fetch it directly
        if (imageUrl.startsWith('/api/')) {
          const response = await fetch(imageUrl, {
            method: 'GET',
            headers: {
              'Accept': 'image/*,*/*;q=0.8',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            console.error('Failed to fetch image:', response.status, response.statusText);
            throw new Error(`이미지를 불러오는데 실패했습니다. (${response.status})`);
          }

          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          console.log('Created object URL for image:', objectUrl);
          setImageSrc(objectUrl);
        } else {
          // For external URLs (like CloudFront), use the proxy
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
            console.error('Failed to fetch image via proxy:', response.status, response.statusText);
            throw new Error(`이미지를 불러오는데 실패했습니다. (${response.status})`);
          }

          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          console.log('Created object URL for proxied image:', objectUrl);
          setImageSrc(objectUrl);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        setError(err instanceof Error ? err.message : '이미지를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();

    // Cleanup function to revoke object URLs
    return () => {
      if (imageSrc) {
        console.log('Cleaning up object URL:', imageSrc);
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full aspect-video bg-gray-100 rounded-lg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <div className="text-gray-500">이미지 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full aspect-video bg-red-50 rounded-lg">
        <div className="text-red-500 text-center p-4">
          <p className="font-semibold mb-2">이미지 로딩 실패</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
      {imageSrc && (
        <>
          <img
            src={imageSrc}
            alt="Generated image"
            className="w-full h-full object-contain"
            onLoad={() => {
              console.log('Image loaded successfully');
              setIsLoading(false);
            }}
            onError={(e) => {
              console.error('Image failed to load:', e);
              setError('이미지 로딩에 실패했습니다.');
            }}
          />
          {onNext && (
            <button
              onClick={onNext}
              className="absolute bottom-4 right-4 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out"
            >
              다음으로
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default GeneratedImageDisplay; 