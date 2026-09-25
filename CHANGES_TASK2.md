# Task 2 implementation changes

## Added
- `src/components/OutlierDetection.tsx` — production-style Task 2 dashboard.
- `TASK2.md` — methodology, verification results, assumptions, trade-offs and KPI ideas.

## Updated
- `src/pages/Dashboard.tsx` — added the Outlier Detection tab and removed the temporary verification screen.
- `src/App.css` — responsive Task 2 layout and detail styles.
- `README.md` — documented Task 2 coverage.

## Removed
- `src/components/OutlierVerification.tsx` — temporary verification-only component.

## Existing detector retained
`src/utils/outlierDetection.ts` continues to provide:
- rolling median + MAD for daily defect volume;
- IQR for station defect volume;
- 99th percentile for defects per VIN;
- log1p + IQR for resolution time;
- IQR for rework time.

## Verification
The project was checked with:
- `npm run lint` — passed
- `npm run build` — passed

Vite reports a bundle-size advisory (>500 kB) but the production build completes successfully.

## Run
After extracting the project:

```bash
npm install
npm run dev
```
