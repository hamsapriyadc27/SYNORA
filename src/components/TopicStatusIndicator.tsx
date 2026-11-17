import React from 'react';
import { CheckCircle2, Circle, Clock, RotateCw } from 'lucide-react';
import { TopicStatus } from '../types/examap';

export const TopicStatusIndicator: React.FC<{ status: TopicStatus }> = ({ status }) => {
  if (status === 'Mastered') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        Mastered
      </span>
    );
  }
  if (status === 'Revised') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 whitespace-nowrap">
        <RotateCw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        Revised
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap">
      <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      Not Started
    </span>
  );
};
