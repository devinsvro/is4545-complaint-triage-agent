import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  FileText, 
  TrendingUp,
  Building2,
  Activity
} from 'lucide-react';
import { ComplaintRecord, SeverityLevel, Department, RiskType } from '../types/triage';

interface DashboardStatsProps {
  complaints: ComplaintRecord[];
  onSelectSeverityFilter: (severity: string) => void;
  onSelectDepartmentFilter: (dept: string) => void;
  onSelectHumanReviewFilter: (status: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  complaints,
  onSelectSeverityFilter,
  onSelectDepartmentFilter,
  onSelectHumanReviewFilter,
}) => {
  const total = complaints.length;
  const triaged = complaints.filter((c) => c.triageResult);
  const pending = complaints.filter((c) => !c.triageResult);

  const l4Critical = triaged.filter((c) => c.triageResult?.severityLevel === 'LEVEL 4 – Critical').length;
  const l3High = triaged.filter((c) => c.triageResult?.severityLevel === 'LEVEL 3 – High').length;
  const l2Moderate = triaged.filter((c) => c.triageResult?.severityLevel === 'LEVEL 2 – Moderate').length;
  const l1Low = triaged.filter((c) => c.triageResult?.severityLevel === 'LEVEL 1 – Low').length;

  const humanReviewRequired = triaged.filter((c) => c.triageResult?.humanReviewStatus === 'Human Review Required').length;
  const immediateEscalation = triaged.filter((c) => c.triageResult?.escalationPriority === 'Immediate').length;

  // Department counts
  const deptCounts: Record<string, number> = {};
  triaged.forEach((c) => {
    const dept = c.triageResult?.recommendedDepartment;
    if (dept) {
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    }
  });

  const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);

  // Risk counts
  const riskCounts: Record<string, number> = {};
  triaged.forEach((c) => {
    c.triageResult?.riskFlags.forEach((r) => {
      riskCounts[r.risk] = (riskCounts[r.risk] || 0) + 1;
    });
  });

  const sortedRisks = Object.entries(riskCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* Top Critical Alert Bar if Level 4 exists */}
      {l4Critical > 0 && (
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Safety & Compliance Alert: {l4Critical} Level 4 Critical Grievance{l4Critical > 1 ? 's' : ''} Detected
              </p>
              <p className="text-xs text-rose-100">
                Requires Immediate Escalation (&lt; 2-hour SLA) and mandatory human oversight investigation.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectSeverityFilter('LEVEL 4 – Critical')}
            className="px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg shadow-sm transition"
          >
            View Critical Queue
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Complaints</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{total}</div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-teal-600 font-semibold">{triaged.length}</span> triaged •{' '}
            <span className="text-indigo-600 font-semibold">{pending.length}</span> pending
          </div>
        </div>

        {/* Level 4 Critical */}
        <div 
          onClick={() => onSelectSeverityFilter('LEVEL 4 – Critical')}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs hover:border-rose-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Level 4 Critical</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{l4Critical}</div>
          <div className="text-xs text-rose-700 mt-1 font-medium">Immediate Safety/Legal</div>
        </div>

        {/* Level 3 High */}
        <div 
          onClick={() => onSelectSeverityFilter('LEVEL 3 – High')}
          className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs hover:border-amber-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Level 3 High</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{l3High}</div>
          <div className="text-xs text-amber-700 mt-1 font-medium">Potential Harm / Priority</div>
        </div>

        {/* Human Review Required */}
        <div 
          onClick={() => onSelectHumanReviewFilter('Human Review Required')}
          className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Human Review</span>
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{humanReviewRequired}</div>
          <div className="text-xs text-indigo-700 mt-1 font-medium">Mandatory Oversight</div>
        </div>

        {/* Immediate Escalation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Immediate SLA</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{immediateEscalation}</div>
          <div className="text-xs text-slate-500 mt-1">&lt; 2-Hour Response Time</div>
        </div>
      </div>

      {/* Severity Distribution & Department Routing Mini-Panels */}
      {triaged.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Severity bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
              <span>Severity Level Distribution</span>
              <span className="text-slate-400 font-normal">{triaged.length} Classified</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-rose-700 font-bold">LEVEL 4 – Critical</span>
                  <span className="text-slate-600">{l4Critical} ({Math.round((l4Critical / triaged.length) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-600 h-2 rounded-full" style={{ width: `${(l4Critical / triaged.length) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-amber-700 font-bold">LEVEL 3 – High</span>
                  <span className="text-slate-600">{l3High} ({Math.round((l3High / triaged.length) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(l3High / triaged.length) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-sky-700 font-bold">LEVEL 2 – Moderate</span>
                  <span className="text-slate-600">{l2Moderate} ({Math.round((l2Moderate / triaged.length) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${(l2Moderate / triaged.length) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-emerald-700 font-bold">LEVEL 1 – Low</span>
                  <span className="text-slate-600">{l1Low} ({Math.round((l1Low / triaged.length) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(l1Low / triaged.length) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Department routing breakdown */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
              <span className="flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-teal-600" />
                Department Routing Allocation
              </span>
              <span className="text-slate-400 font-normal">Top Targets</span>
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {sortedDepts.map(([dept, count]) => (
                <div
                  key={dept}
                  onClick={() => onSelectDepartmentFilter(dept)}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition"
                >
                  <span className="text-slate-700 font-medium truncate max-w-[240px]">{dept}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    {count} {count === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
