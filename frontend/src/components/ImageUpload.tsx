'use client'
import { useState, useRef } from 'react'

interface ImageUploadProps {
  onImageUpload: (imageFile: File) => void
  isProcessing: boolean
  processingMessage: string | null
}

export default function ImageUpload({ 
  onImageUpload, 
  isProcessing, 
  processingMessage
}: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleConfirmImage = () => {
    if (selectedImage && onImageUpload) {
      onImageUpload(selectedImage)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      <h2 className="text-xl font-semibold text-gray-800">사진 업로드</h2>
      <p className="text-gray-600 text-center px-4">
        딥페이크 영상 생성을 위해 얼굴이 명확하게 보이는 사진을 업로드해주세요.
      </p>
      
      <div className="w-full max-w-xs sm:max-w-sm">
        <div 
          className="aspect-square border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-center bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-full max-w-full object-contain rounded-md"
            />
          ) : (
            <div className="text-gray-500 flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>클릭하여 사진 선택</p>
              <p className="text-xs mt-1">(JPG, PNG)</p>
            </div>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/jpeg,image/png"
          className="hidden"
        />
      </div>

      <button
        onClick={handleConfirmImage}
        disabled={!selectedImage || isProcessing}
        className={`w-full max-w-xs sm:max-w-sm px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
          !selectedImage || isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isProcessing ? (processingMessage || '처리 중...') : '이 사진으로 결정'}
      </button>

      {isProcessing && processingMessage && (
        <div className="w-full max-w-xs sm:max-w-sm mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-blue-700 text-sm">{processingMessage}</p>
        </div>
      )}
    </div>
  )
} 