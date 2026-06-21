import { formatDisplayDate } from "@/utils/formatters";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const mapFormTypeToApi = (type) => {
  if (type === "REC") return "REC";
  if (type === "BKT") return "BKT";
  return type;
};

export const mapApiTypeToForm = (type) => {
  const t = String(type ?? "").toLowerCase();
  if (t === "rec") return "REC";
  return "BKT";
};

export const resolveRefId = (raw) => {
  if (raw == null || raw === "") return "";
  if (typeof raw === "object") {
    return String(raw._id ?? raw.id ?? "");
  }
  return String(raw);
};

/** Client/bank id on a campaign row (list or detail). */
export const resolveCampaignClientId = (campaign) =>
  resolveRefId(
    campaign?.client ??
      campaign?.client_id ??
      campaign?.clientId ??
      campaign?.bank ??
      campaign?.bank_id ??
      campaign?.bankId,
  );

/** Business campaign id for portfolio select value and API campaignId field. */
export const resolveCampaignOptionValue = (campaign) => {
  const businessId = String(
    campaign?.campaignId ??
      campaign?.campaign_id ??
      campaign?.code ??
      campaign?.campaign_code ??
      "",
  ).trim();
  if (businessId) return businessId;
  return String(campaign?._id ?? campaign?.id ?? "");
};

export const campaignMatchesPortfolioId = (campaign, portfolioId) => {
  if (!portfolioId || !campaign) return false;
  const pid = String(portfolioId);
  const mongoId = String(campaign?._id ?? campaign?.id ?? "");
  const businessId = resolveCampaignOptionValue(campaign);
  return pid === mongoId || (businessId !== "" && pid === businessId);
};

/** campaignId from campaigns API row (never mongo _id). */
export const readBusinessCampaignId = (campaign) =>
  String(
    campaign?.campaignId ??
      campaign?.campaign_id ??
      campaign?.code ??
      campaign?.campaign_code ??
      "",
  ).trim();

/** Mongo _id for portfolio select value and targets API campaignId field. */
export const readCampaignMongoId = (campaign) =>
  resolveRefId(campaign?._id ?? campaign?.id ?? campaign);

/** Resolves portfolio value to campaign mongo _id for the targets API payload. */
export const resolveCampaignMongoId = (portfolioId, campaigns = []) => {
  const pid = String(portfolioId ?? "").trim();
  if (!pid) return "";

  const match = campaigns.find((row) => campaignMatchesPortfolioId(row, pid));
  if (match) return readCampaignMongoId(match);

  return pid;
};

const resolvePortfolioIdFromTarget = (raw) => {
  const populated = raw?.portfolio ?? raw?.campaign;
  if (populated != null && typeof populated === "object") {
    return readCampaignMongoId(populated);
  }

  const ref =
    raw?.portfolio_id ??
    raw?.portfolioId ??
    raw?.campaign_id ??
    raw?.campaignId;
  if (ref != null && typeof ref === "object") {
    return readCampaignMongoId(ref);
  }
  return String(ref ?? "");
};

export const formatBranchFromApi = (raw) => {
  if (raw == null || raw === "") return "";
  if (typeof raw === "object") {
    return String(
      raw.branch ?? raw.branch_name ?? raw.name ?? raw.code ?? raw._id ?? "",
    );
  }
  return String(raw);
};

export const formatMonthFromCampaign = (campaign) => {
  const monthYear = campaign?.monthYear ?? campaign?.month_year;
  if (monthYear) return String(monthYear).trim();

  const monthRaw = campaign?.month;
  const yearRaw = campaign?.year;
  if (
    monthRaw != null &&
    monthRaw !== "" &&
    yearRaw != null &&
    yearRaw !== ""
  ) {
    const m = Number.parseInt(String(monthRaw).trim(), 10);
    const y = String(yearRaw).trim();
    if (!Number.isNaN(m) && m >= 1 && m <= 12 && y) {
      return `${MONTH_SHORT[m - 1]} ${y}`;
    }
  }

  return "";
};

