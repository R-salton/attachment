
"use client";

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Uniform Dynamic Path Handler.
 * Standardized parameter name to 'id' to resolve Next.js routing collision.
 */
export default function UnitSlugRedirect({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    if (id) {
      router.replace(`/reports/unit/${id.toLowerCase()}`);
    } else {
      router.replace('/reports');
    }
  }, [id, router]);

  return (
    <div className="flex-1 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Accessing Unit Archive...</p>
      </div>
    </div>
  );
}
