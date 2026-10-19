import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { ComplaintRecord } from '../types/triage';

interface QuickTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (complaint: Partial<ComplaintRecord>) => Promise<void>;
  isSubmitting: boolean;
}

export const QuickTriageModal: React.FC<QuickTriageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [narrative, setNarrative] = useState('');
  const [source, setSource] = useState<ComplaintRecord['source']>('Patient Portal');
  const [patientId, setPatientId] = useState('');
  const [facility, setFacility] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim()) {
      setError('Please provide the patient complaint narrative text.');
      return;
    }

    setError(null);
    try {
      await onSubmit({
        complaintText: narrative.trim(),
        source,
        patientId: patientId.trim() || undefined,
        facilityOrDepartment: facility.trim() || 'General Hospital Services',
        dateSubmitted: new Date().toISOString().split('T')[0],
      });
      setNarrative('');
      setPatientId('');
      setFacility('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to triage complaint.');
    }
  };

  const handleQuickPreset = (presetText: string, presetSource: ComplaintRecord['source'], presetDept: string) => {
    setNarrative(presetText);
    setSource(presetSource);
    setFacility(presetDept);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-800">
                New Complaint Live Triage
              </h2>
              <p className="text-xs text-slate-500">
                Evaluate individual patient complaints with the 6-step clinical framework
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400">
              Quick Test Scenarios:
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => handleQuickPreset(
                  'Patient was prescribed Amoxicillin despite charted severe penicillin anaphylaxis allergy sticker on chart. Pharmacy caught error before dispensing.',
                  'Grievance Form',
                  'Inpatient Pharmacy / Med Safety'
                )}
                className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
              >
                🚨 Med Allergy Near-Miss
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(
                  'I was billed $1,400 for routine preventive wellness bloodwork that was supposed to be 100% covered under ACA.',
                  'Billing Office',
                  'Revenue Cycle'
                )}
                className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
              >
                💵 Billing Surprise
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(
                  'The patient portal sent an email with another patient\'s surgical discharge summary and medical history to my personal email address.',
                  'Patient Portal',
                  'Health Informatics / IT'
                )}
                className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
              >
                🔒 HIPAA Breach
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Complaint Narrative / Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Paste patient feedback, grievance report, portal message, or survey comment..."
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Feedback Source:
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Patient Portal">Patient Portal</option>
                <option value="Grievance Form">Grievance Form</option>
                <option value="Survey Comment">Survey Comment</option>
                <option value="Online Review">Online Review</option>
                <option value="Call Center">Call Center</option>
                <option value="Billing Office">Billing Office</option>
                <option value="Email">Email</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Patient MRN / ID (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. PT-10492"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Facility / Clinic:
              </label>
              <input
                type="text"
                placeholder="e.g. Main Ambulatory"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !narrative.trim()}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center transition"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Triaging...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Run 6-Step Triage
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
