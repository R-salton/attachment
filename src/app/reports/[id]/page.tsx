
"use client";

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Uniform Dynamic Path Handler.
 * Consolidates dynamic routing logic into a single segment to resolve Next.js conflicts.
 */
export default function StandardizedRedirect({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    if (!id) {
      router.replace('/reports');
      return;
    }

    const unitSlugs = ['gasabodpu', 'kicukirodpu', 'nyarugengedpu', 'trs', 'sif', 'tfu'];
    const normalizedId = id.toLowerCase();

    // Check if the parameter is a recognized station code
    if (unitSlugs.includes(normalizedId)) {
      router.replace(`/reports/unit/${normalizedId}`);
    } else {
      // Otherwise, assume it's a situational report ID
      router.replace(`/reports/view/${id}`);
    }
  }, [id, router]);

  return (
    <div className="flex-1 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Registry...</p>
      </div>
    </div>
  );
}
