// import CLIENT_ENDPOINTS from "@/api/endpoints/clientEndpoints";
// import {
//   STATUS_FILTER_FIELD,
//   buildUniqueSelectOptions,
// } from "@/utils/listFilterHelpers";

// const selectFromList = (key, label, rows, getValue, getLabel) => ({
//   key,
//   label,
//   type: "select",
//   multiple: true,
//   options: buildUniqueSelectOptions(rows, getValue, getLabel),
// });

// const selectFromApi = (key, label, filterEndpoint) => ({
//   key,
//   label,
//   type: "select",
//   multiple: true,
//   filterEndpoint,
// });

// const textInput = (key, label, placeholder = "") => ({
//   key,
//   label,
//   type: "text",
//   placeholder,
// });

// const formatDateLabel = (iso) => {
//   if (!iso) return "";
//   const d = new Date(iso);
//   return isNaN(d)
//     ? String(iso)
//     : d.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       });
// };

// /** Drop list-derived selects that have no options yet. */
// export const pruneEmptyFilterFields = (config = []) =>
//   config.filter(
//     (field) =>
//       field.filterEndpoint ||
//       field.type !== "select" ||
//       (Array.isArray(field.options) && field.options.length > 0),
//   );

// /** Masters — Clients */
// export const buildClientsFilterConfig = () => [STATUS_FILTER_FIELD];

// /** Masters — Users */
// export const buildUsersFilterConfig = (rows = []) =>
//   pruneEmptyFilterFields([
//     STATUS_FILTER_FIELD,
//     selectFromList("designation", "Designation", rows, (r) => r.designation),
//     selectFromList("branch", "Branch", rows, (r) => r.branch),
//   ]);

// /** Masters — Products */
// export const buildProductsFilterConfig = () => [STATUS_FILTER_FIELD];

// /** Masters — Roles */
// export const buildRolesFilterConfig = () => [STATUS_FILTER_FIELD];

// /** Masters — Fields */
// export const buildFieldsFilterConfig = (rows = []) =>
//   pruneEmptyFilterFields([
//     STATUS_FILTER_FIELD,
//     selectFromList("fieldName", "Field Name", rows, (r) => r.fieldName),
//   ]);

// /** Masters — MIS Code */
// export const buildMisCodeFilterConfig = (rows = []) =>
//   pruneEmptyFilterFields([
//     STATUS_FILTER_FIELD,
//     selectFromApi("clientId", "Client", CLIENT_ENDPOINTS.LIST),
//     selectFromList("misCode", "MIS Code", rows, (r) => r.misCode),
//   ]);

// /** Masters — Type */
// export const buildTypesFilterConfig = (rows = []) =>
//   pruneEmptyFilterFields([
//     STATUS_FILTER_FIELD,
//     selectFromList("name", "Type Name", rows, (r) => r.name),
//   ]);

// /** Customer Mgt — Goal Sheet / Targets */
// export const buildTargetsFilterConfig = (rows = []) =>
//   pruneEmptyFilterFields([
//     STATUS_FILTER_FIELD,
//     selectFromList("campaign", "Campaign ID", rows, (r) => r.campaign),
//     selectFromList("createdAt", "Allocated Date", rows, (r) => r.createdAt),
//     selectFromList("updatedAt", "Closing Date", rows, (r) => r.updatedAt),
//     selectFromList("type", "Allocation Type", rows, (r) => r.type),
//     selectFromList(
//       "assistantManagerId",
//       "AM",
//       rows,
//       (r) => r.assistantManagerId,
//     ),
//     selectFromList("bossMdId", "Manager", rows, (r) => r.bossMdId),
//     selectFromList("tlId", "TL", rows, (r) => r.tlId),
//     selectFromList("clientName", "Client", rows, (r) => r.clientName),
//     selectFromList("type", "Type", rows, (r) => r.type),
//     selectFromList("branch", "Branch", rows, (r) => r.branch),
//     selectFromList("product", "Product", rows, (r) => r.product),
//     selectFromList("workingDays", "Working Days", rows, (r) => r.workingDays),
//     selectFromList(
//       "targetResolutionPercent",
//       "Resolution Target",
//       rows,
//       (r) => r.targetResolutionPercent,
//     ),
//     selectFromList(
//       "rbNrTargetPercent",
//       "NRRB Target",
//       rows,
//       (r) => r.rbNrTargetPercent,
//     ),
//     selectFromList(
//       "collectionTarget",
//       "CE Target",
//       rows,
//       (r) => r.collectionTarget,
//     ),
//     selectFromList(
//       "targetAmount",
//       "Money Collection Target",
//       rows,
//       (r) => r.targetAmount,
//     ),
//   ]);

