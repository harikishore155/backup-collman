import dayjs from "dayjs";

export const mapAuditLogEntry = (raw, index) => {
  const userRef =
    raw?.changedBy ??
    raw?.changed_by ??
    raw?.performedBy ??
    raw?.performed_by ??
    raw?.user ??
    raw?.createdBy ??
    raw?.created_by ??
    null;

  const userName =
    (typeof userRef === "object"
      ? userRef?.fullName ??
        userRef?.full_name ??
        userRef?.name ??
        userRef?.userName ??
        userRef?.user_name ??
        userRef?.email
      : null) ??
    raw?.userName ??
    raw?.user_name ??
    raw?.performedByName ??
    raw?.performed_by_name ??
    (typeof userRef === "string" ? userRef : null) ??
    "Unknown user";

  const userId =
    (typeof userRef === "object"
      ? userRef?._id ?? userRef?.id
      : null) ??
    raw?.userId ??
    raw?.user_id ??
    raw?.performedById ??
    raw?.performed_by_id ??
    null;

  const description =
    raw?.remarks ??
    raw?.description ??
    raw?.message ??
    raw?.detail ??
    raw?.details ??
    raw?.summary ??
    raw?.changeSummary ??
    raw?.change_summary ??
    raw?.actionDescription ??
    raw?.action_description ??
    (raw?.action && raw?.module
      ? `${raw.action} — ${raw.module}`
      : raw?.action
        ? String(raw.action)
        : "—");

  const timestamp =
    raw?.createdAt ??
    raw?.created_at ??
    raw?.timestamp ??
    raw?.date ??
    raw?.loggedAt ??
    raw?.logged_at ??
    null;

  const _id =
    raw?._id ?? raw?.id ?? raw?.uuid ?? `audit_${index}_${timestamp ?? index}`;

  return {
    _id: String(_id),
    userName: String(userName),
    userId: userId != null ? String(userId) : null,
    description: String(description),
    timestamp,
    action: raw?.action ?? raw?.type ?? null,
  };
};

export const formatAuditDateTime = (value) => {
  if (!value) return "-";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : String(value);
};

export const mapAuditLogTableRow = (raw, index) => {
  const userRef =
    raw?.changedBy ??
    raw?.changed_by ??
    raw?.performedBy ??
    raw?.performed_by ??
    raw?.user ??
    null;

  const changedBy =
    (typeof userRef === "object"
      ? userRef?.name ??
        userRef?.fullName ??
        userRef?.full_name ??
        userRef?.email
      : null) ??
    (typeof userRef === "string" ? userRef : null) ??
    "Unknown user";

  const timestamp =
    raw?.createdAt ??
    raw?.created_at ??
    raw?.timestamp ??
    raw?.loggedAt ??
    null;

  return {
    _id: String(raw?._id ?? raw?.id ?? `audit_${index}`),
    action: raw?.action ?? "-",
    module: raw?.module ?? "-",
    recordType: raw?.recordType ?? raw?.record_type ?? "-",
    changedBy: String(changedBy),
    createdAt: timestamp,
    createdAtLabel: formatAuditDateTime(timestamp),
    remarks: raw?.remarks ?? raw?.description ?? "-",
  };
};

export const formatAuditDateLabel = (dateKey) => {
  const d = dayjs(dateKey);
  if (!d.isValid()) return dateKey;
  const today = dayjs().startOf("day");
  if (d.isSame(today, "day")) return "Today";
  if (d.isSame(today.subtract(1, "day"), "day")) return "Yesterday";
  return d.format("DD/MM/YY");
};

export const groupAuditLogsByDate = (logs) => {
  const sorted = [...logs].sort((a, b) => {
    const ta = dayjs(a.timestamp).valueOf();
    const tb = dayjs(b.timestamp).valueOf();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });

  const groups = [];
  const indexByKey = new Map();

  sorted.forEach((log) => {
    const d = dayjs(log.timestamp);
    const key = d.isValid() ? d.format("YYYY-MM-DD") : "unknown";
    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({
        dateKey: key,
        label: formatAuditDateLabel(key === "unknown" ? "" : key),
        entries: [],
      });
    }
    groups[indexByKey.get(key)].entries.push(log);
  });

  return groups;
};
