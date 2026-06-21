/**
 * True only when the body explicitly reports failure (`success: false`).
 * Many endpoints return 2xx with the entity and omit `success: true`.
 */
export const isApiFailure = (data) =>
  data != null && typeof data === "object" && data.success === false;

/**
 * Extracts rows and total count from various API response formats.
 * @param {object|array} data - The API response data.
 * @returns {object} - { rows: array, total: number }
 */
export const extractListPayload = (data) => {
  if (Array.isArray(data)) return { rows: data, total: data.length };
  if (data && typeof data === "object") {
    const rows =
      (Array.isArray(data.results) && data.results) ||
      (Array.isArray(data.data) && data.data) ||
      (Array.isArray(data.clients) && data.clients) ||
      (Array.isArray(data.users) && data.users) ||
      (Array.isArray(data.products) && data.products) ||
      (Array.isArray(data.types) && data.types) ||
      (Array.isArray(data.mis_codes) && data.mis_codes) ||
      (Array.isArray(data.fields) && data.fields) ||
      (Array.isArray(data.roles) && data.roles) ||
      (Array.isArray(data.campaigns) && data.campaigns) ||
      (Array.isArray(data.cases) && data.cases) ||
      (Array.isArray(data.preview) && data.preview) ||
      (Array.isArray(data.previewRows) && data.previewRows) ||
      (Array.isArray(data.preview_rows) && data.preview_rows) ||
      (Array.isArray(data.uploads) && data.uploads) ||
      (Array.isArray(data.case_uploads) && data.case_uploads) ||
      (Array.isArray(data.customers) && data.customers) ||
      (Array.isArray(data.targets) && data.targets) ||
      (Array.isArray(data.goal_sheets) && data.goal_sheets) ||
      (Array.isArray(data.goalSheets) && data.goalSheets) ||
      (Array.isArray(data.daily_call_reports) && data.daily_call_reports) ||
      (Array.isArray(data.dailyCallReports) && data.dailyCallReports) ||
      (Array.isArray(data.audit_logs) && data.audit_logs) ||
      (Array.isArray(data.auditLogs) && data.auditLogs) ||
      (Array.isArray(data.logs) && data.logs) ||
      (Array.isArray(data.items) && data.items) ||
      [];
    const total =
      typeof data.total === "number"
        ? data.total
        : typeof data.totalCount === "number"
          ? data.totalCount
          : typeof data.count === "number"
            ? data.count
            : rows.length;
    return { rows, total };
  }
  return { rows: [], total: 0 };
};
