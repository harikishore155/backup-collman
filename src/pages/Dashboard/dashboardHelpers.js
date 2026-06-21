export const pickRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  for (const key of ["data", "rows", "items", "results", "alerts"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (payload?.data && typeof payload.data === "object" && payload.data !== payload) {
    return pickRows(payload.data);
  }
  return [];
};
