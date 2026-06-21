# CRM Dashboard Frontend Audit

## Section 1 - Executive Summary

Estimated frontend completion after fixes: **82%**.

The existing `/dashboard` route and design were retained. The original page had all dashboard API endpoint constants, but only partially rendered their responses. Its filter bar was disabled, it sent an unsupported `role` query, fetched drilldown without required parameters, hid fetched alerts, lacked monthly trend/target charts, and had no refresh lifecycle or request cancellation.

Implemented fixes include role-aware documented filters, active campaign options, current-month default, all required KPI cards, daily/monthly and target charts, distribution/PTP drilldowns, performance tables, on-demand drilldown, alerts, polling/manual refresh/last-updated state, stale-request protection, responsive/accessibility improvements, and centralized 401 handling.

## Section 2 - Feature Audit Table

| Requirement | Status | Completion | Evidence | Remarks |
|---|---|---:|---|---|
| Filter panel and actions | Completed | 100% | `src/pages/Dashboard/FilterBar/FilterBar.jsx` (`FilterBar`) | Sends only documented non-empty filters; current month is default. |
| Role-based filter visibility | Completed | 100% | `FilterBar.jsx` (`HIERARCHY_FILTERS`) | Backend remains authoritative. |
| Active campaigns only | Completed | 100% | `src/features/campaigns/campaignApi.js` (`fetchCampaignsApi`, `filterActiveCampaigns`) | Existing active-only API helper reused. |
| KPI cards | Completed | 100% | `src/pages/Dashboard/DashboardLayout/DashboardLayout.jsx` (`mapKpis`) | Required ten KPI cards; supported cards drill down. |
| KPI no-data/error states | Partial | 65% | `DashboardLayout.jsx`, `Statcard/Statcard.jsx` | Page error/loading states exist; absent KPI payload displays zero rather than a distinct no-data card. |
| Daily/monthly collection trends | Completed | 100% | `DashboardLayout.jsx` (`dailyTrend`, `monthlyTrend` calls), `DashboardWidgets.jsx` (`TrendCard`) | Monthly request uses `granularity=monthly`. |
| Target vs achievement | Completed | 100% | `DashboardWidgets.jsx` (`TargetAchievementCard`) | Responsive chart with INR tooltip. |
| MIS/status distributions | Completed | 100% | `DashboardLayout.jsx`, `Tablecard/Tablecard.jsx`, `MtdDispoChart/MtdDispoChart.jsx` | Click/keyboard drilldown enabled. |
| Telecaller/campaign performance | Partial | 80% | `DashboardWidgets.jsx` (`PerformanceTable`) | Search/sort/pagination/loading/empty/drilldown complete; main tables currently paginate the fetched result client-side. |
| PTP dashboard | Completed | 100% | `DashboardLayout.jsx` (`ptpRows`) | Due today, next two days, overdue and drilldown. |
| Drilldown | Completed | 95% | `DashboardWidgets.jsx` (`DrilldownPanel`), `DashboardLayout.jsx` (`fetchDrilldown`) | CASE/TELECALLER/CAMPAIGN, filters, pagination, search, whitelisted sorting, back/empty states. |
| Realtime/refresh | Completed | 90% | `DashboardLayout.jsx` (`fetchDashboard`, polling effects) | Configurable polling/manual refresh/last updated/dedup/cancellation. No dashboard-specific socket event is assumed. |
| Export | Missing/Unsupported | 0% | `src/api/endpoints/dashboardEndpoints.js` | No dashboard export API exists; no fake Excel/PDF action added. |
| Alerts | Completed | 100% | `DashboardWidgets.jsx` (`AlertsCard`) | Renders returned overdue PTP and payout configuration alerts without inventing categories. |
| Responsive/accessibility | Completed | 85% | Dashboard SCSS files and interactive component JSX | Responsive grids, labels, keyboard rows, dialog semantics; loading uses text states rather than full skeleton components. |
| Request cancellation/stale protection | Completed | 100% | `dashboardApi.js`, `DashboardLayout.jsx` request refs | Axios signals used for dashboard and drilldown calls. |
| 401/403 handling | Completed | 100% | `src/utils/axiosInstance.js`, `DashboardLayout.jsx` (`errorMessage`) | 401 clears session/redirects; 403 is shown and actions remain role-hidden. |

## Section 3 - Completed Features

