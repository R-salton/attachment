
"use client";

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

const SLUG_TO_UNIT: Record<string, string> = {
  'gasabodpu': 'Gasabo DPU',
  'kicukirodpu': 'Kicukiro DPU',
  'nyarugengedpu': 'Nyarugenge DPU',
  'trs': 'TRS',
  'sif': 'SIF',
  'tfu': 'TFU',
};

/**
 * Redirect component to resolve routing ambiguity and stabilize unit registry access.
 */
export default function UnitRedirect({ params }: { params: Promise<{ unitSlug: string }> }) {
  const router = useRouter();
  const { unitSlug } = use(params);

  useEffect(() => {
    if (unitSlug && SLUG_TO_UNIT[unitSlug.toLowerCase()]) {
      router.replace(`/reports/unit/${unitSlug.toLowerCase()}`);
    } else {
      router.replace('/reports');
    }
  }, [unitSlug, router]);

  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Accessing Station Vault...</p>
      </div>
    </div>
  );
}