export const resolveBankIdFromName = (bankName, clients = []) => {
  const normalized = String(bankName ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return "";
  const match = clients.find((client) => {
    const names = [
      client.bankName,
      client.bank_name,
      client.client_name,
      client.clientName,
    ].map((name) =>
      String(name ?? "")
        .trim()
        .toLowerCase(),
    );
    return names.includes(normalized);
  });
  return match ? String(match._id ?? match.id ?? "") : "";
};

const firstAssigneeId = (raw) => {
  const list =
    raw?.assignTo ?? raw?.assign_to ?? raw?.assignedTo ?? raw?.assigned_to;
  if (!Array.isArray(list) || list.length === 0) return "";
  return resolveRefId(list[0]);
};

export const DEFAULT_TARGET_FORM_VALUES = {
  entity: "",
  portfolioId: "",
  bankId: "",
  location: "",
  branchName: "",
  // employeeTcId: "",
  bossMdId: "",
  assistantManagerId: "",
  tlId: "",
  type: "BKT",
  productId: "",
  collectionTarget: "",
  resolutionPercentage: "",
  nrrbPercentage: "",
  fos: "",
  target01: "",
  target02: "",
  remarks: "",
};

export const mapTargetToFormValues = (raw) => ({
  entity: String(
    raw?.entity ?? raw?.targetName ?? raw?.target_name ?? raw?.name ?? "",
  ),
  portfolioId: resolvePortfolioIdFromTarget(raw),
  bankId: resolveRefId(
    raw?.bank ??
      raw?.bank_id ??
      raw?.bankId ??
      raw?.client ??
      raw?.client_id ??
      raw?.clientId,
  ),
  location: String(raw?.location ?? ""),
  branchName: formatBranchFromApi(
    raw?.branchName ?? raw?.branch_name ?? raw?.branch ?? raw?.branch_id,
  ),
  // employeeTcId: resolveRefId(
  //   raw?.employeeId ??
  //     raw?.employee_id ??
  //     raw?.employeeTc ??
  //     raw?.employee_tc ??
  //     raw?.employeeTcId ??
  //     firstAssigneeId(raw),
  // ),
  bossMdId: resolveRefId(
    raw?.bossId ??
      raw?.boss_id ??
      raw?.bossMd ??
      raw?.boss_md ??
      raw?.bossMdId ??
      raw?.manager ??
      raw?.managerId ??
      raw?.manager_id,
  ),
  assistantManagerId: resolveRefId(
    raw?.assistantManager ??
      raw?.assistant_manager ??
      raw?.assistantManagerId ??
      raw?.assistant_manager_id,
  ),
  tlId: resolveRefId(
    raw?.teamLeaderId ??
      raw?.team_leader_id ??
      raw?.tl ??
      raw?.tl_id ??
      raw?.tlId ??
      raw?.teamLeader ??
      raw?.team_leader ??
      raw?.team ??
      raw?.team_id ??
      raw?.teamId,
  ),
  type: mapApiTypeToForm(raw?.type ?? raw?.target_type),
  productId: resolveRefId(raw?.product ?? raw?.product_id ?? raw?.productId),
  collectionTarget: String(
    raw?.collectionTarget ??
      raw?.collection_target ??
      raw?.moneyCollectionTarget ??
      raw?.money_collection_target ??
      "",
  ),
  resolutionPercentage: String(
    raw?.resolution ??
      raw?.resolutionPercentage ??
      raw?.resolution_percentage ??
      raw?.targetResolutionPercentage ??
      raw?.target_resolution_percentage ??
      raw?.resolutionTarget ??
      raw?.resolution_target ??
      "",
  ),
  nrrbPercentage: String(
    raw?.nrrbTarget ??
      raw?.nrrb_target ??
      raw?.nrrbPercentage ??
      raw?.nrrb_percentage ??
      "",
  ),
  fos: String(
    raw?.fos ??
      raw?.cycle ??
      raw?.fosTarget ??
      raw?.fos_target ??
      raw?.cePercentage ??
      raw?.ce_percentage ??
      raw?.ceTarget ??
      raw?.ce_target ??
      "",
  ),
  target01: String(
    raw?.target01 ??
      raw?.target_01 ??
      raw?.targetAmount ??
      raw?.target_amount ??
      "",
  ),
  target02: String(raw?.achievedCollection ?? raw?.achieved_collection ?? ""),
  remarks: String(raw?.Remarks ?? raw?.remarks ?? ""),
});

export const buildTargetPayload = (
  data,
  { bankOptions = [], month = "", campaigns = [] } = {},
) => {
  const entity = String(data?.entity ?? "").trim();
  const bankName =
    bankOptions.find((option) => String(option.value) === String(data.bankId))
      ?.label ?? "";

  const optionalId = (value) =>
    value == null || value === "" ? "" : String(value);

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    entity,
    campaignId: optionalId(resolveCampaignMongoId(data.portfolioId, campaigns)),
    // employeeId: optionalId(data.employeeTcId), // REMOVED - not sending employeeId
    bossId: optionalId(data.bossMdId),
    assistantManagerId: optionalId(data.assistantManagerId),
    teamLeaderId: optionalId(data.tlId),
    location: String(data.location ?? ""),
    bankName: String(bankName),
    productId: optionalId(data.productId),
    month: String(month ?? ""),
    branch: String(data.branchName ?? ""),
    status: "active",
    type: mapFormTypeToApi(data.type),
    cycle: toNumber(data.fos),
    resolution: toNumber(data.resolutionPercentage),
    nrrbTarget: toNumber(data.nrrbPercentage),
    collectionTarget: toNumber(data.collectionTarget),
    targetAmount: toNumber(data.target01),
    Remarks: String(data.remarks ?? ""),
  };
};
/** Label for Portfolio dropdown (sourced from campaigns list). */
export const formatCampaignOptionLabel = (campaign) => {
  const id = readBusinessCampaignId(campaign);
  if (id) return id;

  const name = String(
    campaign?.campaignName ??
      campaign?.campaign_name ??
      campaign?.title ??
      campaign?.name ??
      campaign?.portfolioName ??
      campaign?.portfolio_name ??
      "",
  ).trim();
  if (name) return name;

  return String(campaign?._id ?? campaign?.id ?? "");
};