- Reused the existing dashboard route, endpoint client, cards, tables, chart, role constants, auth store, and SCSS variables.
- Added documented filters and removed the unsupported frontend `role` query.
- Rendered previously unused trend, target, telecaller, campaign, PTP, alert, and drilldown API data.
- Added safe polling, manual refresh, last-updated state, request deduplication, cancellation, and stale-response checks.
- Added role-aware hierarchy controls and role-aware campaign/telecaller drilldown actions.

## Section 4 - Missing Features

- Dashboard export remains unavailable because the supplied backend API surface contains no export endpoint.
- No automated test suite or test-runner script exists. The current `npm test` script starts Vite in test mode.
- No TypeScript/type-check script exists; the repository is JavaScript with `jsconfig.json`.
- Authenticated API response-shape verification requires valid credentials/session data.

## Section 5 - Incorrect Implementations Found

- The original dashboard sent `role=All Roles` logic instead of documented hierarchy filters.
- The original filter bar was commented out and contained unrelated role choices.
- The original dashboard called `/drilldown` on initial load without required `level` and `metric`.
- Alerts were fetched into an unused state and never rendered.
- Collection trend could incorrectly replace status chart data because it inspected stale React state.
- Currency strings contained mojibake instead of reliable locale currency formatting.

## Section 6 - Performance Issues

- Fixed duplicate overlapping refreshes and added polling cleanup/cancellation.
- Main performance table APIs request up to 100 rows and paginate locally. For very large datasets, backend-driven table paging should replace this once response pagination contracts are confirmed.
- Production build reports existing large chunks over 500 kB, including the global bundle and XLSX dependency.

## Section 7 - Security and Accessibility Issues

- Fixed missing global 401 handling and added clear 403 dashboard feedback.
- Drilldown sorting sends only whitelisted fields; empty/malformed filters are removed.
- Frontend visibility is defense-in-depth only; backend hierarchy enforcement remains required.
- Existing auth cookies are JavaScript-readable because the frontend writes them in `src/utils/authCookies.js`. True HttpOnly token storage must be implemented by the backend.
- Interactive KPI cards, distribution rows, chart bars, labels, and drilldown dialog now have keyboard/semantic support.

## Section 8 - Code Changes

| Exact file | Component/function | Reason |
|---|---|---|
| `src/pages/Dashboard/DashboardLayout/DashboardLayout.jsx` | `DashboardLayout`, `fetchDashboard`, `fetchDrilldown`, mappers | Orchestrate documented APIs, filters, roles, refresh, polling, errors, cancellation, and drilldowns. |
| `src/pages/Dashboard/FilterBar/FilterBar.jsx` | `FilterBar`, `HIERARCHY_FILTERS` | Implement the missing role-aware filter panel. |
| `src/pages/Dashboard/DashboardWidgets/DashboardWidgets.jsx` | Charts, tables, alerts, drilldown panel | Render previously missing API-backed dashboard sections. |
| `src/pages/Dashboard/dashboardHelpers.js` | `pickRows` | Shared safe list extraction for dashboard response wrappers. |
| `src/features/dashboard/dashboardApi.js` | All fetch functions | Add Axios cancellation signal support. |
| `src/utils/axiosInstance.js` | response interceptor | Handle 401 globally while preserving 403 for UI feedback. |
| `src/pages/Dashboard/Statcard/Statcard.jsx` | `StatCard` | Loading and accessible drilldown action. |
| `src/pages/Dashboard/Tablecard/Tablecard.jsx` | `TableCard` | Keyboard/click distribution and PTP drilldowns. |
| `src/pages/Dashboard/MtdDispoChart/MtdDispoChart.jsx` | `MtdDispoChart` | Chart click drilldown. |
| `src/pages/Dashboard/Allocationtable/Allocationtable.jsx` | `AllocationTable` | Campaign drilldown action. |
| Corresponding Dashboard SCSS files | Responsive and interaction styles | Preserve the existing design language while supporting new states/layouts. |

## Section 9 - Verification

- **Dashboard-scoped lint:** Passed.
- **Full repository lint:** Failed on 78 existing errors and 25 warnings outside the dashboard change scope.
- **Type-check:** Not available; no TypeScript/type-check script exists.
- **Tests:** Not available; no test files/test runner exist and `npm test` is a Vite mode command.
- **Production build:** Passed with Vite 8.0.10.
- **Backend route verification:** All ten dashboard API routes at `http://localhost:5000/api/v1/dashboard/*` are reachable and returned expected `401 Unauthorized` without a valid session.
- **Remaining limitations:** Authenticated payload verification, backend-supported export, distinct KPI skeleton/no-data cards, and fully server-driven main performance table pagination.
