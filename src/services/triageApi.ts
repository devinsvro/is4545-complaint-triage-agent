import { TriageResult } from '../types/triage';
import { performHeuristicTriage } from '../utils/triageEngine';

export async function triageComplaint(text: string): Promise<TriageResult> {
  try {
    const res = await fetch('/api/triage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Backend triage error, using clinical heuristic engine:', errData);
      return performHeuristicTriage(text);
    }

    const data: TriageResult = await res.json();
    return data;
  } catch (error) {
    console.warn('Network error reaching triage endpoint, using clinical heuristic engine:', error);
    return performHeuristicTriage(text);
  }
}

export async function triageBatchComplaints(
  complaints: { id: string; complaintText: string }[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, TriageResult>> {
  const resultMap = new Map<string, TriageResult>();
  const total = complaints.length;
  let completed = 0;

  // Process with concurrency limit of 3 for smooth UX and rate management
  const batchSize = 3;
  for (let i = 0; i < complaints.length; i += batchSize) {
    const chunk = complaints.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (item) => {
        const result = await triageComplaint(item.complaintText);
        resultMap.set(item.id, result);
        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }
      })
    );
  }

  return resultMap;
}
