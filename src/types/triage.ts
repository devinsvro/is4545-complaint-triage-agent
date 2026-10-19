export type ComplaintCategory =
  | 'Communication'
  | 'Scheduling'
  | 'Wait Time'
  | 'Technology / Patient Portal'
  | 'Billing'
  | 'Clinical Care'
  | 'Discharge and Follow-Up'
  | 'Accessibility and Equity'
  | 'Patient Safety'
  | 'Privacy or Security'
  | 'Staff Conduct'
  | 'Other';

export type SeverityLevel =
  | 'LEVEL 1 – Low'
  | 'LEVEL 2 – Moderate'
  | 'LEVEL 3 – High'
  | 'LEVEL 4 – Critical';

export type RiskType =
  | 'Patient Safety Risk'
  | 'Clinical Risk'
  | 'Compliance Risk'
  | 'Privacy Risk'
  | 'Accessibility Risk'
  | 'Equity Risk'
  | 'Reputational Risk'
  | 'Operational Risk';

export type Department =
  | 'Patient Experience Team'
  | 'Nursing Leadership'
  | 'Physician Leadership'
  | 'Quality Improvement Team'
  | 'Compliance Office'
  | 'Information Technology'
  | 'Revenue Cycle / Billing'
  | 'Accessibility Coordinator'
  | 'Risk Management'
  | 'Executive Review';

export type EscalationPriority = 'Routine' | 'Priority' | 'Immediate';

export type HumanReviewStatus =
  | 'AI Review Only'
  | 'Human Review Recommended'
  | 'Human Review Required';

export interface RiskFlag {
  risk: RiskType;
  justification: string;
}

export interface TriageResult {
  primaryCategory: ComplaintCategory;
  secondaryCategories: ComplaintCategory[];
  severityLevel: SeverityLevel;
  severityJustification: string;
  riskFlags: RiskFlag[];
  recommendedDepartment: Department;
  escalationPriority: EscalationPriority;
  humanReviewStatus: HumanReviewStatus;
  humanReviewTriggers: string[];
  executiveSummary: string;
  formattedOutput: string;
  triagedAt: string;
  triageEngine: 'gemini' | 'clinical-heuristic';
}

export interface HumanReviewOverride {
  reviewedBy: string;
  reviewedAt: string;
  status: 'Approved' | 'Modified' | 'Rejected';
  notes: string;
  originalSeverity?: SeverityLevel;
  overriddenSeverity?: SeverityLevel;
  originalDepartment?: Department;
  overriddenDepartment?: Department;
  originalCategory?: ComplaintCategory;
  overriddenCategory?: ComplaintCategory;
}

export interface ComplaintRecord {
  id: string;
  complaintText: string;
  source: 'Patient Portal' | 'Grievance Form' | 'Survey Comment' | 'Online Review' | 'Call Center' | 'Email' | 'Billing Office' | 'Other';
  patientId?: string;
  dateSubmitted: string;
  facilityOrDepartment?: string;
  triageResult?: TriageResult;
  status: 'Pending Triage' | 'Triaged' | 'Under Human Review' | 'Escalated' | 'Closed';
  humanReview?: HumanReviewOverride;
}

export const CATEGORIES_LIST: ComplaintCategory[] = [
  'Communication',
  'Scheduling',
  'Wait Time',
  'Technology / Patient Portal',
  'Billing',
  'Clinical Care',
  'Discharge and Follow-Up',
  'Accessibility and Equity',
  'Patient Safety',
  'Privacy or Security',
  'Staff Conduct',
  'Other',
];

export const SEVERITY_LIST: SeverityLevel[] = [
  'LEVEL 1 – Low',
  'LEVEL 2 – Moderate',
  'LEVEL 3 – High',
  'LEVEL 4 – Critical',
];

export const RISKS_LIST: RiskType[] = [
  'Patient Safety Risk',
  'Clinical Risk',
  'Compliance Risk',
  'Privacy Risk',
  'Accessibility Risk',
  'Equity Risk',
  'Reputational Risk',
  'Operational Risk',
];

export const DEPARTMENTS_LIST: Department[] = [
  'Patient Experience Team',
  'Nursing Leadership',
  'Physician Leadership',
  'Quality Improvement Team',
  'Compliance Office',
  'Information Technology',
  'Revenue Cycle / Billing',
  'Accessibility Coordinator',
  'Risk Management',
  'Executive Review',
];

export const ESCALATION_PRIORITIES: EscalationPriority[] = ['Routine', 'Priority', 'Immediate'];

export const HUMAN_REVIEW_STATUSES: HumanReviewStatus[] = [
  'AI Review Only',
  'Human Review Recommended',
  'Human Review Required',
];
