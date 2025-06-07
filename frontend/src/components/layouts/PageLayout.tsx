import React from 'react';
import { commonStyles } from '@/styles/common';
import { animations } from '@/styles/animations';

interface PageLayoutProps {
  children: React.ReactNode;
  gradient?: 'home' | 'part1' | 'part2';
  className?: string;
}

export default function PageLayout({ 
  children, 
  gradient = 'home',
  className = ''
}: PageLayoutProps) {
  return (
    <div className={`${commonStyles.pageContainer} ${commonStyles.gradients[gradient]} ${className}`}>
      <div className={commonStyles.contentContainer}>
        {children}
      </div>
      <style jsx global>{`
        ${animations.fadeIn}
        ${animations.pulse}
        ${animations.slideIn}
        ${animations.scaleIn}
      `}</style>
    </div>
  );
} 