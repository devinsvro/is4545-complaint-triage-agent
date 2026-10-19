import React from 'react';
import { Sparkles, XCircle } from 'lucide-react';

interface BatchProgressBannerProps {
  completed: number;
  total: number;
  onCancel: () => void;
}

export const BatchProgressBanner: React.FC<BatchProgressBannerProps> = ({
  completed,
  total,
  onCancel,
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-md w-full bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-slate-700 animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
          <span className="text-xs font-bold text-slate-100">
            Running 6-Step Clinical Triage
          </span>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white text-xs flex items-center transition"
        >
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Cancel
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
        <span>Processing complaints batch...</span>
        <span className="font-semibold text-teal-300">
          {completed} of {total} ({percentage}%)
        </span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-teal-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
