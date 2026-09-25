import type { AIInvestigationEvidencePacket } from "../src/types/aiInvestigation";

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const MAX_BODY_BYTES = 500_000;

const SYSTEM_INSTRUCTIONS = `You are an engineering quality investigation assistant inside a BMW production-quality dashboard.

Your one job is to turn a Task 3 engineer-flagged defect plus a small, deterministic evidence set into a short factual investigation brief.

Rules:
- Use ONLY the supplied evidence packet. Never invent records, numbers, causes, suppliers, process facts, or filters.
- The application selected the evidence rows before you were called. Do not ask for more data and do not expand the evidence set.
- The application owns all statistical calculations. Do not replace or reinterpret Task 2 outlier methods.
- Distinguish observations from hypotheses.
- Never claim that a root cause is confirmed. Use wording such as "possible investigation topic", "may warrant checking", or "the evidence shows".
- Keep the output short: maximum 3 observed patterns, 3 investigation topics, and 2 recommended checks.
- Every item must cite one or more exact defectId values from the supplied evidenceRows.
- Never cite an ID that is not present in evidenceRows.
- Do not make a vehicle-level quality verdict and do not recommend automatic rejection.
- If the evidence is insufficient, say so instead of guessing.

Return JSON only in this exact shape:
{
  "observedPatterns": [{"text": "...", "evidenceIds": ["..."]}],
  "investigationTopics": [{"text": "...", "evidenceIds": ["..."]}],
  "recommendedChecks": [{"text": "...", "evidenceIds": ["..."]}]
}`;

function jsonResponse(
  payload: unknown,
  status = 200,
): Response {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function extractOutputText(response: any): string {
  const parts: string[] = [];

  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (typeof part.text === "string") {
        parts.push(part.text);
      }
    }
  }

  return parts.join("\n");
}

function parseModelJson(text: string): any {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

function sanitizeResult(
  result: any,
  evidenceIds: string[],
) {
  const allowed = new Set(evidenceIds);

  const cleanList = (value: unknown, maxItems: number) => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.text === "string",
      )
      .slice(0, maxItems)
      .map((item) => ({
        text: item.text.trim().slice(0, 400),

        evidenceIds: Array.isArray(item.evidenceIds)
          ? [
              ...new Set(
                item.evidenceIds.filter((id: unknown) =>
                  typeof id === "string" && allowed.has(id),
                ),
              ),
            ].slice(0, 6)
          : [],
      }))
      .filter(
        (item) =>
          item.text &&
          item.evidenceIds.length > 0,
      );
  };

  return {
    observedPatterns: cleanList(
      result?.observedPatterns,
      3,
    ),

    investigationTopics: cleanList(
      result?.investigationTopics,
      3,
    ),

    recommendedChecks: cleanList(
      result?.recommendedChecks,
      2,
    ),
  };
}

async function callGemini(
  evidence: AIInvestigationEvidencePacket,
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server.",
    );
  }

  const prompt = [
    SYSTEM_INSTRUCTIONS,
    "Create the investigation brief from this evidence packet:",
    JSON.stringify(evidence, null, 2),
  ].join("\n\n");

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      GEMINI_MODEL,
    )}:generateContent`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },

    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],

      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 900,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `Gemini request failed with status ${response.status}.`;

    throw new Error(message);
  }

  const outputText = extractOutputText(data);

  if (!outputText) {
    throw new Error("The LLM returned no text output.");
  }

  return parseModelJson(outputText);
}

export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get("content-length");

    if (
      contentLength &&
      Number(contentLength) > MAX_BODY_BYTES
    ) {
      return jsonResponse(
        { error: "Request body is too large." },
        413,
      );
    }

    const body = await request.json();

    const evidence =
      body?.evidence as AIInvestigationEvidencePacket | undefined;

    if (
      !evidence ||
      !Array.isArray(evidence.evidenceRows) ||
      !Array.isArray(evidence.flaggedDefectIds) ||
      evidence.flaggedDefectIds.length === 0
    ) {
      return jsonResponse(
        {
          error:
            "The request does not contain a valid flagged-evidence packet.",
        },
        400,
      );
    }

    const evidenceIds = evidence.evidenceRows
      .map((row) => row.defectId)
      .filter(Boolean);

    const result = await callGemini(evidence);

    const sanitized = sanitizeResult(
      result,
      evidenceIds,
    );

    return jsonResponse({
      result: sanitized,
      evidence,
      model: GEMINI_MODEL,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Task 5 AI investigation error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected AI service error.",
      },
      500,
    );
  }
}