// /** Customer Mgt — Allocation — EXACTLY 10 filters */
// export const buildAllocationsFilterConfig = (rows = []) =>
//   pruneEmptyFilterFields([
//     // 1. Type
//     selectFromList("type", "Type", rows, (r) => r.type),

//     // 2. Allocation Closing Date
//     selectFromList(
//       "allocationClosingDate",
//       "Allocation Closing Date",
//       rows,
//       (r) => formatDateLabel(r.allocationClosingDate),
//     ),

//     // 3. Allocation Created Date
//     selectFromList(
//       "allocationCreatedDate",
//       "Allocation Created Date",
//       rows,
//       (r) => formatDateLabel(r.createdAt),
//     ),

//     // 4. Product
//     selectFromList("product", "Product", rows, (r) => r.product),

//     // 5. Assistant Manager
//     selectFromList(
//       "assistantManagerId",
//       "Assistant Manager",
//       rows,
//       (r) => r.assistantManagerId,
//     ),

//     // 6. Created At
//     selectFromList(
//       "createdAt",
//       "Created At",
//       rows,
//       (r) => formatDateLabel(r.createdAt),
//     ),

//     // 7. Status — fixed: Active / Completed / Cancelled
//     {
//       key: "status",
//       label: "Status",
//       type: "select",
//       multiple: true,
//       options: [
//         { label: "Active",    value: "Active" },
//         { label: "Completed", value: "Completed" },
//         { label: "Cancelled", value: "Cancelled" },
//       ],
//     },

//     // 8. Month
//     selectFromList("monthYear", "Month", rows, (r) => r.monthYear),

//     // 9. Client
//     selectFromList("clientName", "Client", rows, (r) => r.clientName),

//     // 10. Total Paid Amount — exact text input
//     textInput("totalPaidAmount", "Total Paid Amount", "Enter exact amount…"),
//   ]);

// /** Customer Mgt — Customers */
// export const buildCustomersFilterConfig = (rows = []) =>
//   pruneEmptyFilterFields([
//     selectFromList("clientName", "Client", rows, (r) => r.clientName),
//     selectFromList("product", "Product", rows, (r) => r.product),
//     selectFromList("campaignId", "Campaign", rows, (r) => r.campaignId),
//     selectFromList("branch", "Branch", rows, (r) => r.branch),
//     selectFromList("district", "District", rows, (r) => r.district),
//     selectFromList("collType", "Collection Type", rows, (r) => r.collType),
//   ]);

// /** DCRs */
// export const buildDcrsFilterConfig = (rows = []) =>
//   pruneEmptyFilterFields([
//     selectFromList("campaignId", "Campaign", rows, (r) => r.campaignId),
//     selectFromList(
//       "contactStatus",
//       "Contact Status",
//       rows,
//       (r) => r.contactStatus,
//     ),
//     selectFromList("paidType", "Paid Type", rows, (r) => r.paidType),
//   ]);

// /** ─── Filter Rules ─────────────────────────────────────────────────────────── */

// export const CLIENT_FILTER_RULES = [
//   { key: "status", getValue: (r) => r.status },
// ];

// export const USER_FILTER_RULES = [
//   { key: "status",       getValue: (r) => r.status },
//   { key: "designation",  getValue: (r) => r.designation },
//   { key: "branch",       getValue: (r) => r.branch },
// ];

// export const PRODUCT_FILTER_RULES = [
//   { key: "status", getValue: (r) => r.status },
// ];

// export const ROLE_FILTER_RULES = [
//   { key: "status", getValue: (r) => r.status },
// ];

// export const FIELD_FILTER_RULES = [
//   { key: "status",    getValue: (r) => r.status },
//   { key: "fieldName", getValue: (r) => r.fieldName },
// ];

// export const MIS_CODE_FILTER_RULES = [
//   { key: "status",   getValue: (r) => r.status },
//   { key: "clientId", getValue: (r) => r.clientId },
//   { key: "misCode",  getValue: (r) => r.misCode },
// ];

// export const TYPE_FILTER_RULES = [
//   { key: "status", getValue: (r) => r.status },
//   { key: "name",   getValue: (r) => r.name },
// ];

