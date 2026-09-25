# Task 5 — Embed Gen AI

## Specific job

The application provides one focused AI workflow:

> **AI Root-Cause Investigation Brief** — after an engineer flags an individual defect in Task 3, the LLM reviews that flagged record plus deterministic supporting evidence and suggests a short set of investigation topics and next checks.

This is not a chatbot and there is no free-text prompt over the dataset.

## Where it lives

Task 5 is embedded in the **Task 3 Quality Workflow** investigation drawer. The Vehicle Watchlist can help an engineer discover a VIN worth reviewing, but the AI starts from an individual Task 3 tracking record so the workflow directly uses flagged data.

## Evidence pipeline

1. Engineer flags an individual defect in Task 3.
2. `src/utils/aiInvestigation.ts` finds that defect in the full 8,198-record dataset.
3. The application deterministically adds supporting records using transparent rules:
   - same VIN;
   - same station + defect category within ±14 days;
   - same part number + defect name.
4. Supporting evidence is capped at 24 rows.
5. The application sends the bounded evidence packet to `server/aiServer.mjs`.
6. The Node server calls Gemini using the server-side `GEMINI_API_KEY`.
7. Gemini returns structured JSON containing observed patterns, possible investigation topics and recommended next checks.
8. The server removes any evidence citation that was not present in the supplied evidence packet.
9. The UI independently verifies that every displayed finding cites at least one supplied evidence row.
10. The engineer can open the evidence rows and filters and disagree with the AI.

## What the LLM is not allowed to do

- It does not calculate Task 2 statistics.
- It does not select additional records.
- It does not invent production data.
- It does not modify severity, resolution status or tracking status.
- It does not delete or deduplicate records.
- It does not declare a confirmed root cause.
- It does not classify a vehicle as good/bad or recommend automatic rejection.

## Checkability

The AI UI exposes:

- exact defect IDs used as evidence;
- the deterministic filters used to select supporting records;
- source-row fields such as station, defect, severity, VIN and resolution status;
- an evidence-reference verification result.

The deterministic check proves that the cited IDs exist in the supplied evidence packet. It does **not** prove causation. Root-cause suggestions remain engineering hypotheses that the user must verify.

## Confidently-wrong protection

The model's output is constrained to an investigation aid. Even a confidently wrong hypothesis cannot directly change the production dataset or tracking state. The engineer sees the underlying rows and filters and can reject the suggestion.

## API configuration

`.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
AI_SERVER_PORT=8787
```

The API key is server-side and is not included in the project ZIP.
