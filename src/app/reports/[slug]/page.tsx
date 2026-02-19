"use client";

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Consolidated Redirect component to resolve Next.js routing conflicts.
 * This single dynamic segment handles both report IDs and unit slugs.
 */
export default function StandardizedRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug } = use(params);

  useEffect(() => {
    if (!slug) {
      router.replace('/reports');
      return;
    }

    const unitSlugs = ['gasabodpu', 'kicukirodpu', 'nyarugengedpu', 'trs', 'sif', 'tfu'];
    const normalizedSlug = slug.toLowerCase();

    if (unitSlugs.includes(normalizedSlug)) {
      router.replace(`/reports/unit/${normalizedSlug}`);
    } else {
      router.replace(`/reports/view/${slug}`);
    }
  }, [slug, router]);

  return (
    <div className="flex-1 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Re-routing Terminal...</p>
      </div>
    </div>
  );
}
