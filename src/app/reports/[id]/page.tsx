
"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Redirect component to fix routing conflicts between [id] and [unitSlug].
 * All report viewing is now consolidated under /reports/view/[id].
 */
export default function ReportRedirect() {
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      router.replace(`/reports/view/${id}`);
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
