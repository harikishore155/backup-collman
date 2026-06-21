/** First own coalesce: like `a ?? b ?? …` across `keys` on `o`. */
const pick = (o, keys) => keys.reduce((acc, k) => (acc != null ? acc : o?.[k]), undefined);

/** Primary id for API calls and routes. */
export function getRoleApiId(raw, index = 0) {
  return String(pick(raw, ["_id", "id", "roleId", "role_id", "uuid"]) ?? `row_${index}`);
}

/** Human-facing Role ID (code first); `routeFallback` when payload has no label. */
export function getRoleDisplayId(raw, routeFallback) {
  const v = pick(raw, ["code", "role_code", "roleId", "id", "role_id"]);
  if (v != null && v !== "") return String(v);
  if (routeFallback != null && routeFallback !== "") return String(routeFallback);
  return "";
}

/** Stable table row key. */
export function getRoleRowKeyValue(raw, index = 0) {
  return String(pick(raw, ["roleId", "role_id"]) ?? getRoleApiId(raw, index));
}
