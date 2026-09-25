# BMW Quality Intelligence — Final Setup Guide

This guide is the only setup document needed to run the final case-study application locally.

## 1. Requirements

- Node.js and npm installed
- A modern browser
- The project extracted locally
- A Gemini API key if you want to use Task 5 AI generation

The dashboard itself does not require an API key. Only the Task 5 LLM request does.

## 2. Install dependencies

Open a terminal in the project folder:

```bash
npm install
```

## 3. Start the dashboard

```bash
npm run dev
```

Open the Vite URL printed by the terminal, normally something similar to:

```text
http://localhost:5173
```

## 4. Configure Task 5 AI

Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Then set:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
AI_SERVER_PORT=8787
```

Keep `.env` local. It is ignored by Git and must not be placed in the frontend source or committed to a repository.

Google's Gemini API documentation currently lists `gemini-3.5-flash-lite` as an available model. Free-tier availability and quotas depend on the provider account and model and can change, so check the provider's current AI Studio quota if an API request is refused. The application itself does not assume that the API is always available.

## 5. Start the AI server

Open a second terminal in the same project folder:

```bash
npm run ai
```

The server should report:

```text
BMW Task 5 Gemini AI server listening on http://localhost:8787
```

Keep this terminal running while testing Task 5.

## 6. Test Task 5

Use this exact workflow:

1. Open **Quality Workflow**.
2. Flag an individual defect using **Flag & Save** if one is not already tracked.
3. Open the tracked investigation record.
4. Scroll to **Task 5 · AI investigation**.
5. Click **Generate AI brief**.
6. Review the short AI output.
7. Open **Show evidence and filters**.
8. Check the cited Defect IDs against the displayed source rows and filters.

The AI cannot be generated from the Vehicle Watchlist alone. Task 5 deliberately starts from an individual Task 3 tracking record because the case requires flagged data.

## 7. What to do if Gemini is unavailable

The dashboard and Tasks 1–4 continue to work without Gemini. If Task 5 reports a missing key, quota/credit error, network error, or provider error, check `.env`, the AI server terminal, and the current provider quota.

Do not put the API key into React code, `VITE_*` variables, screenshots, or the ZIP submission.

## 8. Verify the final frontend build

Run:

```bash
npm run build
```

A successful build ends with a Vite production-build summary and no TypeScript errors.

## 9. Production note

This case-study prototype keeps Task 3 tracking state in browser `localStorage` and uses a small local Node server for the AI API call. A production implementation would replace local persistence with an authenticated shared backend and apply server-side access control, logging, rate limits and secret management.
