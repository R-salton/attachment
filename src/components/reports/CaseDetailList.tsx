"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';

interface CaseDetail {
  caseType: string;
  count: number;
}

interface CaseDetailListProps {
  label: string;
  cases: CaseDetail[];
  onChange: (cases: CaseDetail[]) => void;
}

export function CaseDetailList({ label, cases, onChange }: CaseDetailListProps) {
  const [newType, setNewType] = useState('');
  const [newCount, setNewCount] = useState<number>(0);

  // Ensure cases is always treated as an array
  const safeCases = cases || [];

  const handleAdd = () => {
    if (!newType) return;
    onChange([...safeCases, { caseType: newType, count: newCount }]);
    setNewType('');
    setNewCount(0);
  };

  const handleRemove = (index: number) => {
    onChange(safeCases.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <Label className="text-sm font-bold uppercase tracking-wider">{label}</Label>
      
      <div className="space-y-2">
        {safeCases.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border shadow-sm">
            <span className="flex-1 font-medium">{item.caseType}</span>
            <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded">{item.count}</span>
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="text-destructive h-8 w-8"
              onClick={() => handleRemove(idx)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Input 
            placeholder="Case Type (e.g. Theft)" 
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="w-20 space-y-1">
          <Input 
            type="number"
            value={newCount}
            onChange={(e) => setNewCount(parseInt(e.target.value) || 0)}
            className="h-9"
          />
        </div>
        <Button type="button" size="sm" onClick={handleAdd} className="h-9">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