// export const TARGET_FILTER_RULES = [
//   { key: "status",     getValue: (r) => r.status },
//   { key: "clientName", getValue: (r) => r.clientName },
//   { key: "campaign",   getValue: (r) => r.campaign },
//   { key: "product",    getValue: (r) => r.product },
//   { key: "type",       getValue: (r) => r.type },
// ];

// export const ALLOCATION_FILTER_RULES = [
//   // 1. Type
//   { key: "type", getValue: (r) => r.type },

//   // 2. Allocation Closing Date
//   {
//     key: "allocationClosingDate",
//     getValue: (r) => formatDateLabel(r.allocationClosingDate),
//   },

//   // 3. Allocation Created Date
//   {
//     key: "allocationCreatedDate",
//     getValue: (r) => formatDateLabel(r.createdAt),
//   },

//   // 4. Product
//   { key: "product", getValue: (r) => r.product },

//   // 5. Assistant Manager
//   { key: "assistantManagerId", getValue: (r) => r.assistantManagerId },

//   // 6. Created At
//   {
//     key: "createdAt",
//     getValue: (r) => formatDateLabel(r.createdAt),
//   },

//   // 7. Status
//   { key: "status", getValue: (r) => r.status },

//   // 8. Month
//   { key: "monthYear", getValue: (r) => r.monthYear },

//   // 9. Client
//   { key: "clientName", getValue: (r) => r.clientName },

//   // 10. Total Paid Amount
//   {
//     key: "totalPaidAmount",
//     getValue: (r) => String(r.totalPaidAmount ?? ""),
//   },
// ];

// export const CUSTOMER_FILTER_RULES = [
//   { key: "clientName", getValue: (r) => r.clientName },
//   { key: "product",    getValue: (r) => r.product },
//   { key: "campaignId", getValue: (r) => r.campaignId },
//   { key: "branch",     getValue: (r) => r.branch },
//   { key: "district",   getValue: (r) => r.district },
//   { key: "collType",   getValue: (r) => r.collType },
// ];

// export const DCR_FILTER_RULES = [
//   { key: "campaignId",    getValue: (r) => r.campaignId },
//   { key: "contactStatus", getValue: (r) => r.contactStatus },
//   { key: "paidType",      getValue: (r) => r.paidType },
// ];


import CLIENT_ENDPOINTS from "@/api/endpoints/clientEndpoints";
import {
  STATUS_FILTER_FIELD,
  buildUniqueSelectOptions,
} from "@/utils/listFilterHelpers";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const selectFromList = (key, label, rows, getValue, getLabel) => ({
  key,
  label,
  type: "select",
  multiple: true,
  options: buildUniqueSelectOptions(rows, getValue, getLabel),
});

const selectFromApi = (key, label, filterEndpoint) => ({
  key,
  label,
  type: "select",
  multiple: true,
  filterEndpoint,
});

const textInput = (key, label, placeholder = "") => ({
  key,
  label,
  type: "text",
  placeholder,
});

const formatDateLabel = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d)
    ? String(iso)
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

/** Drop list-derived selects that have no options yet. */
export const pruneEmptyFilterFields = (config = []) =>
  config.filter(
    (field) =>
      field.filterEndpoint ||
      field.type !== "select" ||
      (Array.isArray(field.options) && field.options.length > 0),
  );

// ─── Masters ───────────────────────────────────────────────────────────────────

/** Masters — Clients */
export const buildClientsFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    STATUS_FILTER_FIELD,
    selectFromList("id", "Client ID", rows, (r) => r.id),
    selectFromList("bankName", "Name", rows, (r) => r.bankName),
  ]);

/** Masters — Users */
export const buildUsersFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    STATUS_FILTER_FIELD,
    selectFromList("designation", "Designation", rows, (r) => r.designation),
    selectFromList("branch", "Branch", rows, (r) => r.branch),
  ]);

/** Masters — Products */
export const buildProductsFilterConfig = () => [STATUS_FILTER_FIELD];

/** Masters — Client campaigns tab */
export const buildCampaignsFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    STATUS_FILTER_FIELD,
    selectFromList("campaignId", "Campaign ID", rows, (r) => r.campaignId),
    selectFromList("branch", "Branch", rows, (r) => r.branch),
    selectFromList("product", "Product", rows, (r) => r.product),
    selectFromList("type", "Type", rows, (r) => r.type),
  ]);

