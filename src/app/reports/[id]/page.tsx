"use client";

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect component to resolve routing ambiguity.
 * Now standardized to use 'id' consistently across the registry.
 */
export default function LegacyReportRedirect({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    if (id) {
      // Check if the ID looks like a unit slug to handle legacy deep links
      const slugs = ['gasabodpu', 'kicukirodpu', 'nyarugengedpu', 'trs', 'sif', 'tfu'];
      if (slugs.includes(id.toLowerCase())) {
        router.replace(`/reports/unit/${id.toLowerCase()}`);
      } else {
        router.replace(`/reports/view/${id}`);
      }
    } else {
      router.replace('/reports');
    }
  }, [id, router]);

  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Re-routing to Registry...</p>
      </div>
    </div>
  );
}
