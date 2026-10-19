import React from 'react';
import { 
  ShieldCheck, 
  Upload, 
  PlusCircle, 
  Database, 
  AlertTriangle,
  FileSpreadsheet,
  Activity
} from 'lucide-react';

interface NavbarProps {
  totalCount: number;
  criticalCount: number;
  humanReviewCount: number;
  pendingCount: number;
  onOpenUpload: () => void;
  onOpenNewComplaint: () => void;
  onLoadSamples: () => void;
  isProcessingBatch: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCount,
  criticalCount,
  humanReviewCount,
  pendingCount,
  onOpenUpload,
  onOpenNewComplaint,
  onLoadSamples,
  isProcessingBatch,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-inner">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  Complaint Triage Agent
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1 text-teal-400" />
                  Healthcare Assistant
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Clinical Safety, Compliance, Severity & Escalation Routing
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            {criticalCount > 0 && (
              <div className="flex items-center px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse font-medium">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                {criticalCount} Critical (L4)
              </div>
            )}
            {humanReviewCount > 0 && (
              <div className="flex items-center px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-400" />
                {humanReviewCount} Human Review
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-center px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-medium">
                {pendingCount} Pending Triage
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onLoadSamples}
              disabled={isProcessingBatch}
              title="Load realistic patient complaint examples"
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Database className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
              <span className="hidden sm:inline">Load Sample Data</span>
              <span className="sm:hidden">Samples</span>
            </button>

            <button
              onClick={onOpenUpload}
              disabled={isProcessingBatch}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Upload CSV / Excel</span>
              <span className="sm:hidden">Upload</span>
            </button>

            <button
              onClick={onOpenNewComplaint}
              disabled={isProcessingBatch}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">New Triage</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