/** Masters — Roles */
export const buildRolesFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    STATUS_FILTER_FIELD,
    selectFromList("id", "Role ID", rows, (r) => r.id),
  ]);

/** Masters — Fields */
export const buildFieldsFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    STATUS_FILTER_FIELD,
    selectFromList("fieldName", "Field Name", rows, (r) => r.fieldName),
  ]);

/** Masters — MIS Code */
export const buildMisCodeFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    STATUS_FILTER_FIELD,
    selectFromApi("clientId", "Client", CLIENT_ENDPOINTS.LIST),
    selectFromList("misCode", "MIS Code", rows, (r) => r.misCode),
  ]);

/** Masters — Type */
export const buildTypesFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    STATUS_FILTER_FIELD,
    selectFromList("name", "Type Name", rows, (r) => r.name),
  ]);

// ─── Customer Mgt — Goal Sheet / Targets ──────────────────────────────────────

export const buildTargetsFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    STATUS_FILTER_FIELD,
    selectFromList("campaign", "Campaign ID", rows, (r) => r.campaign),
    selectFromList("createdAt", "Allocated Date", rows, (r) => r.createdAt),
    selectFromList("updatedAt", "Closing Date", rows, (r) => r.updatedAt),
    selectFromList("type", "Allocation Type", rows, (r) => r.type),
    selectFromList("assistantManagerId", "AM", rows, (r) => r.assistantManagerId),
    selectFromList("bossMdId", "Manager", rows, (r) => r.bossMdId),
    selectFromList("tlId", "TL", rows, (r) => r.tlId),
    selectFromList("clientName", "Client", rows, (r) => r.clientName),
    selectFromList("type", "Type", rows, (r) => r.type),
    selectFromList("branch", "Branch", rows, (r) => r.branch),
    selectFromList("product", "Product", rows, (r) => r.product),
    selectFromList("workingDays", "Working Days", rows, (r) => r.workingDays),
    selectFromList("targetResolutionPercent", "Resolution Target", rows, (r) => r.targetResolutionPercent),
    selectFromList("rbNrTargetPercent", "NRRB Target", rows, (r) => r.rbNrTargetPercent),
    selectFromList("collectionTarget", "CE Target", rows, (r) => r.collectionTarget),
    selectFromList("targetAmount", "Money Collection Target", rows, (r) => r.targetAmount),
  ]);

// ─── Customer Mgt — Allocation (exactly 10 filters) ───────────────────────────

export const buildAllocationsFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    // 1. Type
    selectFromList("type", "Type", rows, (r) => r.type),

    // 2. Allocation Closing Date
    selectFromList(
      "allocationClosingDate",
      "Allocation Closing Date",
      rows,
      (r) => formatDateLabel(r.allocationClosingDate),
    ),

    // 3. Allocation Created Date
    selectFromList(
      "allocationCreatedDate",
      "Allocation Created Date",
      rows,
      (r) => formatDateLabel(r.createdAt),
    ),

    // 4. Product
    selectFromList("product", "Product", rows, (r) => r.product),

    // 5. Assistant Manager
    selectFromList(
      "assistantManagerId",
      "Assistant Manager",
      rows,
      (r) => r.assistantManagerId,
    ),

    // 6. Created At
    selectFromList(
      "createdAt",
      "Created At",
      rows,
      (r) => formatDateLabel(r.createdAt),
    ),

    // 7. Status — fixed: Active / Completed / Cancelled
    {
      key: "status",
      label: "Status",
      type: "select",
      multiple: true,
      options: [
        { label: "Active",    value: "Active" },
        { label: "Completed", value: "Completed" },
        { label: "Cancelled", value: "Cancelled" },
      ],
    },

    // 8. Month
    selectFromList("monthYear", "Month", rows, (r) => r.monthYear),

    // 9. Client
    selectFromList("clientName", "Client", rows, (r) => r.clientName),

    // 10. Total Paid Amount — exact text input
    textInput("totalPaidAmount", "Total Paid Amount", "Enter exact amount…"),
  ]);

// ─── Customer Mgt — Customers ─────────────────────────────────────────────────

