import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldCheck, 
  FileSpreadsheet, 
  Upload, 
  PlusCircle, 
  Database, 
  Activity, 
  Sparkles,
  BookOpen,
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ComplaintRecord, HumanReviewOverride } from './types/triage';
import { SAMPLE_COMPLAINTS } from './data/sampleComplaints';
import { performHeuristicTriage } from './utils/triageEngine';
import { triageComplaint, triageBatchComplaints } from './services/triageApi';
import { exportComplaintsToCSV, exportComplaintsToExcel } from './utils/fileParser';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { ComplaintFilters } from './components/ComplaintFilters';
import { ComplaintTable } from './components/ComplaintTable';
import { TriageModal } from './components/TriageModal';
import { UploadModal } from './components/UploadModal';
import { QuickTriageModal } from './components/QuickTriageModal';
import { BatchProgressBanner } from './components/BatchProgressBanner';

const LOCAL_STORAGE_KEY = 'complaint_triage_records_v1';

export default function App() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed reading localStorage', e);
    }
    // Initialize with preloaded sample dataset with immediate triage
    return SAMPLE_COMPLAINTS.map((c) => ({
      ...c,
      status: 'Triaged' as const,
      triageResult: performHeuristicTriage(c.complaintText),
    }));
  });

  const [activeTab, setActiveTab] = useState<'queue' | 'guidelines'>('queue');
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isQuickTriageOpen, setIsQuickTriageOpen] = useState(false);
  const [isRetriagingId, setIsRetriagingId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedHumanReview, setSelectedHumanReview] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Batch triage state
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const batchCanceled = useRef(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(complaints));
    } catch (e) {
      console.error('Failed saving to localStorage', e);
    }
  }, [complaints]);

  // Handle Loading Fresh Sample Dataset
  const handleLoadSamples = () => {
    const fresh = SAMPLE_COMPLAINTS.map((c) => ({
      ...c,
      status: 'Triaged' as const,
      triageResult: performHeuristicTriage(c.complaintText),
    }));
    setComplaints(fresh);
    resetFilters();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('');
    setSelectedPriority('');
    setSelectedHumanReview('');
    setSelectedCategory('');
    setSelectedDepartment('');
  };

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = c.complaintText.toLowerCase().includes(query);
        const matchesId = c.id.toLowerCase().includes(query);
        const matchesDept = c.facilityOrDepartment?.toLowerCase().includes(query);
        const matchesCategory = c.triageResult?.primaryCategory.toLowerCase().includes(query);
        if (!matchesText && !matchesId && !matchesDept && !matchesCategory) return false;
      }

      // Severity
      if (selectedSeverity && c.triageResult?.severityLevel !== selectedSeverity) {
        return false;
      }

      // Priority
      if (selectedPriority && c.triageResult?.escalationPriority !== selectedPriority) {
        return false;
      }

      // Human Review
      if (selectedHumanReview && c.triageResult?.humanReviewStatus !== selectedHumanReview) {
        return false;
      }

      // Category
      if (selectedCategory && c.triageResult?.primaryCategory !== selectedCategory) {
        return false;
      }

      // Department
      if (selectedDepartment && c.triageResult?.recommendedDepartment !== selectedDepartment) {
        return false;
      }

      return true;
    });
  }, [complaints, searchQuery, selectedSeverity, selectedPriority, selectedHumanReview, selectedCategory, selectedDepartment]);

  // Metrics
  const criticalCount = useMemo(
    () => complaints.filter((c) => c.triageResult?.severityLevel === 'LEVEL 4 – Critical').length,
    [complaints]
  );

  const humanReviewCount = useMemo(
    () => complaints.filter((c) => c.triageResult?.humanReviewStatus === 'Human Review Required').length,
    [complaints]
  );

  const pendingCount = useMemo(
    () => complaints.filter((c) => !c.triageResult).length,
    [complaints]
  );

  // Single complaint retriage
  const handleRetriageComplaint = async (id: string) => {
    const item = complaints.find((c) => c.id === id);
    if (!item) return;

    setIsRetriagingId(id);
    try {
      const result = await triageComplaint(item.complaintText);
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: 'Triaged',
                triageResult: result,
              }
            : c
        )
      );
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint((prev) => (prev ? { ...prev, status: 'Triaged', triageResult: result } : null));
      }
    } catch (err) {
      console.error('Error retriaging:', err);
    } finally {
      setIsRetriagingId(null);
    }
  };

  // Human Review override save
  const handleSaveHumanReview = (id: string, review: HumanReviewOverride) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = {
          ...c,
          status: 'Under Human Review' as const,
          humanReview: review,
        };
        return updated;
      })
    );
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint((prev) => (prev ? { ...prev, humanReview: review, status: 'Under Human Review' } : null));
    }
  };

  // Delete complaint
  const handleDeleteComplaint = (id: string) => {
    if (confirm(`Remove complaint ${id} from triage register?`)) {
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      if (selectedComplaint?.id === id) {
        setSelectedComplaint(null);
      }
    }
  };

  // Import from CSV/Excel
  const handleImportComplaints = async (newComplaints: ComplaintRecord[], runAutoTriage: boolean) => {
    setComplaints((prev) => [...newComplaints, ...prev]);

    if (runAutoTriage) {
      runBatchTriage(newComplaints.map((c) => ({ id: c.id, complaintText: c.complaintText })));
    }
  };

  // Run Batch Triage
  const runBatchTriage = async (items: { id: string; complaintText: string }[]) => {
    if (items.length === 0) return;

    setIsProcessingBatch(true);
    batchCanceled.current = false;
    setBatchProgress({ completed: 0, total: items.length });

    try {
      const resultsMap = await triageBatchComplaints(items, (completed, total) => {
        if (batchCanceled.current) return;
        setBatchProgress({ completed, total });
      });

      setComplaints((prev) =>
        prev.map((c) => {
          if (resultsMap.has(c.id)) {
            return {
              ...c,
              status: 'Triaged',
              triageResult: resultsMap.get(c.id)!,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Batch triage failed:', err);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleBatchTriagePending = () => {
    const pendingItems = complaints
      .filter((c) => !c.triageResult)
      .map((c) => ({ id: c.id, complaintText: c.complaintText }));
    runBatchTriage(pendingItems);
  };

  // Quick New Complaint Submission
  const handleQuickSubmit = async (complaintData: Partial<ComplaintRecord>) => {
    const id = `CMP-${new Date().getFullYear()}-${String(complaints.length + 101).padStart(3, '0')}`;
    const text = complaintData.complaintText || '';

    const triageResult = await triageComplaint(text);

    const newRecord: ComplaintRecord = {
      id,
      complaintText: text,
      source: complaintData.source || 'Patient Portal',
      patientId: complaintData.patientId,
      dateSubmitted: complaintData.dateSubmitted || new Date().toISOString().split('T')[0],
      facilityOrDepartment: complaintData.facilityOrDepartment,
      status: 'Triaged',
      triageResult,
    };

    setComplaints((prev) => [newRecord, ...prev]);
    setSelectedComplaint(newRecord);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        totalCount={complaints.length}
        criticalCount={criticalCount}
        humanReviewCount={humanReviewCount}
        pendingCount={pendingCount}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenNewComplaint={() => setIsQuickTriageOpen(true)}
        onLoadSamples={handleLoadSamples}
        isProcessingBatch={isProcessingBatch}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'queue'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-4 h-4 mr-2 text-indigo-500" />
              Triage Workspace & Queue
              <span className="ml-2 px-1.5 py-0.2 bg-slate-100 text-slate-700 text-xs rounded-full font-bold">
                {complaints.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('guidelines')}
              className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'guidelines'
                  ? 'bg-white text-teal-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2 text-teal-600" />
              Clinical Triage Guidelines & SLAs
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden md:flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1" />
            <span>Role: Healthcare Complaint Triage Assistant (Review, Prioritize & Route)</span>
          </div>
        </div>

        {activeTab === 'queue' ? (
          <div className="space-y-6">
            {/* Dashboard Analytics & Metrics */}
            <DashboardStats
              complaints={complaints}
              onSelectSeverityFilter={(sev) => setSelectedSeverity(sev)}
              onSelectDepartmentFilter={(dept) => setSelectedDepartment(dept)}
              onSelectHumanReviewFilter={(hr) => setSelectedHumanReview(hr)}
            />

            {/* Filter and Action Bar */}
            <ComplaintFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSeverity={selectedSeverity}
              onSeverityChange={setSelectedSeverity}
              selectedPriority={selectedPriority}
              onPriorityChange={setSelectedPriority}
              selectedHumanReview={selectedHumanReview}
              onHumanReviewChange={setSelectedHumanReview}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={setSelectedDepartment}
              onResetFilters={resetFilters}
              onExportCSV={() => exportComplaintsToCSV(filteredComplaints)}
              onExportExcel={() => exportComplaintsToExcel(filteredComplaints)}
              onBatchTriagePending={handleBatchTriagePending}
              pendingCount={pendingCount}
              totalFilteredCount={filteredComplaints.length}
              isProcessingBatch={isProcessingBatch}
            />

            {/* Main Complaints Table */}
            <ComplaintTable
              complaints={filteredComplaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
              onRetriageComplaint={handleRetriageComplaint}
              onDeleteComplaint={handleDeleteComplaint}
              isRetriagingId={isRetriagingId}
              onOpenUpload={() => setIsUploadOpen(true)}
              onLoadSamples={handleLoadSamples}
            />
          </div>
        ) : (
          /* Clinical Protocol & Guidelines Reference Tab */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <ShieldCheck className="w-6 h-6 mr-2 text-teal-600" />
                Healthcare Complaint Triage Protocol & Mandates
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                This triage agent standardizes incoming patient feedback, survey grievances, and portal messages
                across six systematic steps to protect patient safety, enforce HIPAA and civil rights compliance,
                and maintain strict human review boundaries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs sm:text-sm">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-xs block">
                  STEP 1: Complaint Category
                </span>
                <p className="text-slate-600 text-xs">
                  Classify into exactly one primary category and enumerate secondary categories if multi-faceted.
                </p>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    'Communication', 'Scheduling', 'Wait Time', 'Technology / Patient Portal',
                    'Billing', 'Clinical Care', 'Discharge and Follow-Up', 'Accessibility and Equity',
                    'Patient Safety', 'Privacy or Security', 'Staff Conduct', 'Other'
                  ].map((cat) => (
                    <span key={cat} className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-xs block">
                  STEP 2: Severity Assessment
                </span>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-start">
                    <span className="font-bold text-emerald-700 w-28 flex-shrink-0">LEVEL 1 – Low:</span>
                    <span className="text-slate-600">Minor inconvenience, routine dissatisfaction, general suggestion.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-sky-700 w-28 flex-shrink-0">LEVEL 2 – Moderate:</span>
                    <span className="text-slate-600">Repeated service failures, significant frustration, communication breakdown.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-amber-700 w-28 flex-shrink-0">LEVEL 3 – High:</span>
                    <span className="text-slate-600">Potential patient harm, medication concerns, serious accessibility barrier.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-rose-700 w-28 flex-shrink-0">LEVEL 4 – Critical:</span>
                    <span className="text-slate-600">Immediate patient safety risk, legal exposure, HIPAA breach, discrimination.</span>
                  </li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-xs block">
                  STEP 3: Risk Detection
                </span>
                <p className="text-slate-600 text-xs">
                  Examine clinical and institutional liabilities. Every flagged risk includes an explanation.
                </p>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    'Patient Safety Risk', 'Clinical Risk', 'Compliance Risk', 'Privacy Risk',
                    'Accessibility Risk', 'Equity Risk', 'Reputational Risk', 'Operational Risk'
                  ].map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-xs block">
                  STEP 4: Escalation Routing & SLAs
                </span>
                <p className="text-slate-600 text-xs">
                  Routes directly to the responsible institutional leadership with time-sensitive SLA:
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-rose-700 font-bold">Immediate Escalation:</span>
                    <span className="text-slate-600">&lt; 2-Hour Response SLA</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-amber-700 font-bold">Priority Escalation:</span>
                    <span className="text-slate-600">&lt; 24-Hour Response SLA</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700 font-bold">Routine Escalation:</span>
                    <span className="text-slate-600">&lt; 72-Hour Response SLA</span>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-xs block">
                  STEP 5: Human Review Mandate
                </span>
                <p className="text-slate-600 text-xs font-semibold text-rose-700">
                  Human Review Required is mandatory whenever:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                  <li>Patient safety concerns exist</li>
                  <li>Discrimination or bias is alleged</li>
                  <li>Privacy or HIPAA concerns exist</li>
                  <li>Legal or compliance risks are present</li>
                  <li>The complaint is ambiguous and requires clinical investigation</li>
                </ul>
              </div>

              {/* Step 6 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-xs block">
                  STEP 6: Output Format Specification
                </span>
                <pre className="font-mono text-[10px] text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-tight">
{`Complaint Category:
Secondary Categories:
Severity Level:
Severity Justification:
Risk Flags:
Recommended Department:
Escalation Priority:
Human Review Status:
Executive Summary:`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Batch Triage Progress Banner */}
      {isProcessingBatch && (
        <BatchProgressBanner
          completed={batchProgress.completed}
          total={batchProgress.total}
          onCancel={() => {
            batchCanceled.current = true;
            setIsProcessingBatch(false);
          }}
        />
      )}

      {/* Modals */}
      <TriageModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onRetriage={handleRetriageComplaint}
        onSaveHumanReview={handleSaveHumanReview}
        isRetriaging={isRetriagingId === selectedComplaint?.id}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportComplaints={handleImportComplaints}
      />

      <QuickTriageModal
        isOpen={isQuickTriageOpen}
        onClose={() => setIsQuickTriageOpen(false)}
        onSubmit={handleQuickSubmit}
        isSubmitting={false}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Complaint Triage Agent • Clinical Safety, Compliance & Risk Governance</span>
          <span>Role is triage, prioritization & routing (not complaint resolution)</span>
        </div>
      </footer>
    </div>
  );
}
