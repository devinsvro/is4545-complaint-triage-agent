import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  ArrowRight,
  Database
} from 'lucide-react';
import { 
  parseFile, 
  ColumnMapping, 
  convertRowsToComplaints, 
  downloadSampleCSV,
  ParseResult
} from '../utils/fileParser';
import { ComplaintRecord } from '../types/triage';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplaints: (complaints: ComplaintRecord[], runAutoTriage: boolean) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onImportComplaints,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ textColumn: '' });
  const [autoTriage, setAutoTriage] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setParsing(true);
    setParseError(null);

    try {
      const result = await parseFile(selectedFile);
      setParseResult(result);
      setMapping(result.detectedMapping);
    } catch (err: any) {
      setParseError(err.message || 'Failed to read file.');
      setParseResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleCompleteImport = () => {
    if (!parseResult || !mapping.textColumn) {
      setParseError('Please select the column that contains the complaint text narrative.');
      return;
    }

    const complaints = convertRowsToComplaints(parseResult.rawRows, mapping);
    if (complaints.length === 0) {
      setParseError('No valid complaint records found in this file.');
      return;
    }

    onImportComplaints(complaints, autoTriage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-800">
                Upload Complaint Data Source
              </h2>
              <p className="text-xs text-slate-500">
                Support for CSV, Excel (.xlsx, .xls) files with flexible column mapping
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

        {/* Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
          {/* Sample template banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-600">
              Need a starting format? Download our clinical complaints template:
            </span>
            <button
              onClick={downloadSampleCSV}
              className="inline-flex items-center px-3 py-1 bg-white hover:bg-slate-100 text-indigo-600 font-semibold border border-indigo-200 rounded-lg shadow-2xs transition"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Template CSV
            </button>
          </div>

          {/* Upload Drop Zone */}
          {!parseResult ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <UploadCloud className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drag and drop your spreadsheet here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Accepts CSV, Excel (.xlsx, .xls) files from patient portal exports, grievance forms, and surveys
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">{file?.name}</p>
                    <p className="text-[11px] text-emerald-700">
                      {parseResult.rawRows.length} rows loaded • {parseResult.headers.length} columns detected
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setParseResult(null);
                    setFile(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Change file
                </button>
              </div>

              {/* Column Mapping Configuration */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Verify Column Mapping
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Complaint Narrative Text <span className="text-rose-500">*</span>:
                    </label>
                    <select
                      value={mapping.textColumn}
                      onChange={(e) => setMapping({ ...mapping, textColumn: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- Select Narrative Column --</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Complaint / Ticket ID (Optional):
                    </label>
                    <select
                      value={mapping.idColumn || ''}
                      onChange={(e) => setMapping({ ...mapping, idColumn: e.target.value || undefined })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- Auto-generate ID --</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Date Submitted (Optional):
                    </label>
                    <select
                      value={mapping.dateColumn || ''}
                      onChange={(e) => setMapping({ ...mapping, dateColumn: e.target.value || undefined })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- Use Today's Date --</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Source Channel (Optional):
                    </label>
                    <select
                      value={mapping.sourceColumn || ''}
                      onChange={(e) => setMapping({ ...mapping, sourceColumn: e.target.value || undefined })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- Default (Patient Portal) --</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-700 mb-1">
                      Facility / Department / Clinic (Optional):
                    </label>
                    <select
                      value={mapping.facilityColumn || ''}
                      onChange={(e) => setMapping({ ...mapping, facilityColumn: e.target.value || undefined })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- None / General Hospital --</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sample row preview */}
                {parseResult.rawRows[0] && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      First Row Preview:
                    </span>
                    <p className="text-xs text-slate-700 line-clamp-2 mt-1 italic">
                      "{mapping.textColumn ? parseResult.rawRows[0][mapping.textColumn] : 'Select narrative column to preview'}"
                    </p>
                  </div>
                )}
              </div>

              {/* Triage execution checkbox */}
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={autoTriage}
                  onChange={(e) => setAutoTriage(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>
                  Automatically run 6-Step Clinical Triage on imported complaints immediately
                </span>
              </label>
            </div>
          )}

          {parsing && (
            <div className="text-center py-4 text-xs font-medium text-indigo-600 animate-pulse">
              Parsing spreadsheet contents...
            </div>
          )}

          {parseError && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {parseError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleCompleteImport}
            disabled={!parseResult || !mapping.textColumn}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center transition"
          >
            <span>Import & {autoTriage ? 'Begin Triage' : 'Save to Queue'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
