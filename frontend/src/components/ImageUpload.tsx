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
    <div className="flex flex-col items-center space-y-4 py-2">
      <h2 className="text-lg font-semibold text-orange-600">사진 업로드</h2>
      <p className="text-gray-700 text-center px-4 text-sm">
        딥페이크 이미지 생성을 위해 얼굴이 명확하게 보이는 사진을 업로드해주세요.
      </p>
      
      <div className="w-full max-w-[200px]">
        <div 
          className="aspect-square border-2 border-dashed border-orange-300 rounded-lg p-2 text-center cursor-pointer hover:border-orange-500 transition-colors flex items-center justify-center bg-orange-50/50 hover:bg-orange-50"
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-full max-w-full object-contain rounded-md"
            />
          ) : (
            <div className="text-orange-500 flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">클릭하여 사진 선택</p>
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
        className={`w-full max-w-[200px] px-4 py-2 rounded-lg font-semibold text-white transition-colors shadow-md hover:shadow-lg ${
          !selectedImage || isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
        }`}
      >
        {isProcessing ? (processingMessage || '이미지 처리 중...') : '이 사진으로 결정'}
      </button>

      {isProcessing && processingMessage && (
        <div className="w-full max-w-[200px] mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-center">
          <p className="text-orange-700 text-xs">{processingMessage}</p>
        </div>
      )}
    </div>
  )
} 