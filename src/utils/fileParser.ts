import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ComplaintRecord } from '../types/triage';

export interface ColumnMapping {
  textColumn: string;
  idColumn?: string;
  dateColumn?: string;
  sourceColumn?: string;
  facilityColumn?: string;
}

export interface ParseResult {
  headers: string[];
  rawRows: Record<string, any>[];
  detectedMapping: ColumnMapping;
}

export function autoDetectColumns(headers: string[]): ColumnMapping {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  let textColumn = '';
  let idColumn = '';
  let dateColumn = '';
  let sourceColumn = '';
  let facilityColumn = '';

  const textCandidates = ['complaint', 'complainttext', 'comment', 'description', 'message', 'narrative', 'feedback', 'grievance', 'details', 'issue', 'text'];
  const idCandidates = ['id', 'complaintid', 'caseid', 'ticketid', 'referencenumber', 'ref', 'ticket', 'patientid', 'mrn'];
  const dateCandidates = ['date', 'datesubmitted', 'submitteddate', 'createdat', 'timestamp', 'receiveddate', 'time'];
  const sourceCandidates = ['source', 'channel', 'origintype', 'feedbacksource', 'category', 'type'];
  const facilityCandidates = ['department', 'facility', 'location', 'unit', 'clinic', 'ward', 'service'];

  for (const h of headers) {
    const n = norm(h);
    if (!textColumn && textCandidates.some((c) => n.includes(c))) {
      textColumn = h;
    }
    if (!idColumn && idCandidates.some((c) => n === c || n.endsWith('id'))) {
      idColumn = h;
    }
    if (!dateColumn && dateCandidates.some((c) => n.includes(c))) {
      dateColumn = h;
    }
    if (!sourceColumn && sourceCandidates.some((c) => n.includes(c))) {
      sourceColumn = h;
    }
    if (!facilityColumn && facilityCandidates.some((c) => n.includes(c))) {
      facilityColumn = h;
    }
  }

  // Fallback: pick first column if no text candidate matched
  if (!textColumn && headers.length > 0) {
    textColumn = headers[0];
  }

  return {
    textColumn,
    idColumn: idColumn || undefined,
    dateColumn: dateColumn || undefined,
    sourceColumn: sourceColumn || undefined,
    facilityColumn: facilityColumn || undefined,
  };
}

export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rawRows = results.data as Record<string, any>[];
          resolve({
            headers,
            rawRows,
            detectedMapping: autoDetectColumns(headers),
          });
        },
        error: (error) => reject(error),
      });
    });
  } else if (extension === 'xlsx' || extension === 'xls') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
    return {
      headers,
      rawRows,
      detectedMapping: autoDetectColumns(headers),
    };
  } else {
    throw new Error('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.');
  }
}

export function convertRowsToComplaints(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  defaultSource: ComplaintRecord['source'] = 'Patient Portal'
): ComplaintRecord[] {
  return rows
    .filter((row) => row[mapping.textColumn] && String(row[mapping.textColumn]).trim() !== '')
    .map((row, index) => {
      const id = mapping.idColumn && row[mapping.idColumn] 
        ? String(row[mapping.idColumn]).trim() 
        : `UPLOAD-${String(index + 1).padStart(4, '0')}`;

      const text = String(row[mapping.textColumn]).trim();
      const dateSubmitted = mapping.dateColumn && row[mapping.dateColumn]
        ? String(row[mapping.dateColumn]).trim()
        : new Date().toISOString().split('T')[0];

      let rawSource = mapping.sourceColumn ? String(row[mapping.sourceColumn]).trim() : defaultSource;
      let source: ComplaintRecord['source'] = defaultSource;
      if (/portal/i.test(rawSource)) source = 'Patient Portal';
      else if (/grievance/i.test(rawSource)) source = 'Grievance Form';
      else if (/survey/i.test(rawSource)) source = 'Survey Comment';
      else if (/review/i.test(rawSource)) source = 'Online Review';
      else if (/call/i.test(rawSource)) source = 'Call Center';
      else if (/email/i.test(rawSource)) source = 'Email';

      const facilityOrDepartment = mapping.facilityColumn && row[mapping.facilityColumn]
        ? String(row[mapping.facilityColumn]).trim()
        : undefined;

      return {
        id,
        complaintText: text,
        source,
        dateSubmitted,
        facilityOrDepartment,
        status: 'Pending Triage',
      };
    });
}

