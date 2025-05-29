'use client'
import { useState } from 'react'

interface UserInfo {
  name: string
  age: string
  gender: 'male' | 'female' | 'other'
}

interface UserInfoFormProps {
  onSubmit: (userInfo: UserInfo) => void
}

export default function UserInfoForm({ onSubmit }: UserInfoFormProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    age: '',
    gender: 'other'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(userInfo)
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">참여자 정보</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            type="text"
            id="name"
            value={userInfo.name}
            onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="홍길동"
          />
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            나이
          </label>
          <input
            type="number"
            id="age"
            value={userInfo.age}
            onChange={(e) => setUserInfo(prev => ({ ...prev, age: e.target.value }))}
            required
            min="1"
            max="120"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="25"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            성별
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="male"
                checked={userInfo.gender === 'male'}
                onChange={(e) => setUserInfo(prev => ({ ...prev, gender: 'male' }))}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">남성</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="female"
                checked={userInfo.gender === 'female'}
                onChange={(e) => setUserInfo(prev => ({ ...prev, gender: 'female' }))}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">여성</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="other"
                checked={userInfo.gender === 'other'}
                onChange={(e) => setUserInfo(prev => ({ ...prev, gender: 'other' }))}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">기타</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          시작하기
        </button>
      </form>
    </div>
  )
} 