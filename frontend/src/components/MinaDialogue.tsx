import React from 'react';
import { MINA_CONFIG } from '@/constants/minaConfig';

interface MinaDialogueProps {
  text: string | null;
  isLoadingAudio: boolean;
  colorScheme?: {
    bg: string;
    text: string;
  };
}

export default function MinaDialogue({ 
  text, 
  isLoadingAudio, 
  colorScheme = {
    bg: 'bg-orange-50/80',
    text: 'text-orange-700'
  }
}: MinaDialogueProps) {
  if (!text || !MINA_CONFIG.showScript) return null;

  return (
    <div className={`mb-4 p-3 ${colorScheme.bg} rounded-lg shadow`}>
      <p className={`${colorScheme.text} whitespace-pre-line font-medium text-center`}>
        {text}
      </p>
    </div>
  );
} 