export function exportComplaintsToCSV(complaints: ComplaintRecord[]): void {
  const exportData = complaints.map((c) => ({
    'Complaint ID': c.id,
    'Date Submitted': c.dateSubmitted,
    'Source Channel': c.source,
    'Facility / Department': c.facilityOrDepartment || 'N/A',
    'Complaint Narrative': c.complaintText,
    'Status': c.status,
    'Category (Primary)': c.triageResult?.primaryCategory || 'Untriaged',
    'Secondary Categories': c.triageResult?.secondaryCategories.join(', ') || '',
    'Severity Level': c.triageResult?.severityLevel || '',
    'Severity Justification': c.triageResult?.severityJustification || '',
    'Risk Flags': c.triageResult?.riskFlags.map(r => `${r.risk}: ${r.justification}`).join(' | ') || '',
    'Recommended Department': c.triageResult?.recommendedDepartment || '',
    'Escalation Priority': c.triageResult?.escalationPriority || '',
    'Human Review Status': c.triageResult?.humanReviewStatus || '',
    'Human Review Triggers': c.triageResult?.humanReviewTriggers.join(', ') || '',
    'Executive Summary': c.triageResult?.executiveSummary || '',
    'Human Reviewer Notes': c.humanReview?.notes || '',
    'Human Review Status Override': c.humanReview?.status || '',
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `complaint_triage_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportComplaintsToExcel(complaints: ComplaintRecord[]): void {
  const exportData = complaints.map((c) => ({
    'Complaint ID': c.id,
    'Date Submitted': c.dateSubmitted,
    'Source': c.source,
    'Location/Unit': c.facilityOrDepartment || 'N/A',
    'Complaint Narrative': c.complaintText,
    'Status': c.status,
    'Category': c.triageResult?.primaryCategory || 'Untriaged',
    'Secondary Categories': c.triageResult?.secondaryCategories.join(', ') || '',
    'Severity': c.triageResult?.severityLevel || '',
    'Severity Reason': c.triageResult?.severityJustification || '',
    'Risk Flags': c.triageResult?.riskFlags.map(r => `${r.risk}: ${r.justification}`).join('; ') || '',
    'Route To': c.triageResult?.recommendedDepartment || '',
    'Priority': c.triageResult?.escalationPriority || '',
    'Human Review Status': c.triageResult?.humanReviewStatus || '',
    'Executive Summary': c.triageResult?.executiveSummary || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Triage Register');

  XLSX.writeFile(workbook, `complaint_triage_register_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function downloadSampleCSV(): void {
  const sampleHeaders = [
    'Complaint_ID',
    'Date_Submitted',
    'Source',
    'Department_Location',
    'Patient_Complaint_Narrative'
  ];

  const sampleRows = [
    [
      'CMP-101',
      '2026-10-18',
      'Patient Portal',
      'Endocrinology',
      'My prescription refill for insulin glargine has been stuck in pending status for 5 days. I called the clinic three times and was put on hold until the call dropped. I will run out of medication in 24 hours.'
    ],
    [
      'CMP-102',
      '2026-10-17',
      'Grievance Form',
      'Diagnostic Imaging',
      'The MRI technologist told me I was wasting their time when I had a panic attack due to claustrophobia, and then canceled my exam without consulting the ordering physician.'
    ],
    [
      'CMP-103',
      '2026-10-16',
      'Billing',
      'Surgical Care',
      'I was billed $3,200 for surgical supplies that were supposed to be covered under my global surgical package fee. Customer service refused to give me an itemized breakdown.'
    ]
  ];

  const csv = Papa.unparse({
    fields: sampleHeaders,
    data: sampleRows,
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_healthcare_complaints_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
