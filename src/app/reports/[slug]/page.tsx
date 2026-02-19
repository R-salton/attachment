
"use client";

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Uniform Dynamic Path Handler.
 * Changed parameter name to 'id' to match sibling folder for Next.js consistency.
 */
export default function SlugRedirect({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    if (id) {
      const unitSlugs = ['gasabodpu', 'kicukirodpu', 'nyarugengedpu', 'trs', 'sif', 'tfu'];
      if (unitSlugs.includes(id.toLowerCase())) {
        router.replace(`/reports/unit/${id.toLowerCase()}`);
      } else {
        router.replace(`/reports/view/${id}`);
      }
    } else {
      router.replace('/reports');
    }
  }, [id, router]);

  return (
    <div className="flex-1 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Synchronizing Vault...</p>
      </div>
    </div>
  );
}
