import { ComplaintRecord } from '../types/triage';

export const SAMPLE_COMPLAINTS: ComplaintRecord[] = [
  {
    id: 'CMP-2026-081',
    complaintText:
      'My 6-year-old son was admitted to the pediatric ward for asthma. The floor nurse administered 10mg of liquid prednisone instead of the prescribed 1mg dose because she misread the decimal point on the chart. When I noticed his agitation and rapid heart rate, she admitted the error but told me not to tell the attending physician. I am horrified that this was swept under the rug.',
    source: 'Grievance Form',
    patientId: 'PT-99412',
    dateSubmitted: '2026-10-18',
    facilityOrDepartment: 'Pediatrics / Inpatient Ward 4E',
    status: 'Pending Triage',
  },
  {
    id: 'CMP-2026-082',
    complaintText:
      'While standing at the discharge reception desk waiting for my paperwork, the desk clerk announced loudly across the crowded waiting room: "Mr. Davis, your HIV viral load labs came back, and we need your Social Security Number ending in 4109 to complete the state infectious disease registry." Several neighbors from my church were sitting right there and heard everything.',
    source: 'Patient Portal',
    patientId: 'PT-31084',
    dateSubmitted: '2026-10-17',
    facilityOrDepartment: 'Outpatient Specialty Clinic',
    status: 'Pending Triage',
  },
  {
    id: 'CMP-2026-083',
    complaintText:
      'I am an 81-year-old paraplegic patient coming in for weekly radiation treatments. For the last 3 weeks, the only ADA wheelchair access ramp at the West entrance has been blocked by facility maintenance construction dumpsters. The freight elevator was also tagged out of order. My daughter and a security guard had to carry my heavy power chair up concrete stairs. This is hazardous and violates federal accessibility standards.',
    source: 'Grievance Form',
    patientId: 'PT-10528',
    dateSubmitted: '2026-10-16',
    facilityOrDepartment: 'Cancer Center / Radiation Oncology',
    status: 'Pending Triage',
  },
  {
    id: 'CMP-2026-084',
    complaintText:
      'I received an unexpected out-of-network balance bill of $5,420 for the anesthesiologist during my in-network appendectomy. Prior to surgery, the financial counseling office explicitly assured me in writing that every provider involved in the surgical suite was 100% in-network with Blue Cross. Now debt collection agency calls are harassing me daily.',
    source: 'Billing Office',
    patientId: 'PT-77291',
    dateSubmitted: '2026-10-15',
    facilityOrDepartment: 'Surgical Services / Revenue Cycle',
    status: 'Pending Triage',
  },
  {
    id: 'CMP-2026-085',
    complaintText:
      'The MyHealth patient portal app keeps crashing with an error 500 when I attempt to submit a vital refill authorization for my 70/30 Humalog insulin pens. I called the IT helpdesk twice, was put on hold for 45 minutes, and then disconnected. I am down to my final 10 units for tonight.',
    source: 'Patient Portal',
    patientId: 'PT-55190',
    dateSubmitted: '2026-10-18',
    facilityOrDepartment: 'Endocrinology / Telehealth Support',
    status: 'Pending Triage',
  },
  {
    id: 'CMP-2026-086',
    complaintText:
      'I presented to the Urgent Care clinic with crushing substernal chest pressure, diaphoresis, and left arm numbness. The attending physician spent less than 3 minutes with me, declined an EKG, and stated "you are just having an anxiety panic attack, take deep breaths and go home." Two hours later I collapsed at home and was rushed via 911 EMS to Memorial ER with an acute STEMI requiring emergency cardiac catheterization.',
    source: 'Grievance Form',
    patientId: 'PT-88301',
    dateSubmitted: '2026-10-14',
    facilityOrDepartment: 'Urgent Care & Emergency Medicine',
    status: 'Pending Triage',
  },
  {
    id: 'CMP-2026-087',
    complaintText:
      'My scheduled appointment for a brain MRI was set for 9:15 AM. I arrived fasting at 8:45 AM as instructed. I was left sitting in the interior waiting room for 3 hours and 40 minutes with no explanation or apology from reception. When I asked how much longer, the staff member rolled her eyes and snapped: "There are sicker people than you ahead of you."',
    source: 'Survey Comment',
    patientId: 'PT-24902',
    dateSubmitted: '2026-10-17',
    facilityOrDepartment: 'Diagnostic Imaging / MRI Suite',
    status: 'Pending Triage',
  },
  {
    id: 'CMP-2026-088',
    complaintText:
      'During triage in the emergency department, my mother and I (both speaking Spanish) were repeatedly ignored by the triage nurse who took three English-speaking individuals with minor extremity sprains back before her, even though my mother was in severe pain with a suspected fractured hip. When I asked why they skipped her in line, the nurse made a derogatory remark about immigrants expecting free concierge service.',
    source: 'Grievance Form',
    patientId: 'PT-66482',
    dateSubmitted: '2026-10-16',
    facilityOrDepartment: 'Emergency Department',
    status: 'Pending Triage',
  },
  {
    id: 'CMP-2026-089',
    complaintText:
      'Upon discharge following knee arthroplasty, the hospital printed instructions stated to discontinue all blood thinners immediately. However, the orthopedic surgeon verbal discharge note had instructed to take Lovenox injections daily for 14 days to prevent DVT blood clots. When my home health nurse arrived, she noticed the dangerous contradiction. If she had not caught it, I could have suffered a pulmonary embolism.',
    source: 'Patient Portal',
    patientId: 'PT-12498',
    dateSubmitted: '2026-10-15',
    facilityOrDepartment: 'Orthopedics / Post-Op Care',
    status: 'Pending Triage',
  },
  {
    id: 'CMP-2026-090',
    complaintText:
      'The decaf coffee in the surgical waiting room was lukewarm and the vending machine on the 3rd floor was out of bottled water. Also, the parking garage validation stamp machine at the lobby desk was out of ink, so the cashier had to handwrite the ticket.',
    source: 'Online Review',
    patientId: 'PT-41005',
    dateSubmitted: '2026-10-17',
    facilityOrDepartment: 'Hospital Facilities & Amenities',
    status: 'Pending Triage',
  },
];