export const buildCustomersFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    selectFromList("teamLead",           "Assigned User",                rows, (r) => r.teamLead),
    selectFromList("fieldAgent",         "Field Agent",                  rows, (r) => r.teamLead),
    selectFromList("createdAtLabel",     "Created At",                   rows, (r) => formatDateLabel(r.createdAt)),
    selectFromList("latestDisposition",  "Latest Disposition",           rows, (r) => r.latestDisposition),
    selectFromList("campaignId",         "Allocation",                   rows, (r) => r.campaignId),
    selectFromList("allocationStatus",   "Allocation Status",            rows, (r) => r.allocationStatus),
    selectFromList("allottedDate",       "Allotted Date",                rows, (r) => formatDateLabel(r.allottedDate)),
    selectFromList("manager",            "Manager",                      rows, (r) => r.manager),
    selectFromList("dpdSeg",             "BKT Disposition Original",     rows, (r) => r.dpdSeg),
    selectFromList("collType",           "Call Type",                    rows, (r) => r.collType),
    selectFromList("district",           "City",                         rows, (r) => r.district),
    selectFromList("contactStatus",      "Contact Status",               rows, (r) => r.contactStatus),
    selectFromList("cycle",              "Cycle",                        rows, (r) => r.cycle),
    selectFromList("clientName",         "Client",                       rows, (r) => r.clientName),
    selectFromList("dpdSeg",             "DPD Seg",                      rows, (r) => r.dpdSeg),
    selectFromList("paidDate",           "Paid Date",                    rows, (r) => formatDateLabel(r.paidDate)),
    selectFromList("ptpDate",            "PTP Date",                     rows, (r) => formatDateLabel(r.ptpDate)),
    selectFromList("vintage",            "Old / New",                    rows, (r) => r.vintage),
    selectFromList("retainFresh",        "Retain / Non Retain",          rows, (r) => r.retainFresh),
    selectFromList("recoveryDisposition","Recovery Disposition Original", rows, (r) => r.recoveryDisposition),
    selectFromList("state",              "State",                        rows, (r) => r.state),
  ]);

// ─── DCRs ──────────────────────────────────────────────────────────────────────
// Only fields confirmed present in the API response are included.
// ❌ Skipped: Client (no clientId in response), DCR Created Date (no createdAt in response)

export const buildDcrsFilterConfig = (rows = []) =>
  pruneEmptyFilterFields([
    // 1. TC/FOS — telecallerId (raw string e.g. "EMP_026")
    selectFromList("telecallerId", "TC/FOS", rows, (r) => r.telecallerId),

    // 2. Manager — managerId.name resolved in mapDcrRow
    selectFromList("manager", "Manager", rows, (r) => r.manager),

    // 3. Allocation — campaignId string resolved in mapDcrRow
    selectFromList("campaignId", "Allocation", rows, (r) => r.campaignId),

    // 4. User — assistantManagerId.name resolved in mapDcrRow
    selectFromList("assistantManager", "User", rows, (r) => r.assistantManager),

    // 5. Month — campaignId.monthYear resolved in mapDcrRow
    selectFromList("month", "Month", rows, (r) => r.month),

    // 6. Type — paymentType from API (e.g. "SLA")
    selectFromList("paymentType", "Type", rows, (r) => r.paymentType),

    // 7. Paid Date — paidDate from API (e.g. "2026-05-20")
    selectFromList("paidDate", "Paid Date", rows, (r) => formatDateLabel(r.paidDate)),

    // 8. Paid Type — paidType from API (e.g. "UPI")
    selectFromList("paidType", "Paid Type", rows, (r) => r.paidType),

    // 9. TL Name — teamLeaderId.name resolved in mapDcrRow
    selectFromList("teamLeader", "TL Name", rows, (r) => r.teamLeader),
  ]);

// ─── Filter Rules ──────────────────────────────────────────────────────────────

export const CLIENT_FILTER_RULES = [
  { key: "status", getValue: (r) => r.status },
  { key: "id", getValue: (r) => r.id },
  { key: "bankName", getValue: (r) => r.bankName },
];

export const USER_FILTER_RULES = [
  { key: "status",      getValue: (r) => r.status },
  { key: "designation", getValue: (r) => r.designation },
  { key: "branch",      getValue: (r) => r.branch },
];

export const PRODUCT_FILTER_RULES = [
  { key: "status", getValue: (r) => r.status },
];

export const CAMPAIGN_FILTER_RULES = [
  { key: "status", getValue: (r) => r.status },
  { key: "campaignId", getValue: (r) => r.campaignId },
  { key: "branch", getValue: (r) => r.branch },
  { key: "product", getValue: (r) => r.product },
  { key: "type", getValue: (r) => r.type },
];