export const targetDisplayTitle = (raw) =>
  String(
    raw?.entity ??
      raw?.targetName ??
      raw?.target_name ??
      raw?.employeeName ??
      raw?.employee_name ??
      raw?.name ??
      "Target",
  ).trim() || "Target";

export const formatTargetCurrency = (value) => {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const readNumericField = (raw, keys) => {
  for (const key of keys) {
    const value = raw?.[key];
    if (value == null || value === "") continue;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

/** TGT1 — primary target amount from API (`targetAmount` / form `target01`). */
export const readTargetTgt1 = (raw) =>
  readNumericField(raw, [
    "targetAmount",
    "target_amount",
    "target01",
    "target_01",
  ]);

/** TGT2 — secondary target (collection target or legacy `target02`). */
export const readTargetTgt2 = (raw) =>
  readNumericField(raw, [
    "achievedCollection",
    "achieved_collection",
    "collectedAmount",
    "collected_amount",
    "collectionAmount",
    "collection_amount",
  ]);

const readEmployeeName = (raw) => {
  const emp =
    raw?.employeeId ?? raw?.employee_id ?? raw?.employeeTc ?? raw?.employee_tc;
  if (typeof emp === "object" && emp != null) {
    return String(emp.name ?? emp.full_name ?? emp.username ?? "").trim();
  }
  return String(raw?.employeeName ?? raw?.employee_name ?? raw?.name ?? "").trim();
};

const readEmployeeCode = (raw) => {
  const emp =
    raw?.employeeId ?? raw?.employee_id ?? raw?.employeeTc ?? raw?.employee_tc;
  if (typeof emp === "object" && emp != null) {
    return String(emp.employeeId ?? emp.employee_id ?? emp.code ?? "").trim();
  }
  return String(
    raw?.employeeCode ?? raw?.employee_code ?? raw?.employeeId ?? raw?.employee_id ?? "",
  ).trim();
};

const readStatusDate = (raw) => {
  const month =
    raw?.month ?? raw?.campaignId?.monthYear ?? raw?.campaign_id?.monthYear;
  if (month) return String(month).trim();
  return formatDisplayDate(
    raw?.createdAt ?? raw?.created_at ?? raw?.updatedAt ?? raw?.updated_at,
  );
};

/** One status-table row from a target or teamTargets entry. */
export const mapTargetStatusRow = (raw, index = 0) => {
  const tgt1 = readTargetTgt1(raw);
  const tgt2 = readTargetTgt2(raw);
  const paidCases = readNumericField(raw, ["paidCases", "paid_cases"]);
  return {
    id: String(raw?._id ?? raw?.id ?? `row_${index}`),
    date: readStatusDate(raw),
    teleCaller: readEmployeeName(raw) || "—",
    empCode: readEmployeeCode(raw) || "—",
    tgt1,
    tgt2,
    paidCases,
    tgt1Display: formatTargetCurrency(tgt1),
    tgt2Display: formatTargetCurrency(tgt2),
  };
};

/** Rows for Status tab: telecaller collections, `teamTargets`, then the goal sheet itself. */
export const mapTargetStatusRows = (target) => {
  if (!target) return [];

  const telecallerCollections =
    target.telecallerCollections ?? target.telecaller_collections;
  if (Array.isArray(telecallerCollections) && telecallerCollections.length > 0) {
    return telecallerCollections.map((item, index) =>
      mapTargetStatusRow(
        {
          ...item,
          month: item.month ?? target.month,
          createdAt: item.createdAt ?? target.createdAt,
          updatedAt: item.updatedAt ?? target.updatedAt,
        },
        index,
      ),
    );
  }

  const team = target.teamTargets ?? target.team_targets;
  if (Array.isArray(team) && team.length > 0) {
    return team.map((item, index) => mapTargetStatusRow(item, index));
  }

  return [mapTargetStatusRow(target, 0)];
};

export const sumTargetStatusField = (rows, field) =>
  (rows ?? []).reduce((sum, row) => sum + (Number(row?.[field]) || 0), 0);

export const targetDisplayMeta = (raw) => {
  const campaign =
    raw?.campaignId ?? raw?.campaign_id ?? raw?.campaign ?? raw?.portfolio;
  const month =
    raw?.month ??
    (typeof campaign === "object"
      ? (campaign?.monthYear ?? campaign?.month_year)
      : "");
  const bank = String(raw?.bankName ?? raw?.bank_name ?? "").trim();
  const product = String(
    raw?.productName ??
      raw?.product_name ??
      (typeof raw?.productId === "object"
        ? (raw.productId?.productName ??
          raw.productId?.product_name ??
          raw.productId?.name)
        : ""),
  ).trim();
  const type = String(raw?.type ?? raw?.target_type ?? "").trim();

  return { month, bank, product, type };
};

export const targetDisplayId = (raw) =>
  String(
    raw?.targetID ??
      raw?.target_id ??
      raw?.targetId ??
      raw?.targetCode ??
      raw?.target_code ??
      raw?.code ??
      raw?._id ??
      raw?.id ??
      "",
  ).trim();
