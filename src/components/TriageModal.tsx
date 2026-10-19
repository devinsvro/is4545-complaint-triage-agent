import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Building2, 
  UserCheck, 
  FileText, 
  RefreshCw, 
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles
} from 'lucide-react';
import { 
  ComplaintRecord, 
  SEVERITY_LIST, 
  DEPARTMENTS_LIST, 
  CATEGORIES_LIST,
  SeverityLevel,
  Department,
  ComplaintCategory,
  HumanReviewOverride
} from '../types/triage';

interface TriageModalProps {
  complaint: ComplaintRecord | null;
  onClose: () => void;
  onRetriage: (id: string) => Promise<void>;
  onSaveHumanReview: (id: string, review: HumanReviewOverride) => void;
  isRetriaging: boolean;
}

export const TriageModal: React.FC<TriageModalProps> = ({
  complaint,
  onClose,
  onRetriage,
  onSaveHumanReview,
  isRetriaging,
}) => {
  const [copied, setCopied] = useState(false);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [reviewerName, setReviewerName] = useState(complaint?.humanReview?.reviewedBy || 'Nurse Supervisor / Quality Lead');
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Modified' | 'Rejected'>(complaint?.humanReview?.status || 'Approved');
  const [overrideSeverity, setOverrideSeverity] = useState<SeverityLevel | ''>(complaint?.humanReview?.overriddenSeverity || '');
  const [overrideDept, setOverrideDept] = useState<Department | ''>(complaint?.humanReview?.overriddenDepartment || '');
  const [overrideCategory, setOverrideCategory] = useState<ComplaintCategory | ''>(complaint?.humanReview?.overriddenCategory || '');
  const [reviewNotes, setReviewNotes] = useState(complaint?.humanReview?.notes || '');

  if (!complaint) return null;

  const triage = complaint.triageResult;

  const handleCopy = () => {
    if (!triage) return;
    navigator.clipboard.writeText(triage.formattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    if (!triage) return;
    const content = `=====================================================
HEALTHCARE COMPLAINT TRIAGE REPORT
=====================================================
Complaint ID: ${complaint.id}
Source: ${complaint.source}
Date Submitted: ${complaint.dateSubmitted}
Facility / Department: ${complaint.facilityOrDepartment || 'N/A'}
Triage Engine: ${triage.triageEngine.toUpperCase()}
Triaged Timestamp: ${triage.triagedAt}

PATIENT COMPLAINT NARRATIVE:
"${complaint.complaintText}"

-----------------------------------------------------
STANDARDIZED CLINICAL TRIAGE OUTPUT
-----------------------------------------------------
${triage.formattedOutput}

-----------------------------------------------------
HUMAN REVIEW AUDIT LOG:
-----------------------------------------------------
Status: ${complaint.humanReview?.status || 'Pending Human Sign-off'}
Reviewed By: ${complaint.humanReview?.reviewedBy || 'N/A'}
Review Date: ${complaint.humanReview?.reviewedAt || 'N/A'}
Reviewer Notes: ${complaint.humanReview?.notes || 'None'}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Triage_Report_${complaint.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) return;

    const review: HumanReviewOverride = {
      reviewedBy: reviewerName.trim(),
      reviewedAt: new Date().toISOString(),
      status: reviewStatus,
      notes: reviewNotes.trim(),
      originalSeverity: triage?.severityLevel,
      overriddenSeverity: overrideSeverity || undefined,
      originalDepartment: triage?.recommendedDepartment,
      overriddenDepartment: overrideDept || undefined,
      originalCategory: triage?.primaryCategory,
      overriddenCategory: overrideCategory || undefined,
    };

    onSaveHumanReview(complaint.id, review);
    setShowOverrideForm(false);
  };

  const getSeverityStyle = (level?: SeverityLevel) => {
    switch (level) {
      case 'LEVEL 4 – Critical':
        return 'bg-rose-600 text-white border-rose-700 shadow-rose-200 animate-pulse';
      case 'LEVEL 3 – High':
        return 'bg-amber-600 text-white border-amber-700 shadow-amber-200';
      case 'LEVEL 2 – Moderate':
        return 'bg-sky-600 text-white border-sky-700 shadow-sky-200';
      case 'LEVEL 1 – Low':
      default:
        return 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-200';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'Immediate':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Immediate (&lt; 2h SLA)</span>;
      case 'Priority':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Priority (&lt; 24h SLA)</span>;
      case 'Routine':
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-slate-600" /> Routine (&lt; 72h SLA)</span>;
    }
  };

  const getHumanReviewBadge = (status?: string) => {
    switch (status) {
      case 'Human Review Required':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 flex items-center"><ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-rose-600" /> Human Review Required</span>;
      case 'Human Review Recommended':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Human Review Recommended</span>;
      case 'AI Review Only':
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> AI Review Only</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-200 text-slate-800 rounded">
              {complaint.id}
            </span>
            <span className="text-xs text-slate-500">
              Source: <strong className="text-slate-700">{complaint.source}</strong>
            </span>
            <span className="text-xs text-slate-500">
              Date: <strong className="text-slate-700">{complaint.dateSubmitted}</strong>
            </span>
            {complaint.facilityOrDepartment && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                Unit: <strong className="text-slate-700">{complaint.facilityOrDepartment}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onRetriage(complaint.id)}
              disabled={isRetriaging}
              title="Run AI Triage analysis again"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${isRetriaging ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <button
              onClick={handleDownloadReport}
              title="Download text report"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Narrative Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                <FileText className="w-4 h-4 mr-1.5 text-slate-600" />
                Patient Complaint Narrative
              </h3>
              {complaint.triageResult?.triageEngine && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1 text-indigo-500" />
                  Engine: {complaint.triageResult.triageEngine === 'gemini' ? 'Gemini 3.8 Flash' : 'Clinical Heuristic'}
                </span>
              )}
            </div>
            <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
              "{complaint.complaintText}"
            </p>
          </div>

          {!triage ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 text-sm font-medium">This complaint has not been triaged yet.</p>
              <button
                onClick={() => onRetriage(complaint.id)}
                disabled={isRetriaging}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                {isRetriaging ? 'Triaging...' : 'Run 6-Step Clinical Triage Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Severity Assessment</span>
                  <div className="mt-1 flex items-center">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getSeverityStyle(triage.severityLevel)}`}>
                      {triage.severityLevel}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Escalation Urgency</span>
                  <div className="mt-1">
                    {getPriorityBadge(triage.escalationPriority)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Oversight Level</span>
                  <div className="mt-1">
                    {getHumanReviewBadge(triage.humanReviewStatus)}
                  </div>
                </div>
              </div>

              {/* 6-Step Breakdown */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-xs">
                {/* STEP 1 */}
                <div className="p-4 bg-white hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black mr-2">1</span>
                      Complaint Category
                    </span>
                    <span className="text-xs text-slate-400">Step 1 of 6</span>
                  </div>
                  <div className="pl-7 space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-700">Primary:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {triage.primaryCategory}
                      </span>
                      {triage.secondaryCategories.length > 0 && (
                        <>
                          <span className="text-xs font-medium text-slate-400 ml-2">Secondary:</span>
                          {triage.secondaryCategories.map((sec, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {sec}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* STEP 2 */}
                <div className="p-4 bg-white hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black mr-2">2</span>
                      Severity Assessment
                    </span>
                    <span className="text-xs text-slate-400">Step 2 of 6</span>
                  </div>
                  <div className="pl-7 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityStyle(triage.severityLevel)}`}>
                        {triage.severityLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      <strong className="text-slate-700">Justification: </strong>
                      {triage.severityJustification}
                    </p>
                  </div>
                </div>

                {/* STEP 3 */}
                <div className="p-4 bg-white hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black mr-2">3</span>
                      Risk Detection ({triage.riskFlags.length} Flagged)
                    </span>
                    <span className="text-xs text-slate-400">Step 3 of 6</span>
                  </div>
                  <div className="pl-7">
                    {triage.riskFlags.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No critical risks flagged.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {triage.riskFlags.map((riskItem, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="inline-flex items-center text-xs font-bold text-rose-700 mb-1">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-500 flex-shrink-0" />
                              {riskItem.risk}
                            </span>
                            <p className="text-xs text-slate-600 leading-normal">
                              {riskItem.justification}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* STEP 4 */}
                <div className="p-4 bg-white hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black mr-2">4</span>
                      Escalation Recommendation
                    </span>
                    <span className="text-xs text-slate-400">Step 4 of 6</span>
                  </div>
                  <div className="pl-7 space-y-1.5">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs font-medium text-slate-500">ROUTE TO:</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300 flex items-center">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-teal-600" />
                        {triage.recommendedDepartment}
                      </span>
                      <span className="text-xs font-medium text-slate-500 ml-2">Urgency:</span>
                      {getPriorityBadge(triage.escalationPriority)}
                    </div>
                  </div>
                </div>

                {/* STEP 5 */}
                <div className="p-4 bg-white hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black mr-2">5</span>
                      Human Review Requirement
                    </span>
                    <span className="text-xs text-slate-400">Step 5 of 6</span>
                  </div>
                  <div className="pl-7 space-y-2">
                    <div className="flex items-center">
                      {getHumanReviewBadge(triage.humanReviewStatus)}
                    </div>
                    {triage.humanReviewTriggers.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Review Triggers:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {triage.humanReviewTriggers.map((trig, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              • {trig}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* STEP 6 */}
                <div className="p-4 bg-indigo-50/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center text-[10px] font-black mr-2">6</span>
                      Executive Summary
                    </span>
                    <span className="text-xs text-slate-400">Step 6 of 6</span>
                  </div>
                  <div className="pl-7">
                    <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                      {triage.executiveSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exact Verbatim Output Format Block */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Standardized Output Format (Prompt Specification)
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Copy Verbatim Output
                      </>
                    )}
                  </button>
                </div>
                <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed overflow-x-auto select-all">
                  {triage.formattedOutput}
                </pre>
              </div>

              {/* Human Oversight & Clinical Sign-off Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Clinical Oversight & Supervisor Audit Sign-Off
                    </h4>
                  </div>
                  {!showOverrideForm ? (
                    <button
                      onClick={() => setShowOverrideForm(true)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition"
                    >
                      {complaint.humanReview ? 'Edit Sign-Off' : 'Add Human Sign-Off / Override'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowOverrideForm(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {complaint.humanReview && !showOverrideForm && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Audited by: {complaint.humanReview.reviewedBy}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        complaint.humanReview.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        complaint.humanReview.status === 'Modified' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {complaint.humanReview.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Timestamp: {new Date(complaint.humanReview.reviewedAt).toLocaleString()}
                    </p>
                    {complaint.humanReview.notes && (
                      <p className="text-slate-700 mt-1 italic">
                        "{complaint.humanReview.notes}"
                      </p>
                    )}
                    {complaint.humanReview.overriddenSeverity && (
                      <p className="text-amber-700 font-medium">
                        Severity Overridden: {complaint.humanReview.originalSeverity} ➔ {complaint.humanReview.overriddenSeverity}
                      </p>
                    )}
                    {complaint.humanReview.overriddenDepartment && (
                      <p className="text-teal-700 font-medium">
                        Department Overridden: {complaint.humanReview.originalDepartment} ➔ {complaint.humanReview.overriddenDepartment}
                      </p>
                    )}
                  </div>
                )}

                {showOverrideForm && (
                  <form onSubmit={handleSaveReview} className="mt-3 space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Reviewer Name / Title:
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Review Decision:
                        </label>
                        <select
                          value={reviewStatus}
                          onChange={(e) => setReviewStatus(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Approved">Approved (Confirm AI Triage)</option>
                          <option value="Modified">Modified (Adjust Category / Severity / Route)</option>
                          <option value="Rejected">Rejected (Inconclusive / Invalid Complaint)</option>
                        </select>
                      </div>
                    </div>

                    {reviewStatus === 'Modified' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Override Severity:
                          </label>
                          <select
                            value={overrideSeverity}
                            onChange={(e) => setOverrideSeverity(e.target.value as SeverityLevel)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          >
                            <option value="">Keep Original ({triage.severityLevel})</option>
                            {SEVERITY_LIST.map((lvl) => (
                              <option key={lvl} value={lvl}>{lvl}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Override Department:
                          </label>
                          <select
                            value={overrideDept}
                            onChange={(e) => setOverrideDept(e.target.value as Department)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          >
                            <option value="">Keep Original ({triage.recommendedDepartment})</option>
                            {DEPARTMENTS_LIST.map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Override Category:
                          </label>
                          <select
                            value={overrideCategory}
                            onChange={(e) => setOverrideCategory(e.target.value as ComplaintCategory)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          >
                            <option value="">Keep Original ({triage.primaryCategory})</option>
                            {CATEGORIES_LIST.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Clinical Reviewer Notes & Action Items:
                      </label>
                      <textarea
                        rows={2}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="e.g., Confirmed medication error with charge nurse; flagged for Risk Management and initiated root-cause review."
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowOverrideForm(false)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Save Human Sign-off
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {triage ? `Triaged ${new Date(triage.triagedAt).toLocaleTimeString()}` : 'Untriaged'}
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopy}
              disabled={!triage}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition"
            >
              {copied ? 'Copied' : 'Copy Output Format'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
