import http from "node:http";
import fs from "node:fs";

// Task 5 keeps the API credential on the local server rather than in the React
// bundle. The browser sends only the bounded evidence packet to this endpoint.

function loadDotEnv() {
  try {
    const text = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator < 1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Environment variables can also be supplied directly by the shell.
  }
}

loadDotEnv();

const PORT = Number(process.env.AI_SERVER_PORT || 8787);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
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

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON request."));
      }
    });
    req.on("error", reject);
  });
}

function extractOutputText(response) {
  const parts = [];
  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (typeof part.text === "string") parts.push(part.text);
    }
  }
  return parts.join("\n");
}

function parseModelJson(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// The model must cite source rows, but it is still an untrusted text generator.
// This deterministic sanitation step removes any citation that is not present
// in the evidence packet before the result reaches the UI.
function sanitizeResult(result, evidenceIds) {
  const allowed = new Set(evidenceIds);

  const cleanList = (value) => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && typeof item === "object" && typeof item.text === "string")
      .slice(0, 3)
      .map((item) => ({
        text: item.text.trim().slice(0, 400),
        evidenceIds: Array.isArray(item.evidenceIds)
          ? [...new Set(item.evidenceIds.filter((id) => allowed.has(id)))].slice(0, 6)
          : [],
      }))
      .filter((item) => item.text && item.evidenceIds.length > 0);
  };

  return {
    observedPatterns: cleanList(result?.observedPatterns),
    investigationTopics: cleanList(result?.investigationTopics),
    recommendedChecks: cleanList(result?.recommendedChecks).slice(0, 2),
  };
}

async function callGemini(evidence) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add your Gemini API key to .env before generating an AI brief.",
    );
  }

  const prompt = [
    SYSTEM_INSTRUCTIONS,
    "Create the investigation brief from this evidence packet:",
    JSON.stringify(evidence, null, 2),
  ].join("\n\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 900,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || `Gemini request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const outputText = extractOutputText(data);
  if (!outputText) throw new Error("The LLM returned no text output.");

  return parseModelJson(outputText);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/ai-investigation") {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const evidence = body?.evidence;

    if (
      !evidence ||
      !Array.isArray(evidence.evidenceRows) ||
      !Array.isArray(evidence.flaggedDefectIds) ||
      evidence.flaggedDefectIds.length === 0
    ) {
      sendJson(res, 400, { error: "The request does not contain a valid flagged-evidence packet." });
      return;
    }

    // Only defect IDs actually supplied to the model are accepted as citations.
    const evidenceIds = evidence.evidenceRows.map((row) => row.defectId);
    const result = await callGemini(evidence);
    const sanitized = sanitizeResult(result, evidenceIds);

    sendJson(res, 200, {
      result: sanitized,
      evidence,
      model: GEMINI_MODEL,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected AI service error.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`BMW Task 5 Gemini AI server listening on http://localhost:${PORT}`);
});
