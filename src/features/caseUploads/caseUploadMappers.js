import { extractListPayload } from "@/utils/apiHelpers";
import {
  formatCampaignOptionLabel,
  readCampaignMongoId,
} from "@/features/targets/targetMappers";

const formatCurrency = (value) => {
  if (value == null || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `₹${num.toLocaleString("en-IN")}`;
};

const formatLastUploadedAt = (value) => {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
};

const pickCount = (...values) => {
  const value = values.find((v) => v != null && v !== "");
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
};

const formatUserDetails = (value) => {
  if (value == null || value === "") return "â€”";
  if (Array.isArray(value)) {
    const users = value.map(formatUserDetails).filter((v) => v && v !== "-");
    return users.length ? users.join(", ") : "-";
  }
  if (typeof value !== "object") return String(value);

  const name = [
    value.name,
    value.fullName,
    value.full_name,
    value.firstName,
    value.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    name ||
    value.email ||
    value.contactNumber ||
    value.mobile ||
    value.phone ||
    value.employeeId ||
    value.UID ||
    value.id ||
    value.username ||
    value._id ||
    "â€”"
  );
};

const readCampaignCode = (raw, campaignLabel = "") => {
  const direct = raw?.campaignCode ?? raw?.campaign_code ?? "";
  if (direct) return String(direct);
  if (campaignLabel) return String(campaignLabel);

  const ref = raw?.campaign ?? raw?.campaignId ?? raw?.campaign_id;
  if (ref != null && typeof ref === "object") {
    return formatCampaignOptionLabel(ref);
  }
  if (ref != null && ref !== "") return String(ref);

  return "—";
};

const rowMatchesCampaignId = (raw, campaignId) => {
  if (!campaignId) return true;
  const cid = String(campaignId);
  const candidates = [
    raw?.campaign_id,
    raw?.campaignId,
    raw?.campaign?._id,
    raw?.campaign?.id,
    readCampaignMongoId(raw?.campaign ?? raw),
    readCampaignMongoId(raw),
  ]
    .filter((v) => v != null && v !== "")
    .map(String);
  return candidates.some((v) => v === cid);
};

/** Flatten preview/case rows from upload response or campaigns API payload. */
export const pickPreviewRows = (data, campaignId) => {
  if (data == null) return [];

  const nested =
    data?.previewRows ??
    data?.preview_rows ??
    data?.preview ??
    data?.cases ??
    null;

  if (Array.isArray(nested) && nested.length > 0) {
    return nested.filter((row) => rowMatchesCampaignId(row, campaignId));
  }

  const { rows } = extractListPayload(data);
  if (!rows.length) return [];

  const looksLikeCaseRow = rows.some(
    (r) =>
      r?.customerName != null ||
      r?.customer_name != null ||
      r?.customerCode != null ||
      r?.customer_code != null ||
      r?.contactNumber != null ||
      r?.accountNumber != null,
  );

  if (looksLikeCaseRow) {
    return rows.filter((row) => rowMatchesCampaignId(row, campaignId));
  }

  return rows
    .flatMap((item) => {
      const preview =
        item?.previewRows ??
        item?.preview_rows ??
        item?.preview ??
        item?.cases ??
        [];
      if (Array.isArray(preview) && preview.length) return preview;
      const nestedRows = item?.rows ?? item?.data;
      return Array.isArray(nestedRows) ? nestedRows : [];
    })
    .filter((row) => row && rowMatchesCampaignId(row, campaignId));
};

const normalizeColumnOption = (col, index) => {
  if (col == null || col === "") return null;
  if (typeof col === "string") {
    const trimmed = col.trim();
    if (!trimmed) return null;
    return { label: trimmed, value: trimmed };
  }
  const label = String(
    col.label ?? col.name ?? col.header ?? col.column ?? col.field ?? index,
  ).trim();
  const value = String(col.value ?? col.name ?? col.header ?? label).trim();
  if (!label && !value) return null;
  return { label: label || value, value: value || label };
};

/** CSV / Excel column names from upload response for field-mapping dropdowns. */
export const pickCsvColumns = (data, campaignId) => {
  if (data == null) return [];

  const explicit =
    data.columns ??
    data.headers ??
    data.csvColumns ??
    data.csv_columns ??
    data.fileColumns ??
    data.file_columns;

  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit
      .map(normalizeColumnOption)
      .filter(Boolean);
  }

  const rows = pickPreviewRows(data, campaignId);
  if (!rows.length) return [];

  const keys = new Set();
  rows.forEach((row) => {
    if (!row || typeof row !== "object") return;
    Object.keys(row).forEach((key) => {
      if (key.startsWith("_") || key === "id" || key === "sno") return;
      keys.add(key);
    });
  });

  return [...keys]
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((key) => ({ label: key, value: key }));
};

