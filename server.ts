import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { performHeuristicTriage, formatTriageOutput } from './src/utils/triageEngine.ts';
import {
  CATEGORIES_LIST,
  SEVERITY_LIST,
  RISKS_LIST,
  DEPARTMENTS_LIST,
  ESCALATION_PRIORITIES,
  HUMAN_REVIEW_STATUSES,
  ComplaintCategory,
  SeverityLevel,
  Department,
  EscalationPriority,
  HumanReviewStatus,
  RiskFlag,
} from './src/types/triage.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Gemini SDK with User-Agent as required by AI Studio guidelines
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const TRIAGE_SYSTEM_INSTRUCTION = `You are a Healthcare Complaint Triage Assistant.
Your purpose is to help healthcare organizations review, prioritize, and route patient complaints efficiently while maintaining patient safety, fairness, compliance, and appropriate human oversight.
You will receive patient complaints, patient portal messages, survey comments, grievance reports, online reviews, or feedback submissions.
Your role is NOT to resolve complaints.
Your role is to triage complaints and determine:
- What happened
- How serious it is
- Who should review it
- How quickly it should be addressed
- Whether human intervention is required

Follow these mandatory 6 steps:

STEP 1: Complaint Category
Classify into ONE primary category from:
- Communication
- Scheduling
- Wait Time
- Technology / Patient Portal
- Billing
- Clinical Care
- Discharge and Follow-Up
- Accessibility and Equity
- Patient Safety
- Privacy or Security
- Staff Conduct
- Other
If multiple categories are present, identify primary category and list secondary categories.

STEP 2: Severity Assessment
Assign a severity level:
- LEVEL 1 – Low (Minor inconvenience, routine dissatisfaction, general suggestion)
- LEVEL 2 – Moderate (Repeated service failures, significant frustration, communication breakdown)
- LEVEL 3 – High (Potential patient harm, medication-related concern, serious accessibility issue, escalated complaint)
- LEVEL 4 – Critical (Immediate patient safety risk, potential legal exposure, serious privacy violation, discrimination allegation)
Provide reasoning for the assigned severity.

STEP 3: Risk Detection
Identify all applicable risks from:
- Patient Safety Risk
- Clinical Risk
- Compliance Risk
- Privacy Risk
- Accessibility Risk
- Equity Risk
- Reputational Risk
- Operational Risk
For each risk flagged, provide a specific clinical/operational explanation why it was flagged.

STEP 4: Escalation Recommendation
ROUTE TO one of:
- Patient Experience Team
- Nursing Leadership
- Physician Leadership
- Quality Improvement Team
- Compliance Office
- Information Technology
- Revenue Cycle / Billing
- Accessibility Coordinator
- Risk Management
- Executive Review

Indicate whether escalation is:
- Routine
- Priority
- Immediate

STEP 5: Human Review Requirement
Determine whether:
- AI Review Only
- Human Review Recommended
- Human Review Required

Human Review Required MUST be selected whenever:
- Patient safety concerns exist
- Discrimination is alleged
- Privacy concerns exist
- Legal or compliance risks are present
- The complaint is ambiguous and requires investigation

STEP 6: Executive Summary
Create a concise executive summary including:
- Complaint category
- Severity level
- Major risk
- Recommended action`;

async function triageWithGemini(complaintText: string) {
  if (!ai) {
    return performHeuristicTriage(complaintText);
  }

  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Patient Complaint to Triage:\n"${complaintText}"`,
      config: {
        systemInstruction: TRIAGE_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryCategory: {
              type: Type.STRING,
              enum: CATEGORIES_LIST,
              description: 'Primary complaint category',
            },
            secondaryCategories: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Any secondary categories identified',
            },
            severityLevel: {
              type: Type.STRING,
              enum: SEVERITY_LIST,
              description: 'Severity Level',
            },
            severityJustification: {
              type: Type.STRING,
              description: 'Reasoning for assigned severity',
            },
            riskFlags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  risk: {
                    type: Type.STRING,
                    enum: RISKS_LIST,
                  },
                  justification: {
                    type: Type.STRING,
                  },
                },
                required: ['risk', 'justification'],
              },
            },
            recommendedDepartment: {
              type: Type.STRING,
              enum: DEPARTMENTS_LIST,
            },
            escalationPriority: {
              type: Type.STRING,
              enum: ESCALATION_PRIORITIES,
            },
            humanReviewStatus: {
              type: Type.STRING,
              enum: HUMAN_REVIEW_STATUSES,
            },
            humanReviewTriggers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Reasons why human review is required or recommended',
            },
            executiveSummary: {
              type: Type.STRING,
              description: 'Concise executive summary with Category, Severity, Major Risk, Recommended Action',
            },
          },
          required: [
            'primaryCategory',
            'secondaryCategories',
            'severityLevel',
            'severityJustification',
            'riskFlags',
            'recommendedDepartment',
            'escalationPriority',
            'humanReviewStatus',
            'humanReviewTriggers',
            'executiveSummary',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    // Validate and build formatted string
    const result = {
      primaryCategory: (parsed.primaryCategory || 'Other') as ComplaintCategory,
      secondaryCategories: (parsed.secondaryCategories || []) as ComplaintCategory[],
      severityLevel: (parsed.severityLevel || 'LEVEL 1 – Low') as SeverityLevel,
      severityJustification: parsed.severityJustification || 'Classified based on content.',
      riskFlags: (parsed.riskFlags || []) as RiskFlag[],
      recommendedDepartment: (parsed.recommendedDepartment || 'Patient Experience Team') as Department,
      escalationPriority: (parsed.escalationPriority || 'Routine') as EscalationPriority,
      humanReviewStatus: (parsed.humanReviewStatus || 'Human Review Recommended') as HumanReviewStatus,
      humanReviewTriggers: (parsed.humanReviewTriggers || []) as string[],
      executiveSummary: parsed.executiveSummary || 'Complaint triaged.',
    };

    const formattedOutput = formatTriageOutput(result);

      return {
        ...result,
        formattedOutput,
        triagedAt: new Date().toISOString(),
        triageEngine: 'gemini' as const,
      };
    } catch (error) {
      lastError = error;
      console.warn(`Model ${modelName} unavailable or failed, checking next model:`, error);
    }
  }

  console.warn('All Gemini models experienced high demand, executing clinical heuristic engine:', lastError);
  return performHeuristicTriage(complaintText);
}

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/triage', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Complaint text is required.' });
    }

    const triageResult = await triageWithGemini(text.trim());
    return res.json(triageResult);
  } catch (error: any) {
    console.error('Triage endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Internal triage error' });
  }
});

app.post('/api/triage-batch', async (req, res) => {
  try {
    const { complaints } = req.body;
    if (!Array.isArray(complaints) || complaints.length === 0) {
      return res.status(400).json({ error: 'Array of complaints is required.' });
    }

    // Limit batch size to prevent server timeout
    const batch = complaints.slice(0, 50);
    const results = [];

    // Process sequentially or with small concurrency to avoid rate limits
    for (const item of batch) {
      const text = typeof item === 'string' ? item : item.complaintText || '';
      if (!text.trim()) {
        results.push(null);
        continue;
      }
      const triage = await triageWithGemini(text.trim());
      results.push({
        id: item.id || undefined,
        triageResult: triage,
      });
    }

    return res.json({ results, total: results.length });
  } catch (error: any) {
    console.error('Batch triage error:', error);
    return res.status(500).json({ error: error.message || 'Internal batch triage error' });
  }
});

// Setup Vite in Dev or Serve Static in Prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Complaint Triage Agent server running on port ${PORT} [env: ${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer();
