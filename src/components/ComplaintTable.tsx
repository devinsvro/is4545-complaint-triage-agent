import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Building2, 
  Eye, 
  RefreshCw, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { ComplaintRecord, SeverityLevel } from '../types/triage';

interface ComplaintTableProps {
  complaints: ComplaintRecord[];
  onSelectComplaint: (complaint: ComplaintRecord) => void;
  onRetriageComplaint: (id: string) => Promise<void>;
  onDeleteComplaint: (id: string) => void;
  isRetriagingId: string | null;
  onOpenUpload: () => void;
  onLoadSamples: () => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  onSelectComplaint,
  onRetriageComplaint,
  onDeleteComplaint,
  isRetriagingId,
  onOpenUpload,
  onLoadSamples,
}) => {
  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
        <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Complaints In Current View</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
          No records match your active search filters, or no complaint data has been loaded yet.
        </p>
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={onLoadSamples}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Load Realistic Clinical Samples
          </button>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Upload CSV / Excel
          </button>
        </div>
      </div>
    );
  }

  const getSeverityBadge = (level?: SeverityLevel) => {
    switch (level) {
      case 'LEVEL 4 – Critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white shadow-2xs animate-pulse">
            <AlertTriangle className="w-3 h-3 mr-1" />
            L4 Critical
          </span>
        );
      case 'LEVEL 3 – High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white shadow-2xs">
            <Clock className="w-3 h-3 mr-1" />
            L3 High
          </span>
        );
      case 'LEVEL 2 – Moderate':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-100 text-sky-800 border border-sky-200">
            L2 Moderate
          </span>
        );
      case 'LEVEL 1 – Low':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            L1 Low
          </span>
        );
    }
  };

  const getHumanReviewBadge = (status?: string) => {
    switch (status) {
      case 'Human Review Required':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="w-3 h-3 mr-1 text-rose-600" />
            Review Required
          </span>
        );
      case 'Human Review Recommended':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
            Review Recommended
          </span>
        );
      case 'AI Review Only':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            AI Triage
          </span>
        );
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'Immediate':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-50 text-rose-700 border border-rose-200">Immediate</span>;
      case 'Priority':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">Priority</span>;
      case 'Routine':
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600">Routine</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
            <tr>
              <th scope="col" className="px-4 py-3">ID & Origin</th>
              <th scope="col" className="px-4 py-3">Complaint Narrative</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Severity</th>
              <th scope="col" className="px-4 py-3">Escalation Route</th>
              <th scope="col" className="px-4 py-3">Oversight</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {complaints.map((item) => {
              const triage = item.triageResult;
              const isCritical = triage?.severityLevel === 'LEVEL 4 – Critical';

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/80 transition ${
                    isCritical ? 'bg-rose-50/20' : ''
                  }`}
                >
                  {/* ID & Origin */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    <div className="font-mono font-bold text-slate-900">{item.id}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.source}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.dateSubmitted}</div>
                  </td>

                  {/* Complaint Narrative snippet */}
                  <td className="px-4 py-3 max-w-sm sm:max-w-md align-top">
                    <div 
                      onClick={() => onSelectComplaint(item)}
                      className="cursor-pointer group"
                    >
                      <p className="text-slate-800 line-clamp-2 leading-relaxed group-hover:text-indigo-600 font-sans text-xs">
                        "{item.complaintText}"
                      </p>
                      {item.facilityOrDepartment && (
                        <span className="inline-block text-[10px] font-medium text-slate-500 mt-1">
                          Unit: {item.facilityOrDepartment}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    {triage ? (
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {triage.primaryCategory}
                        </span>
                        {triage.secondaryCategories.length > 0 && (
                          <span className="text-[10px] text-slate-400">
                            +{triage.secondaryCategories.length} secondary
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pending triage</span>
                    )}
                  </td>

                  {/* Severity */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    {triage ? (
                      getSeverityBadge(triage.severityLevel)
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded">
                        Untriaged
                      </span>
                    )}
                  </td>

                  {/* Escalation Route */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    {triage ? (
                      <div className="space-y-1">
                        <div className="flex items-center text-slate-800 font-medium text-xs">
                          <Building2 className="w-3 h-3 mr-1 text-slate-400" />
                          <span className="truncate max-w-[130px]" title={triage.recommendedDepartment}>
                            {triage.recommendedDepartment}
                          </span>
                        </div>
                        <div>{getPriorityBadge(triage.escalationPriority)}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Oversight */}
                  <td className="px-4 py-3 whitespace-nowrap align-top">
                    {triage ? (
                      <div className="space-y-1">
                        {getHumanReviewBadge(triage.humanReviewStatus)}
                        {item.humanReview && (
                          <span className="block text-[10px] text-teal-700 font-semibold">
                            ✓ Signed: {item.humanReview.status}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-right align-top">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onSelectComplaint(item)}
                        title="View Full 6-Step Triage & Verbatim Output"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onRetriageComplaint(item.id)}
                        disabled={isRetriagingId === item.id}
                        title="Re-run AI Triage"
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRetriagingId === item.id ? 'animate-spin text-indigo-600' : ''}`} />
                      </button>

                      <button
                        onClick={() => onDeleteComplaint(item.id)}
                        title="Delete complaint"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
