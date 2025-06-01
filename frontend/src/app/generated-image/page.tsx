'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GeneratedImageDisplay from '@/components/GeneratedImageDisplay';
// import Link from 'next/link'; // No longer using Link for the primary action button

export default function GeneratedImagePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const imageUrl = searchParams.get('url');
  const fromScenario = searchParams.get('fromScenario'); // Get the scenario this page was called from

  if (!imageUrl) {
    // Redirect or show an error if no URL is provided
    // For now, redirecting to a safe page, e.g., Part 1 scenarios
    if (typeof window !== 'undefined') {
        router.replace('/scenarios/part1'); // Or a more specific error page
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-4">
            <p className="text-orange-600">이미지 URL이 제공되지 않았습니다. 이전 페이지로 돌아갑니다...</p>
        </div>
    );
  }

  const handleNextStep = () => {
    if (fromScenario === '1') {
      // Navigate to Scenario 2 of Part 1
      // TODO: Create frontend/src/app/scenarios/part1/scenario2/page.tsx
      router.push('/scenarios/part1/scenario2'); 
    } else if (fromScenario === '2') {
      // After Scenario 2 of Part 1, navigate to Part 2 introduction or a summary page
      // For now, let's assume it goes to the Part 2 main page
      router.push('/scenarios/part2'); 
    } else {
      // Default fallback or if fromScenario is not specified (e.g. from a different flow)
      router.push('/scenarios/part1'); // Go back to Part 1 main page
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-4">
        <GeneratedImageDisplay imageUrl={decodeURIComponent(imageUrl)} onNext={handleNextStep} />
        {/* The "다음 단계로" button is now inside GeneratedImageDisplay and will call handleNextStep 
            The Link button below can be removed or kept as a secondary option if desired. 
            For a cleaner UI, typically one primary action is preferred after image display.
        */}
        {/* <div className="mt-8 text-center">
            <Link href="/scenarios/part1" legacyBehavior>
                <a className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-150 ease-in-out">
                    Part 1 메인으로 돌아가기
                </a>
            </Link>
        </div> */}
    </div>
  );
} 