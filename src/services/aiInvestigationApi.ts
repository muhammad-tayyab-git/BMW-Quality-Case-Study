import type {
  AIInvestigationEvidencePacket,
  AIInvestigationResponse,
} from "../types/aiInvestigation";

const AI_API_URL = "http://localhost:8787/api/ai-investigation";

export async function generateAIInvestigationBrief(
  evidence: AIInvestigationEvidencePacket,
): Promise<AIInvestigationResponse> {
  const response = await fetch(AI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ evidence }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error || `AI investigation service failed with status ${response.status}.`,
    );
  }

  return payload as AIInvestigationResponse;
}
