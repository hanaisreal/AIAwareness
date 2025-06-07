import { FC } from 'react';

interface GeneratedImageDisplayProps {
  imageUrl: string;
  onNext?: () => void;
}

declare const GeneratedImageDisplay: FC<GeneratedImageDisplayProps>;

export default GeneratedImageDisplay; 