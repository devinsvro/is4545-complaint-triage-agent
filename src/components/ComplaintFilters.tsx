import React from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Download, 
  FileSpreadsheet, 
  Play, 
  CheckSquare
} from 'lucide-react';
import { 
  CATEGORIES_LIST, 
  SEVERITY_LIST, 
  DEPARTMENTS_LIST, 
  ESCALATION_PRIORITIES, 
  HUMAN_REVIEW_STATUSES 
} from '../types/triage';

interface ComplaintFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedSeverity: string;
  onSeverityChange: (val: string) => void;
  selectedPriority: string;
  onPriorityChange: (val: string) => void;
  selectedHumanReview: string;
  onHumanReviewChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (val: string) => void;
  onResetFilters: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onBatchTriagePending: () => void;
  pendingCount: number;
  totalFilteredCount: number;
  isProcessingBatch: boolean;
}

export const ComplaintFilters: React.FC<ComplaintFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedSeverity,
  onSeverityChange,
  selectedPriority,
  onPriorityChange,
  selectedHumanReview,
  onHumanReviewChange,
  selectedCategory,
  onCategoryChange,
  selectedDepartment,
  onDepartmentChange,
  onResetFilters,
  onExportCSV,
  onExportExcel,
  onBatchTriagePending,
  pendingCount,
  totalFilteredCount,
  isProcessingBatch,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedSeverity) ||
    Boolean(selectedPriority) ||
    Boolean(selectedHumanReview) ||
    Boolean(selectedCategory) ||
    Boolean(selectedDepartment);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
      {/* Top Search & Actions Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search complaints by narrative keywords, ID, or clinic..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {pendingCount > 0 && (
            <button
              onClick={onBatchTriagePending}
              disabled={isProcessingBatch}
              className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-2xs transition"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
              Triage Pending ({pendingCount})
            </button>
          )}

          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={onExportCSV}
              title="Export filtered records to CSV"
              className="px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 flex items-center transition"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
              CSV
            </button>
            <div className="h-4 w-px bg-slate-300"></div>
            <button
              onClick={onExportExcel}
              title="Export filtered records to Excel spreadsheet"
              className="px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 flex items-center transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        {/* Severity */}
        <div>
          <select
            value={selectedSeverity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Severity Levels</option>
            {SEVERITY_LIST.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Escalations</option>
            {ESCALATION_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p} Priority</option>
            ))}
          </select>
        </div>

        {/* Human Review */}
        <div>
          <select
            value={selectedHumanReview}
            onChange={(e) => onHumanReviewChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Review Statuses</option>
            {HUMAN_REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500 truncate"
          >
            <option value="">All Categories</option>
            {CATEGORIES_LIST.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500 truncate"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS_LIST.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Reset / Count Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            {totalFilteredCount} matching
          </span>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
