import React, { useState } from 'react';

export default function UserInfoForm({ onSubmit }: { onSubmit: (name: string, age: string) => void }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  return (
    <form
      className="flex flex-col items-center space-y-4"
      onSubmit={e => {
        e.preventDefault();
        if (name && age) onSubmit(name, age);
      }}
    >
      <input
        className="border p-2 rounded"
        placeholder="이름을 입력하세요"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        className="border p-2 rounded"
        placeholder="나이를 입력하세요"
        value={age}
        onChange={e => setAge(e.target.value)}
        type="number"
        required
      />
      <button className="bg-blue-500 text-white px-6 py-2 rounded" type="submit">
        시작하기
      </button>
    </form>
  );
} 