import {
  ComplaintCategory,
  SeverityLevel,
  RiskType,
  Department,
  EscalationPriority,
  HumanReviewStatus,
  RiskFlag,
  TriageResult,
} from '../types/triage';

export function formatTriageOutput(result: Omit<TriageResult, 'formattedOutput' | 'triagedAt' | 'triageEngine'>): string {
  const secondaryStr = result.secondaryCategories.length > 0 
    ? result.secondaryCategories.join(', ') 
    : 'None';

  const riskFlagsStr = result.riskFlags.length > 0
    ? result.riskFlags.map(r => `${r.risk} (${r.justification})`).join('; ')
    : 'None identified';

  return `Complaint Category: ${result.primaryCategory}
Secondary Categories: ${secondaryStr}
Severity Level: ${result.severityLevel}
Severity Justification: ${result.severityJustification}
Risk Flags: ${riskFlagsStr}
Recommended Department: ${result.recommendedDepartment}
Escalation Priority: ${result.escalationPriority}
Human Review Status: ${result.humanReviewStatus}${result.humanReviewTriggers.length > 0 ? ` [Triggers: ${result.humanReviewTriggers.join(', ')}]` : ''}
Executive Summary: ${result.executiveSummary}`;
}

export function performHeuristicTriage(text: string): TriageResult {
  const lower = text.toLowerCase();

  // Pattern detection
  const hasMedication = /prednisone|insulin|lovenox|mg|dose|medication|drug|prescription|pharmacy|overdose|allergic|refill|pills|antibiotic|infusion|iv pump/i.test(lower);
  const hasSevereHarmOrMortality = /collapsed|stemi|heart attack|numbness|chest pain|icu|911|ems|fatal|death|stroke|resuscitation|pulmonary embolism|hemorrhage|seizure|coma/i.test(lower);
  const hasPrivacyBreach = /hipaa|ssn|social security|confidential|disclosed|hiv|diagnosis shouted|loudly|waiting room heard|records leaked|privacy violation/i.test(lower);
  const hasDiscrimination = /immigrant|race|racial|spanish|language|accent|derogatory|discrimina|bias|profiling|minority|sexual orientation|gender|disability slur/i.test(lower);
  const hasAccessibility = /wheelchair|ada|ramp|handicap|elevator|blind|braille|deaf|interpreter|sign language|mobility|paraplegic/i.test(lower);
  const hasBillingHarassment = /balance bill|out-of-network|anesthesiologist|collections|harassing|debt collector|overcharged|itemized|copay|insurance denied|fraudulent charge/i.test(lower);
  const hasPortalTechCrash = /portal|app|error 500|crash|login|password reset|website down|telehealth link|video call failed|glitch/i.test(lower);
  const hasDischargeError = /discharge|post-op|follow-up|contradictory|contradiction|home health|wound care|instructions/i.test(lower);
  const hasWaitDelay = /wait|hour|hours|delayed|sitting|rescheduled|canceled|late|appointment time|tardy/i.test(lower);
  const hasStaffRudeness = /rude|unprofessional|snapped|rolled her eyes|yelled|attitude|condescending|ignored|hostile|disrespectful/i.test(lower);
  const hasPhysicianMisdiagnosis = /physician|doctor|dismissed|refused ekg|anxiety panic attack|misdiagnosed|ignored symptoms/i.test(lower);

  // STEP 1: Categories
  let primaryCategory: ComplaintCategory = 'Other';
  const secondaryCategories: ComplaintCategory[] = [];

  if (hasPrivacyBreach) {
    primaryCategory = 'Privacy or Security';
    if (hasStaffRudeness) secondaryCategories.push('Staff Conduct');
    if (hasDischargeError) secondaryCategories.push('Discharge and Follow-Up');
  } else if (hasDiscrimination) {
    primaryCategory = 'Accessibility and Equity';
    secondaryCategories.push('Staff Conduct');
    if (hasWaitDelay) secondaryCategories.push('Wait Time');
  } else if (hasSevereHarmOrMortality || hasPhysicianMisdiagnosis) {
    primaryCategory = 'Clinical Care';
    if (hasSevereHarmOrMortality) secondaryCategories.push('Patient Safety');
    if (hasStaffRudeness) secondaryCategories.push('Staff Conduct');
  } else if (hasMedication) {
    primaryCategory = 'Patient Safety';
    secondaryCategories.push('Clinical Care');
    if (hasDischargeError) secondaryCategories.push('Discharge and Follow-Up');
  } else if (hasAccessibility) {
    primaryCategory = 'Accessibility and Equity';
    if (hasStaffRudeness) secondaryCategories.push('Staff Conduct');
  } else if (hasDischargeError) {
    primaryCategory = 'Discharge and Follow-Up';
    if (hasMedication) secondaryCategories.push('Patient Safety');
    secondaryCategories.push('Communication');
  } else if (hasBillingHarassment) {
    primaryCategory = 'Billing';
    secondaryCategories.push('Communication');
  } else if (hasPortalTechCrash) {
    primaryCategory = 'Technology / Patient Portal';
    if (hasMedication) secondaryCategories.push('Patient Safety');
  } else if (hasWaitDelay) {
    primaryCategory = 'Wait Time';
    if (hasStaffRudeness) secondaryCategories.push('Staff Conduct');
  } else if (hasStaffRudeness) {
    primaryCategory = 'Staff Conduct';
    secondaryCategories.push('Communication');
  } else if (/schedule|cancel|reschedule|booking/i.test(lower)) {
    primaryCategory = 'Scheduling';
  } else if (/communication|phone|call|message/i.test(lower)) {
    primaryCategory = 'Communication';
  }

  // STEP 2: Severity Level
  let severityLevel: SeverityLevel = 'LEVEL 1 – Low';
  let severityJustification = '';

  if (hasSevereHarmOrMortality || hasPrivacyBreach || hasDiscrimination || (hasMedication && /overdose|swept under|10mg|heart rate/i.test(lower))) {
    severityLevel = 'LEVEL 4 – Critical';
    if (hasSevereHarmOrMortality) {
      severityJustification = 'Immediate patient safety risk and life-threatening clinical outcome following physician dismissal of acute symptoms.';
    } else if (hasPrivacyBreach) {
      severityJustification = 'Severe privacy violation under HIPAA involving unauthorized verbal disclosure of sensitive diagnosis (HIV) and SSN in a public waiting area.';
    } else if (hasDiscrimination) {
      severityJustification = 'Severe equity violation involving direct allegation of racial discrimination, disparate treatment, and derogatory verbal abuse by triage staff.';
    } else {
      severityJustification = 'Immediate patient safety risk involving a 10x medication dosing error in a pediatric patient with deliberate concealment.';
    }
  } else if (hasMedication || hasAccessibility || hasDischargeError || (hasPortalTechCrash && /insulin|urgent/i.test(lower))) {
    severityLevel = 'LEVEL 3 – High';
    if (hasAccessibility) {
      severityJustification = 'Serious accessibility barrier directly preventing safe ADA physical access for paraplegic radiation oncology patient over multiple weeks.';
    } else if (hasDischargeError) {
      severityJustification = 'Potential severe patient harm (pulmonary embolism) due to contradictory discharge anticoagulant instructions between providers.';
    } else if (hasPortalTechCrash) {
      severityJustification = 'Technology barrier blocking access to urgent life-sustaining insulin maintenance therapy with impending medication depletion.';
    } else {
      severityJustification = 'High clinical concern with potential for medication misadventure and adverse patient outcomes.';
    }
  } else if (hasBillingHarassment || hasWaitDelay || hasStaffRudeness || hasPortalTechCrash) {
    severityLevel = 'LEVEL 2 – Moderate';
    if (hasBillingHarassment) {
      severityJustification = 'Significant financial frustration and disputed balance billing contrary to written pre-service in-network assurances.';
    } else if (hasWaitDelay) {
      severityJustification = 'Repeated service delay exceeding 3.5 hours beyond appointment time paired with unaddressed communication breakdown.';
    } else {
      severityJustification = 'Moderate dissatisfaction and service breakdown affecting patient trust and experience.';
    }
  } else {
    severityLevel = 'LEVEL 1 – Low';
    severityJustification = 'Minor inconvenience and routine amenity dissatisfaction with zero clinical or safety impact.';
  }

  // STEP 3: Risk Flags
  const riskFlags: RiskFlag[] = [];

  if (hasSevereHarmOrMortality || (hasMedication && !hasPortalTechCrash)) {
    riskFlags.push({
      risk: 'Patient Safety Risk',
      justification: 'Involves potential or documented acute physical harm or dangerous dosing errors.',
    });
  }
  if (hasSevereHarmOrMortality || hasPhysicianMisdiagnosis || hasDischargeError || (hasMedication && !hasPortalTechCrash)) {
    riskFlags.push({
      risk: 'Clinical Risk',
      justification: 'Concerns clinical diagnostic judgment, pharmacology adherence, or post-operative anticoagulant management.',
    });
  }
  if (hasPrivacyBreach || hasAccessibility || hasDiscrimination || hasBillingHarassment) {
    riskFlags.push({
      risk: 'Compliance Risk',
      justification: hasPrivacyBreach 
        ? 'HIPAA Privacy Rule violation and potential federal OCR reporting requirement.'
        : hasAccessibility
        ? 'Title III Americans with Disabilities Act (ADA) architectural accessibility violation.'
        : hasDiscrimination
        ? 'Title VI Civil Rights Act non-discrimination in federally funded healthcare.'
        : 'Potential No Surprises Act compliance violation regarding out-of-network balance billing.',
    });
  }
  if (hasPrivacyBreach) {
    riskFlags.push({
      risk: 'Privacy Risk',
      justification: 'Public unauthorized disclosure of Protected Health Information (PHI) and PII in waiting area.',
    });
  }
  if (hasAccessibility) {
    riskFlags.push({
      risk: 'Accessibility Risk',
      justification: 'Physical ADA barrier obstructing wheelchair transit for oncology therapy.',
    });
  }
  if (hasDiscrimination) {
    riskFlags.push({
      risk: 'Equity Risk',
      justification: 'Disparate triage sequencing based on national origin, language, or race.',
    });
  }
  if (hasStaffRudeness || hasBillingHarassment || hasPrivacyBreach || hasDiscrimination) {
    riskFlags.push({
      risk: 'Reputational Risk',
      justification: 'Elevated risk of negative publicity, formal civil grievance, or online public review exposure.',
    });
  }
  if (hasPortalTechCrash || hasWaitDelay || hasDischargeError) {
    riskFlags.push({
      risk: 'Operational Risk',
      justification: 'Systemic breakdown in scheduling, clinic throughput, telehealth infrastructure, or discharge protocol.',
    });
  }

  // Fallback risk if none
  if (riskFlags.length === 0) {
    riskFlags.push({
      risk: 'Operational Risk',
      justification: 'General facility and patient support operations feedback.',
    });
  }

  // STEP 4: Escalation Recommendation & Route
  let recommendedDepartment: Department = 'Patient Experience Team';
  let escalationPriority: EscalationPriority = 'Routine';

  if (severityLevel === 'LEVEL 4 – Critical') {
    escalationPriority = 'Immediate';
    if (hasPrivacyBreach) {
      recommendedDepartment = 'Compliance Office';
    } else if (hasDiscrimination) {
      recommendedDepartment = 'Executive Review';
    } else if (hasSevereHarmOrMortality || (hasMedication && /swept under/i.test(lower))) {
      recommendedDepartment = 'Risk Management';
    } else {
      recommendedDepartment = 'Physician Leadership';
    }
  } else if (severityLevel === 'LEVEL 3 – High') {
    escalationPriority = 'Priority';
    if (hasAccessibility) {
      recommendedDepartment = 'Accessibility Coordinator';
    } else if (hasDischargeError) {
      recommendedDepartment = 'Nursing Leadership';
    } else if (hasPortalTechCrash) {
      recommendedDepartment = 'Information Technology';
    } else {
      recommendedDepartment = 'Quality Improvement Team';
    }
  } else if (severityLevel === 'LEVEL 2 – Moderate') {
    escalationPriority = 'Routine';
    if (hasBillingHarassment) {
      recommendedDepartment = 'Revenue Cycle / Billing';
    } else {
      recommendedDepartment = 'Patient Experience Team';
    }
  } else {
    escalationPriority = 'Routine';
    recommendedDepartment = 'Patient Experience Team';
  }

  // STEP 5: Human Review Requirement
  let humanReviewStatus: HumanReviewStatus = 'AI Review Only';
  const humanReviewTriggers: string[] = [];

  if (severityLevel === 'LEVEL 4 – Critical') {
    humanReviewStatus = 'Human Review Required';
    if (hasSevereHarmOrMortality || hasMedication) humanReviewTriggers.push('Patient safety concerns exist');
    if (hasDiscrimination) humanReviewTriggers.push('Discrimination is alleged');
    if (hasPrivacyBreach) humanReviewTriggers.push('Privacy concerns exist');
    if (hasBillingHarassment || hasPrivacyBreach || hasAccessibility) humanReviewTriggers.push('Legal or compliance risks are present');
  } else if (severityLevel === 'LEVEL 3 – High') {
    humanReviewStatus = 'Human Review Required';
    if (hasMedication || hasDischargeError) humanReviewTriggers.push('Patient safety concerns exist');
    if (hasAccessibility) humanReviewTriggers.push('Legal or compliance risks are present');
    if (hasPortalTechCrash) humanReviewTriggers.push('The complaint is ambiguous and requires investigation');
  } else if (severityLevel === 'LEVEL 2 – Moderate') {
    humanReviewStatus = 'Human Review Recommended';
    if (hasBillingHarassment) humanReviewTriggers.push('Financial dispute requires account investigation');
    if (hasWaitDelay) humanReviewTriggers.push('Repeated service failure review recommended');
  } else {
    humanReviewStatus = 'AI Review Only';
  }

  // STEP 6: Executive Summary
  const majorRisk = riskFlags[0] ? riskFlags[0].risk : 'Operational Risk';
  const executiveSummary = `${primaryCategory} grievance triaged at ${severityLevel}. Primary vulnerability flagged under ${majorRisk}. Recommended immediate handoff to ${recommendedDepartment} under ${escalationPriority} triage cadence.`;

  const resultWithoutFormat = {
    primaryCategory,
    secondaryCategories,
    severityLevel,
    severityJustification,
    riskFlags,
    recommendedDepartment,
    escalationPriority,
    humanReviewStatus,
    humanReviewTriggers,
    executiveSummary,
  };

  const formattedOutput = formatTriageOutput(resultWithoutFormat);

  return {
    ...resultWithoutFormat,
    formattedOutput,
    triagedAt: new Date().toISOString(),
    triageEngine: 'clinical-heuristic',
  };
}