export const ROLE_FILTER_RULES = [
  { key: "status", getValue: (r) => r.status },
  { key: "id", getValue: (r) => r.id },
];

export const FIELD_FILTER_RULES = [
  { key: "status",    getValue: (r) => r.status },
  { key: "fieldName", getValue: (r) => r.fieldName },
];

export const MIS_CODE_FILTER_RULES = [
  { key: "status",   getValue: (r) => r.status },
  { key: "clientId", getValue: (r) => r.clientId },
  { key: "misCode",  getValue: (r) => r.misCode },
];

export const TYPE_FILTER_RULES = [
  { key: "status", getValue: (r) => r.status },
  { key: "name",   getValue: (r) => r.name },
];

export const TARGET_FILTER_RULES = [
  { key: "status",     getValue: (r) => r.status },
  { key: "clientName", getValue: (r) => r.clientName },
  { key: "campaign",   getValue: (r) => r.campaign },
  { key: "product",    getValue: (r) => r.product },
  { key: "type",       getValue: (r) => r.type },
];

export const ALLOCATION_FILTER_RULES = [
  { key: "type",                  getValue: (r) => r.type },
  { key: "allocationClosingDate", getValue: (r) => formatDateLabel(r.allocationClosingDate) },
  { key: "allocationCreatedDate", getValue: (r) => formatDateLabel(r.createdAt) },
  { key: "product",               getValue: (r) => r.product },
  { key: "assistantManagerId",    getValue: (r) => r.assistantManagerId },
  { key: "createdAt",             getValue: (r) => formatDateLabel(r.createdAt) },
  { key: "status",                getValue: (r) => r.status },
  { key: "monthYear",             getValue: (r) => r.monthYear },
  { key: "clientName",            getValue: (r) => r.clientName },
  { key: "totalPaidAmount",       getValue: (r) => String(r.totalPaidAmount ?? "") },
];

export const CUSTOMER_FILTER_RULES = [
  { key: "teamLead",             getValue: (r) => r.teamLead },
  { key: "fieldAgent",           getValue: (r) => r.teamLead },
  { key: "createdAtLabel",       getValue: (r) => formatDateLabel(r.createdAt) },
  { key: "latestDisposition",    getValue: (r) => r.latestDisposition },
  { key: "campaignId",           getValue: (r) => r.campaignId },
  { key: "allocationStatus",     getValue: (r) => r.allocationStatus },
  { key: "allottedDate",         getValue: (r) => formatDateLabel(r.allottedDate) },
  { key: "manager",              getValue: (r) => r.manager },
  { key: "dpdSeg",               getValue: (r) => r.dpdSeg },
  { key: "collType",             getValue: (r) => r.collType },
  { key: "district",             getValue: (r) => r.district },
  { key: "contactStatus",        getValue: (r) => r.contactStatus },
  { key: "cycle",                getValue: (r) => r.cycle },
  { key: "clientName",           getValue: (r) => r.clientName },
  { key: "paidDate",             getValue: (r) => formatDateLabel(r.paidDate) },
  { key: "ptpDate",              getValue: (r) => formatDateLabel(r.ptpDate) },
  { key: "vintage",              getValue: (r) => r.vintage },
  { key: "retainFresh",          getValue: (r) => r.retainFresh },
  { key: "recoveryDisposition",  getValue: (r) => r.recoveryDisposition },
  { key: "state",                getValue: (r) => r.state },
];

export const DCR_FILTER_RULES = [
  // 1. TC/FOS
  { key: "telecallerId",   getValue: (r) => r.telecallerId },
  // 2. Manager
  { key: "manager",        getValue: (r) => r.manager },
  // 3. Allocation
  { key: "campaignId",     getValue: (r) => r.campaignId },
  // 4. User
  { key: "assistantManager", getValue: (r) => r.assistantManager },
  // 5. Month
  { key: "month",          getValue: (r) => r.month },
  // 6. Type
  { key: "paymentType",    getValue: (r) => r.paymentType },
  // 7. Paid Date
  { key: "paidDate",       getValue: (r) => formatDateLabel(r.paidDate) },
  // 8. Paid Type
  { key: "paidType",       getValue: (r) => r.paidType },
  // 9. TL Name
  { key: "teamLeader",     getValue: (r) => r.teamLeader },
];