export const pickPreviewMeta = (data, rowCount = 0) => {
  const totalRows =
    typeof data?.totalRows === "number"
      ? data.totalRows
      : typeof data?.total_rows === "number"
        ? data.total_rows
        : typeof data?.total === "number"
          ? data.total
          : typeof data?.count === "number"
            ? data.count
            : typeof data?.uploaded === "number"
              ? data.uploaded
              : rowCount;

  const totalColumns =
    typeof data?.totalColumns === "number"
      ? data.totalColumns
      : typeof data?.total_columns === "number"
        ? data.total_columns
        : typeof data?.columnCount === "number"
          ? data.columnCount
          : typeof data?.column_count === "number"
            ? data.column_count
            : Array.isArray(data?.columns)
              ? data.columns.length
              : Array.isArray(data?.headers)
                ? data.headers.length
                : 0;

  return { totalRows, totalColumns };
};

export const mapImportPreviewRow = (raw, index, campaignLabel = "") => {
  const _id = raw?._id ?? raw?.id ?? `preview_${index}`;

  return {
    _id: String(_id),
    campaignCode: readCampaignCode(raw, campaignLabel),
    lastUploadedAt: formatLastUploadedAt(
      raw?.lastUploadedAt ??
        raw?.last_uploaded_at ??
        raw?.uploadedAt ??
        raw?.uploaded_at ??
        raw?.createdAt ??
        raw?.created_at,
    ),
    customerName: String(raw?.customerName ?? raw?.customer_name ?? "—"),
    customerCode: String(raw?.customerCode ?? raw?.customer_code ?? ""),
    phone: String(
      raw?.phone ??
        raw?.contactNumber ??
        raw?.contact_number ??
        raw?.customerMobile ??
        raw?.customer_mobile ??
        "—",
    ),
    email: String(raw?.email ?? "—"),
    product: String(
      raw?.product ??
        raw?.productName ??
        raw?.product_name ??
        raw?.productId?.productName ??
        "—",
    ),
    outstandingAmt: formatCurrency(
      raw?.outstandingAmt ??
        raw?.outstanding_amt ??
        raw?.outstandingAmount ??
        raw?.outstanding_amount,
    ),
    status: String(raw?.status ?? raw?.case_status ?? raw?.caseStatus ?? "—"),
  };
};

export const mapImportHomeRow = (raw, index = 0) => {
  const _id = raw?._id ?? raw?.id ?? `row_${index}`;
  const uploadedData = Array.isArray(raw?.uploadedData) ? raw.uploadedData : [];
  const errorData = Array.isArray(raw?.errorData) ? raw.errorData : [];
  const campaignId =
    raw?.campaignId ??
    raw?.campaign_id ??
    _id;
  const campaignObjectId =
    raw?.campaignObjectId ??
    raw?.campaign_object_id ??
    raw?.campaign?._id ??
    raw?.campaign?.id ??
    readCampaignMongoId(raw?.campaign ?? raw) ??
    "";
  const entityType = String(
    raw?.entityType ??
      raw?.entity_type ??
      raw?.type ??
      raw?.fileType ??
      raw?.file_type ??
      raw?.campaignName ??
      raw?.campaign_name ??
      formatCampaignOptionLabel(raw) ??
      "—",
  ).trim() || "—";

  const uploadedAt = formatLastUploadedAt(
    raw?.uploadedAt ??
      raw?.uploaded_at ??
      raw?.lastUploadedAt ??
      raw?.last_uploaded_at ??
      raw?.firstUploadedAt ??
      raw?.first_uploaded_at ??
      raw?.createdAt ??
      raw?.created_at,
  );
  const uploadBy =
    raw?.uploadBy ??
    "-";

  return {
    _id: String(_id),
    campaignId: campaignId != null ? String(campaignId) : "",
    campaignObjectId:
      campaignObjectId != null ? String(campaignObjectId) : "",
    entityType,
    uploadedCount: pickCount(raw?.uploadedCount, raw?.uploaded, raw?.allocatedCases),
    notUploadedCount: pickCount(
      raw?.errorCount,
      raw?.failed,
      raw?.notUploaded,
      raw?.not_uploaded,
      raw?.notAllocatedCases,
    ),
    totalCases: pickCount(raw?.totalCases, raw?.total, raw?.count),
    uploadBy: String(uploadBy),
    uploadedAt,
    uploadedBy: formatUserDetails(
      raw?.uploadedBy ??
        raw?.uploaded_by ??
        raw?.createdBy ??
        raw?.created_by ??
        raw?.user,
    ),
    uploadedData,
    errorData,
  };
};
