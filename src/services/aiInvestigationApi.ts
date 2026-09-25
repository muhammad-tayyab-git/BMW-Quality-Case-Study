import type {
  AIInvestigationEvidencePacket,
  AIInvestigationResponse,
} from "../types/aiInvestigation";

const AI_ENDPOINT = "/api/ai-investigation";

export async function generateAIInvestigationBrief(
  evidence: AIInvestigationEvidencePacket,
): Promise<AIInvestigationResponse> {
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ evidence }),
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `AI service returned an invalid response (${response.status}).`,
    );
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : `AI investigation failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data as AIInvestigationResponse;
}