import { Controller, useForm } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Button/Button";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import SelectInput from "@/components/SelectInput/SelectInput";
import FilterDatePicker from "@/components/DatePicker/FilterDatePicker";
import { fetchClientsApi } from "@/features/clients/clientApi";
import { fetchProductsApi } from "@/features/products/productApi";
import { fetchUsersApi } from "@/features/users/userApi";
import {
  createCampaignApi,
  fetchCampaignByIdApi,
  fetchCampaignsApi,
  updateCampaignApi,
  pickCampaignFromResponse,
} from "@/features/campaigns/campaignApi";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import "./AllocationForm.scss";

// ─── Date helpers ────────────────────────────────────────────────────────────

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");

const formatDateInput = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getMonthStartDate = (month, year = currentYear) =>
  formatDateInput(new Date(year, Number(month) - 1, 1));

const getMonthEndDate = (month, year = currentYear) =>
  formatDateInput(new Date(year, Number(month), 0));

const currentMonthStartDate = getMonthStartDate(currentMonth);
const currentMonthEndDate = getMonthEndDate(currentMonth);

const getDateDiffDays = (fromDate, toDate) => {
  if (!fromDate || !toDate) return "";
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const diff = Math.floor((end - start) / 86400000) + 1;
  return diff > 0 ? String(diff) : "";
};

const getMonthYear = (month) => {
  const option = MONTH_OPTIONS.find((o) => o.value === month);
  const short = option?.label ? option.label.slice(0, 3) : "";
  return short ? `${short} ${currentYear}` : "";
};

// ─── Static options ──────────────────────────────────────────────────────────

const MONTH_OPTIONS = [
  {
    value: currentMonth,
    label: currentDate.toLocaleString("en-US", { month: "long", year: "numeric" }),
  },
];

const STATUS_OPTIONS = [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }];
const TYPE_OPTIONS = [{ value: "REC", label: "REC" }, { value: "BKT", label: "BKT" }];

// ─── Utility helpers ─────────────────────────────────────────────────────────

/** Extract a plain string ID from either an object reference or a raw string/number */
const getRefId = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") return String(ref._id ?? ref.id ?? "");
  return String(ref);
};

const toNumber = (value) =>
  value === "" || value == null ? 0 : Number(value) || 0;

// ─── Option mappers ──────────────────────────────────────────────────────────

const mapClientToOption = (client, index) => {
  const id = client?._id ?? client?.id ?? `client_${index}`;
  const label =
    client?.bankName ??
    client?.bank_name ??
    client?.clientName ??
    client?.client_name ??
    client?.name ??
    String(id);
  return { value: String(id), label: String(label) };
};

const mapProductToOption = (product, index) => {
  const id = product?._id ?? product?.id ?? `product_${index}`;
  const label =
    product?.productName ??
    product?.product_name ??
    product?.name ??
    product?.code ??
    String(id);
  return { value: String(id), label: String(label) };
};

const getUserLabel = (user, fallback = "") =>
  String(
    user?.name ??
    user?.fullName ??
    user?.full_name ??
    user?.username ??
    user?.email ??
    fallback,
  );

const mapUserToOption = (user, index) => {
  const id = user?._id ?? user?.id ?? `user_${index}`;
  return { value: String(id), label: getUserLabel(user, String(id)) };
};

// ─── Role detection ───────────────────────────────────────────────────────────

const getUserRoleName = (user) =>
  String(
    user?.roleId?.name ??
    user?.role_id?.name ??
    user?.role?.name ??
    user?.roleName ??
    user?.role_name ??
    user?.designation ??
    "",
  ).trim().toLowerCase();

const isTeamLeaderUser = (user) => {
  const role = getUserRoleName(user).replace(/[\s_-]+/g, "");
  return role === "tl" || role === "teamleader" || role.includes("teamleader");
};

const isAssistantManagerUser = (user) => {
  const role = getUserRoleName(user).replace(/[\s_-]+/g, "");
  return (
    role === "am" ||
    role === "assistantmanager" ||
    role === "asstmanager" ||
    role.includes("assistantmanager")
  );
};

const isManagerUser = (user) => {
  const role = getUserRoleName(user).replace(/[\s_-]+/g, "");
  return role === "m" || role === "manager" || role === "md";
};

// ─── Form value mapper (edit/view) ───────────────────────────────────────────

const mapAllocationToFormValues = (raw) => ({
  clientId: getRefId(raw?.clientId ?? raw?.client ?? raw?.client_id),
  month: currentMonth,
  callingType: raw?.callingType ?? raw?.calling_type ?? "",
  productId: getRefId(raw?.productId ?? raw?.product ?? raw?.product_id),
  alloType: raw?.allocationType ?? raw?.allocation_type ?? "",
  allocatedDate: currentMonthStartDate,
  allocationClosingDate: currentMonthEndDate,
  workingDays: getDateDiffDays(currentMonthStartDate, currentMonthEndDate),
  lotNo: String(raw?.lotNo ?? raw?.lot_no ?? ""),
  type: String(raw?.type ?? "").toUpperCase(),
  bktOrRecType: String(raw?.bktOrRecType ?? raw?.bkt_or_rec_type ?? raw?.type ?? "").toUpperCase(),
  ceTarget: String(raw?.ceTarget ?? raw?.ce_target ?? ""),
  targetValue: String(raw?.moneyCollectionTarget ?? raw?.money_collection_target ?? ""),
  toGoValue: "",
  resTarget: String(raw?.resolutionTarget ?? raw?.resolution_target ?? ""),
  nrrbTarget: String(raw?.nrrbTarget ?? raw?.nrrb_target ?? ""),
  ceTargetBkt: String(raw?.ceTarget ?? raw?.ce_target ?? ""),
  resPercent: "",
  nrRbPercent: "",
  resToGoPercent: "",
  nrRbToGoPercent: "",
  noOfCustomers: "",
  totalPos: "",
  totalCollectedCe: "",
  cePercentage: "",
  totalNormPosValue: "",
  nrPercentageNr: "",
  totalRbPosValue: "",
  rbPercentage: "",
  totalRfPosValue: "",
  rfPercentage: "",
  totalStPosValue: "",
  stPercentage: "",
  totalPtpValue: "",
  rfPercentage2: "",
  totalStPosValue2: "",
  stPercentage2: "",
  description: raw?.description ?? "",
  contactPercent: "",
  rfPercentage3: "",
  nonContactPercent: "",
  stPercentage3: "",
  cwipPercent: "",
  rtpPercent: "",
  skipPercent: "",
  vtagPercent: "",
  totalTos1: "",
  totalSkipValue1: "",
  totalTos2: "",
  totalSkipValue2: "",
  totalContactValue: "",
  totalNonContactValue: "",
  totalCwipValue: "",
  totalSkipValue3: "",
  totalVtagValue: "",
  totalPaidAmount: "",
  ptpPosValue: "",
  projectionValue: "",
  blankContactStatus: "",
  blankDispo: "",
  status: raw?.status === "inactive" ? "Inactive" : "Active",
  assignedUserTl: getRefId(raw?.teamLeaderId ?? raw?.teamLeader ?? raw?.team_leader_id),
  allocationBy: getRefId(raw?.managerId ?? raw?.manager ?? raw?.manager_id),
  manager: getRefId(raw?.managerId ?? raw?.manager ?? raw?.manager_id),
  amName: getRefId(raw?.assistantManagerId ?? raw?.assistantManager ?? raw?.assistant_manager_id),
  sendApprovalForUserChange: Boolean(raw?.approvalRequired ?? raw?.approval_required),
  userChangeRequestApproval: raw?.approvalStatus ?? raw?.approval_status ?? "",
});



const buildAllocationPayload = (data) => ({
  clientId: data.clientId,
  productId: data.productId,
  type: data.type,
  allocationType: data.alloType || undefined,
  monthYear: getMonthYear(data.month),
  allocatedDate: data.allocatedDate || undefined,
  allocationClosingDate: data.allocationClosingDate || undefined,
  workingDays: toNumber(data.workingDays),
  lotNo: data.lotNo || undefined,
  callingType: data.callingType || undefined,
  resolutionTarget: toNumber(data.resTarget),
  nrrbTarget: toNumber(data.nrrbTarget),
  ceTarget: toNumber(data.type === "BKT" ? data.ceTargetBkt : data.ceTarget),
  moneyCollectionTarget: toNumber(data.targetValue || data.projectionValue),
  status: String(data.status ?? "Active").toLowerCase(),
  teamLeaderId: data.assignedUserTl || undefined,
  managerId: data.allocationBy || data.manager || undefined,
  allocationBy: data.allocationBy || data.manager || undefined,
  assistantManagerId: data.amName || undefined,
  approvalRequired: Boolean(data.sendApprovalForUserChange),
  approvalStatus: data.userChangeRequestApproval || undefined,
  description: data.description || undefined,
});

// ─── UI primitives ───────────────────────────────────────────────────────────

const FieldItem = ({ label, required, error, suffix, children, className = "" }) => (
  <div className={`af-field ${className}`}>
    <label className="af-label">
      {label}
      {required && <span className="af-required"> *</span>}
    </label>
    <div className={`af-control${suffix ? " af-control--suffix" : ""}`}>
      {children}
      {suffix && <span className="af-suffix">{suffix}</span>}
    </div>
    <p className="af-error">{error?.message ?? ""}</p>
  </div>
);

const DisplayValue = ({ value }) => (
  <div className="af-display">{value || "..."}</div>
);

// ─────────────────────────────────────────────────────────────────────────────
// AllocationForm
// ─────────────────────────────────────────────────────────────────────────────

const AllocationForm = ({ mode = "create", onSubmit }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Dropdown option lists
  const [clientOptions, setClientOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [tlOptions, setTlOptions] = useState([]);
  const [assistantManagerOptions, setAssistantManagerOptions] = useState([]);
  const [managerOptions, setManagerOptions] = useState([]);

  // Raw data stores for dynamic filtering
  const [allUsers, setAllUsers] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  // ── NEW: store raw clients to read embedded TL field ──
  const [allClients, setAllClients] = useState([]);

  const isView = mode === "view";

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      clientId: "",
      month: currentMonth,
      callingType: "",
      productId: "",
      alloType: "",
      allocatedDate: currentMonthStartDate,
      allocationClosingDate: currentMonthEndDate,
      workingDays: getDateDiffDays(currentMonthStartDate, currentMonthEndDate),
      lotNo: "",
      type: "",
      bktOrRecType: "",
      ceTarget: "",
      targetValue: "",
      toGoValue: "",
      resTarget: "",
      nrrbTarget: "",
      ceTargetBkt: "",
      resPercent: "",
      nrRbPercent: "",
      resToGoPercent: "",
      nrRbToGoPercent: "",
      noOfCustomers: "",
      totalPos: "",
      totalCollectedCe: "",
      cePercentage: "",
      totalNormPosValue: "",
      nrPercentageNr: "",
      totalRbPosValue: "",
      rbPercentage: "",
      totalRfPosValue: "",
      rfPercentage: "",
      totalStPosValue: "",
      stPercentage: "",
      totalPtpValue: "",
      rfPercentage2: "",
      totalStPosValue2: "",
      stPercentage2: "",
      description: "",
      contactPercent: "",
      rfPercentage3: "",
      nonContactPercent: "",
      stPercentage3: "",
      cwipPercent: "",
      rtpPercent: "",
      skipPercent: "",
      vtagPercent: "",
      totalTos1: "",
      totalSkipValue1: "",
      totalTos2: "",
      totalSkipValue2: "",
      totalContactValue: "",
      totalNonContactValue: "",
      totalCwipValue: "",
      totalSkipValue3: "",
      totalVtagValue: "",
      totalPaidAmount: "",
      ptpPosValue: "",
      projectionValue: "",
      blankContactStatus: "",
      blankDispo: "",
      status: "Active",
      assignedUserTl: "",
      allocationBy: "",
      manager: "",
      amName: "",
      sendApprovalForUserChange: false,
      userChangeRequestApproval: "",
    },
  });

  const watchedType = watch("type");
  const watchedMonth = watch("month");
  const watchedAllocatedDate = watch("allocatedDate");
  const watchedClosingDate = watch("allocationClosingDate");
  const watchedClientId = watch("clientId");
  const watchedTl = watch("assignedUserTl");

  // ─── Helper: populate Manager and AM dropdowns based on selected TL ───────
  const populateManagerAndAMFromTL = (tlId, campaigns, users) => {
    // Retrieve TL user profile from users list
    const tlUser = users.find((u) => String(u._id) === String(tlId));
    const profileManagerId = tlUser ? getRefId(tlUser.managerId) : "";
    const profileAmId = tlUser ? getRefId(tlUser.assistantManagerId) : "";

    const tlCampaigns = campaigns.filter(
      (c) => getRefId(c.teamLeaderId) === String(tlId)
    );

    // Merge campaign history manager/AM IDs with TL's profile manager/AM IDs
    const managerIds = new Set(
      tlCampaigns.map((c) => getRefId(c.managerId)).filter(Boolean)
    );
    if (profileManagerId) {
      managerIds.add(profileManagerId);
    }

    const amIds = new Set(
      tlCampaigns.map((c) => getRefId(c.assistantManagerId)).filter(Boolean)
    );
    if (profileAmId) {
      amIds.add(profileAmId);
    }

    const managers = users.filter((u) => managerIds.has(String(u._id ?? u.id)));
    const ams = users.filter((u) => amIds.has(String(u._id ?? u.id)));

    setManagerOptions(
      managers.length > 0
        ? managers.map(mapUserToOption)
        : users.filter(isManagerUser).map(mapUserToOption)
    );
    setAssistantManagerOptions(
      ams.length > 0
        ? ams.map(mapUserToOption)
        : users.filter(isAssistantManagerUser).map(mapUserToOption)
    );
  };

  // ── Load all reference data, then overlay existing record (edit/view) ──────
  useEffect(() => {
    const loadFormData = async () => {
      try {
        setFetchingData(true);

        const [clientsResult, productsResult, usersResult, campaignsResult] = await Promise.allSettled([
          fetchClientsApi(),
          fetchProductsApi(),
          fetchUsersApi(),
          fetchCampaignsApi(),
        ]);
        if (clientsResult.status === "rejected") throw clientsResult.reason;
        if (productsResult.status === "rejected") throw productsResult.reason;
        if (campaignsResult.status === "rejected") throw campaignsResult.reason;

        const clientsData = clientsResult.value;
        const productsData = productsResult.value;
        const usersData = usersResult.status === "fulfilled" ? usersResult.value : {};
        const campaignsData = campaignsResult.value;

        // ── Clients ──
        const { rows: clients } = extractListPayload(clientsData ?? {});
        setClientOptions(clients.map(mapClientToOption));
        setAllClients(clients); // ← store raw clients for TL lookup

        // ── Products ──
        const { rows: products } = extractListPayload(productsData ?? {});
        setProductOptions(products.map(mapProductToOption));

        // ── Store all users and campaigns for dynamic filtering ──
        const { rows: users } = extractListPayload(usersData ?? {});
        setAllUsers(users);

        const campaignList = campaignsData?.data ?? campaignsData?.rows ?? [];
        setAllCampaigns(campaignList);

        // ── Default: show all TLs ──
        setTlOptions(users.filter(isTeamLeaderUser).map(mapUserToOption));

        // ── Populate form for edit / view ──
        if ((mode === "edit" || mode === "view") && id) {
          const response = await fetchCampaignByIdApi(id);

          if (isApiFailure(response)) {
            toast.error(response?.message || "Failed to load allocation");
            navigate("/customer-mgt/allocation");
            return;
          }

          const allocation = pickCampaignFromResponse(response);
          if (allocation) {
            reset(mapAllocationToFormValues(allocation));

            const tlId = getRefId(allocation?.teamLeaderId);
            if (tlId) {
              populateManagerAndAMFromTL(tlId, campaignList, users);
            }
          }
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load form data",
        );
        if (mode === "edit" || mode === "view") {
          navigate("/customer-mgt/allocation");
        }
      } finally {
        setFetchingData(false);
      }
    };

    loadFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id]);

  // ── Watch clientId → auto-set TL from client's embedded TL field ─────────
  useEffect(() => {
    if (!watchedClientId || !allClients.length) return;

    // Find the selected client object
    const selectedClient = allClients.find(
      (c) => String(c._id ?? c.id) === String(watchedClientId)
    );

    if (!selectedClient) return;

    // The client API returns a TL object directly on the client record
    const clientTL = selectedClient?.TL ?? selectedClient?.tl ?? selectedClient?.teamLeader ?? null;
    const tlId = getRefId(clientTL);

    if (tlId) {
      // Build a single-option list from the embedded TL object so the
      // SelectInput can display the name, then lock the field to that TL.
      const tlOption = {
        value: tlId,
        label: getUserLabel(clientTL, tlId),
      };
      setTlOptions([tlOption]);
      setValue("assignedUserTl", tlId, { shouldValidate: true });

      // Populate manager / AM from TL's profile (with campaigns fallback)
      if (allUsers.length) {
        populateManagerAndAMFromTL(tlId, allCampaigns, allUsers);

        // Fetch from TL user profile first
        const tlUser = allUsers.find(
          (u) => String(u._id ?? u.id) === String(tlId)
        );
        let managerId = tlUser ? getRefId(tlUser.managerId ?? tlUser.manager) : "";
        let amId = tlUser ? getRefId(tlUser.assistantManagerId ?? tlUser.assistantManager) : "";

        // Fallback to campaign history if not set in profile
        if ((!managerId || !amId) && allCampaigns.length) {
          const tlCampaigns = allCampaigns
            .filter((c) => getRefId(c.teamLeaderId) === String(tlId))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          if (tlCampaigns.length > 0) {
            const latest = tlCampaigns[0];
            if (!managerId) managerId = getRefId(latest.managerId);
            if (!amId) amId = getRefId(latest.assistantManagerId);
          }
        }

        if (managerId) setValue("manager", managerId, { shouldValidate: true });
        if (amId) setValue("amName", amId, { shouldValidate: true });
      }
    } else {
      // Client has no embedded TL — fall back to all TLs
      setTlOptions(allUsers.filter(isTeamLeaderUser).map(mapUserToOption));
      setValue("assignedUserTl", "");
      setValue("manager", "");
      setValue("amName", "");
      setManagerOptions([]);
      setAssistantManagerOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedClientId, allClients, allCampaigns, allUsers]);

  // ── Watch assignedUserTl → auto-fill Manager and AM ──────────────────────
  useEffect(() => {
    if (!watchedTl || !allUsers.length) return;

    populateManagerAndAMFromTL(watchedTl, allCampaigns, allUsers);

    // Fetch from TL user profile first
    const tlUser = allUsers.find(
      (u) => String(u._id ?? u.id) === String(watchedTl)
    );
    let managerId = tlUser ? getRefId(tlUser.managerId ?? tlUser.manager) : "";
    let amId = tlUser ? getRefId(tlUser.assistantManagerId ?? tlUser.assistantManager) : "";

    // Fallback to campaign history if not set in profile
    if ((!managerId || !amId) && allCampaigns.length) {
      const tlCampaigns = allCampaigns
        .filter((c) => getRefId(c.teamLeaderId) === String(watchedTl))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (tlCampaigns.length > 0) {
        const latest = tlCampaigns[0];
        if (!managerId) managerId = getRefId(latest.managerId);
        if (!amId) amId = getRefId(latest.assistantManagerId);
      }
    }

    if (managerId) setValue("manager", managerId, { shouldValidate: true });
    if (amId) setValue("amName", amId, { shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTl, allCampaigns, allUsers]);

  // ── Auto-fill date range when month changes (create only) ─────────────────
  useEffect(() => {
    if (!watchedMonth || mode !== "create") return;
    const startDate = getMonthStartDate(watchedMonth);
    const endDate = getMonthEndDate(watchedMonth);
    setValue("allocatedDate", startDate, { shouldValidate: true });
    setValue("allocationClosingDate", endDate, { shouldValidate: true });
    setValue("workingDays", getDateDiffDays(startDate, endDate), { shouldValidate: true });
  }, [watchedMonth, mode, setValue]);

  // ── Recalculate working days when either date changes ─────────────────────
  useEffect(() => {
    setValue(
      "workingDays",
      getDateDiffDays(watchedAllocatedDate, watchedClosingDate),
      { shouldValidate: true },
    );
  }, [watchedAllocatedDate, watchedClosingDate, setValue]);

  // ── Form submission ────────────────────────────────────────────────────────
  const submitAllocation = async (data, { saveAndNew = false } = {}) => {
    if (onSubmit) {
      onSubmit(data, saveAndNew);
      return;
    }

    if (mode === "edit" && !id) {
      toast.error("Allocation not found");
      return;
    }

    try {
      setLoading(true);
      const payload = buildAllocationPayload(data);
      const response =
        mode === "edit"
          ? await updateCampaignApi(id, payload)
          : await createCampaignApi(payload);

      if (isApiFailure(response)) {
        toast.error(
          response?.message ||
          response?.error ||
          (mode === "edit" ? "Failed to update allocation" : "Failed to create allocation"),
        );
        return;
      }

      toast.success(
        response?.message ||
        (mode === "edit" ? "Allocation updated successfully" : "Allocation created successfully"),
      );

      if (saveAndNew && mode !== "edit") {
        reset();
        return;
      }

      navigate("/customer-mgt/allocation");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (mode === "edit" ? "Failed to update allocation" : "Failed to create allocation"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (data) => submitAllocation(data);
  const handleBack = () => navigate("/customer-mgt/allocation");

  // ── Shared Controller shorthand ──────────────────────────────────────────
  const F = ({ name, label, required, suffix, className, rules, children }) => (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <FieldItem
          label={label}
          required={required}
          error={errors[name]}
          suffix={suffix}
          className={className}
        >
          {children(field)}
        </FieldItem>
      )}
    />
  );

  // ── Validation helpers ───────────────────────────────────────────────────
  const req = (label) => ({ required: `${label} is required` });
  const reqNum = (label, min = 0, max) => ({
    required: `${label} is required`,
    min: { value: min, message: `${label} must be at least ${min}` },
    ...(max !== undefined && { max: { value: max, message: `${label} cannot exceed ${max}` } }),
    validate: (v) => v === "" || !isNaN(Number(v)) || `${label} must be a number`,
  });
  const pctText = {
    required: "CE Target% is required",
    pattern: { value: /^\d{1,3}(\.\d{1,2})?%?$/, message: "Enter a valid % e.g. 85 or 85.5" },
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="allocation-form-container">

      {/* ── Page header ── */}
      <div className="af-page-header">
        <div className="af-page-title">
          <BackButton onClick={handleBack} />
          <h4>
            {mode === "edit"
              ? "Edit Allocation"
              : mode === "view"
                ? "View Allocation"
                : "Create Allocation"}
          </h4>
        </div>
        <div className="af-page-actions">
          <Button variant="custom" size="lg" onClick={handleBack}>Cancel</Button>
          {!isView && (
            <Button
              variant="primary"
              size="lg"
              type="submit"
              form="allocation-form"
              disabled={loading || fetchingData}
            >
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Save"}
            </Button>
          )}
        </div>
      </div>

      <form
        id="allocation-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="af-form"
        noValidate
      >
        <div className="af-layout">

          {/* ══════════════════════════════════════════
              LEFT PANEL — Overview
          ══════════════════════════════════════════ */}
          <div className="af-card">
            <div className="af-card-header">Overview</div>
            <div className="af-card-body">

              {/* Row: Client * | Month * */}
              <div className="af-row af-row--2">
                <F name="clientId" label="Client" required rules={req("Client")}>
                  {(field) => (
                    <SelectInput
                      {...field}
                      options={clientOptions}
                      placeholder={fetchingData ? "Loading clients..." : "Select Client"}
                      disabled={isView || fetchingData}
                    />
                  )}
                </F>
                <F name="month" label="Month" required rules={req("Month")}>
                  {(field) => (
                    <SelectInput
                      {...field}
                      options={MONTH_OPTIONS}
                      placeholder="Select Month"
                      disabled={true}
                    />
                  )}
                </F>
              </div>

              {/* Row: Calling Type * | Product * | Allo Type */}
              <div className="af-row af-row--3">
                <F name="callingType" label="Calling Type" required rules={req("Calling Type")}>
                  {(field) => (
                    <input
                      {...field}
                      type="text"
                      className="af-input"
                      placeholder="Enter calling type"
                      disabled={isView}
                    />
                  )}
                </F>
                <F name="productId" label="Product" required rules={req("Product")}>
                  {(field) => (
                    <SelectInput
                      {...field}
                      options={productOptions}
                      placeholder={fetchingData ? "Loading products..." : "Select Product"}
                      disabled={isView || fetchingData}
                    />
                  )}
                </F>
                <F name="alloType" label="Allo Type">
                  {(field) => (
                    <input
                      {...field}
                      type="text"
                      className="af-input"
                      placeholder="Enter Allo Type"
                      disabled={isView}
                    />
                  )}
                </F>
              </div>

              {/* Row: Allocation Date * | Closing Date * | Working Days */}
              <div className="af-row af-row--3">
                <F name="allocatedDate" label="Allocation Date" required rules={req("Allocation Date")}>
                  {(field) => (
                    <FilterDatePicker
                      {...field}
                      minDate={currentMonthStartDate}
                      maxDate={currentMonthEndDate}
                      disabled={isView}
                    />
                  )}
                </F>
                <F name="allocationClosingDate" label="Allocation Closing Date" required rules={req("Allocation Closing Date")}>
                  {(field) => (
                    <FilterDatePicker
                      {...field}
                      minDate={currentMonthStartDate}
                      maxDate={currentMonthEndDate}
                      disabled={isView}
                    />
                  )}
                </F>
                <F name="workingDays" label="No of Days Working">
                  {(field) => (
                    <input
                      {...field}
                      type="number"
                      className="af-input"
                      placeholder="..."
                      disabled
                    />
                  )}
                </F>
              </div>

              {/* Row: Lot No | Type * | BKT or REC Type * */}
              <div className="af-row af-row--3">
                <F name="lotNo" label="Lot No">
                  {(field) => (
                    <input
                      {...field}
                      type="text"
                      className="af-input"
                      placeholder="Lot No"
                      disabled={isView}
                    />
                  )}
                </F>
                <F name="type" label="Type" required rules={req("Type")}>
                  {(field) => (
                    <SelectInput
                      {...field}
                      options={TYPE_OPTIONS}
                      placeholder="Select type"
                      disabled={isView}
                    />
                  )}
                </F>
                <F name="bktOrRecType" label="BKT or REC Type" required rules={req("BKT or REC Type")}>
                  {(field) => (
                    <SelectInput
                      {...field}
                      options={TYPE_OPTIONS}
                      placeholder="Select type"
                      disabled={isView}
                    />
                  )}
                </F>
              </div>

              {/* REC-specific fields */}
              {watchedType === "REC" && (
                <div className="af-row af-row--3">
                  <F name="ceTarget" label="CE Target%" required rules={pctText}>
                    {(field) => (
                      <input
                        {...field}
                        type="text"
                        className="af-input"
                        placeholder="e.g. 85 or 85%"
                        disabled={isView}
                      />
                    )}
                  </F>
                  <FieldItem label="Target Value">
                    <Controller
                      name="targetValue"
                      control={control}
                      render={({ field }) => <DisplayValue value={field.value} />}
                    />
                  </FieldItem>
                  <FieldItem label="TO GO Value">
                    <Controller
                      name="toGoValue"
                      control={control}
                      render={({ field }) => <DisplayValue value={field.value} />}
                    />
                  </FieldItem>
                </div>
              )}

              {/* BKT-specific fields */}
              {watchedType === "BKT" && (
                <>
                  <div className="af-row af-row--3">
                    <F name="resTarget" label="RES Target %" required rules={reqNum("RES Target", 0, 100)}>
                      {(field) => (
                        <input
                          {...field}
                          type="number"
                          className="af-input"
                          placeholder="Enter"
                          disabled={isView}
                        />
                      )}
                    </F>
                    <F name="nrrbTarget" label="NRRB Target %" required rules={reqNum("NRRB Target", 0, 100)}>
                      {(field) => (
                        <input
                          {...field}
                          type="number"
                          className="af-input"
                          placeholder="Enter"
                          disabled={isView}
                        />
                      )}
                    </F>
                    <F name="ceTargetBkt" label="CE Target%">
                      {(field) => (
                        <input
                          {...field}
                          type="number"
                          className="af-input"
                          placeholder="Enter"
                          disabled={isView}
                        />
                      )}
                    </F>
                  </div>
                  <div className="af-row af-row--4">
                    {[
                      { name: "resPercent", label: "RES %" },
                      { name: "nrRbPercent", label: "NR RB %" },
                      { name: "resToGoPercent", label: "RES TO GO %" },
                      { name: "nrRbToGoPercent", label: "NR RB TO GO %" },
                    ].map(({ name, label }) => (
                      <FieldItem key={name} label={label}>
                        <Controller
                          name={name}
                          control={control}
                          render={({ field }) => <DisplayValue value={field.value} />}
                        />
                      </FieldItem>
                    ))}
                  </div>
                </>
              )}

              {/* Display-only stat rows */}
              {[
                [
                  { name: "noOfCustomers", label: "No of Customers" },
                  { name: "totalPos", label: "Total POS" },
                  { name: "totalCollectedCe", label: "Total Collected(CE)" },
                  { name: "cePercentage", label: "CE Percentage" },
                ],
                [
                  { name: "totalNormPosValue", label: "Total Norm POS Value" },
                  { name: "nrPercentageNr", label: "NR Percentage" },
                  { name: "totalRbPosValue", label: "Total RB POS Value" },
                  { name: "rbPercentage", label: "RB Percentage" },
                ],
                [
                  { name: "totalRfPosValue", label: "Total RF POS Value" },
                  { name: "rfPercentage", label: "RF Percentage" },
                  { name: "totalStPosValue", label: "Total ST POS Value" },
                  { name: "stPercentage", label: "ST Percentage" },
                ],
                [
                  { name: "totalPtpValue", label: "Total PTP Value" },
                  { name: "rfPercentage2", label: "RF Percentage" },
                  { name: "totalStPosValue2", label: "Total ST POS Value" },
                  { name: "stPercentage2", label: "ST Percentage" },
                ],
              ].map((row, ri) => (
                <div key={ri} className="af-row af-row--4">
                  {row.map(({ name, label }) => (
                    <FieldItem key={name} label={label}>
                      <Controller
                        name={name}
                        control={control}
                        render={({ field }) => <DisplayValue value={field.value} />}
                      />
                    </FieldItem>
                  ))}
                </div>
              ))}

              {/* Description */}
              <div className="af-row af-row--1">
                <FieldItem label="Description">
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        className="af-input af-textarea"
                        placeholder="Enter description"
                        rows={3}
                        disabled={isView}
                      />
                    )}
                  />
                </FieldItem>
              </div>

              {/* Contact / RF / NonContact / ST percent rows */}
              <div className="af-row af-row--4">
                {[
                  { name: "contactPercent", label: "Contact %" },
                  { name: "rfPercentage3", label: "RF Percentage" },
                  { name: "nonContactPercent", label: "Non Contact %" },
                  { name: "stPercentage3", label: "ST Percentage" },
                ].map(({ name, label }) => (
                  <FieldItem key={name} label={label}>
                    <Controller
                      name={name}
                      control={control}
                      render={({ field }) => <DisplayValue value={field.value} />}
                    />
                  </FieldItem>
                ))}
              </div>

              <div className="af-row af-row--4">
                {[
                  { name: "cwipPercent", label: "CWIP %" },
                  { name: "rtpPercent", label: "RTP %" },
                  { name: "skipPercent", label: "SKIP %" },
                  { name: "vtagPercent", label: "VTAG %" },
                ].map(({ name, label }) => (
                  <FieldItem key={name} label={label}>
                    <Controller
                      name={name}
                      control={control}
                      render={({ field }) => <DisplayValue value={field.value} />}
                    />
                  </FieldItem>
                ))}
              </div>

              <div className="af-row af-row--4">
                <FieldItem label="Total TOS">
                  <Controller
                    name="totalTos1"
                    control={control}
                    render={({ field }) => <DisplayValue value={field.value} />}
                  />
                </FieldItem>
                <FieldItem label="Total SKIP Value">
                  <Controller
                    name="totalSkipValue1"
                    control={control}
                    render={({ field }) => <DisplayValue value={field.value} />}
                  />
                </FieldItem>
                <F name="totalTos2" label="Total TOS" suffix="INR">
                  {(field) => (
                    <input
                      {...field}
                      type="number"
                      className="af-input"
                      placeholder="..."
                      disabled={isView}
                    />
                  )}
                </F>
                <F name="totalSkipValue2" label="Total SKIP Value" suffix="INR">
                  {(field) => (
                    <input
                      {...field}
                      type="number"
                      className="af-input"
                      placeholder="..."
                      disabled={isView}
                    />
                  )}
                </F>
              </div>

              <div className="af-row af-row--4">
                {[
                  { name: "totalContactValue", label: "Total Contact Value" },
                  { name: "totalNonContactValue", label: "Total Non Contact Value" },
                  { name: "totalCwipValue", label: "Total CWIP Value" },
                  { name: "totalSkipValue3", label: "Total SKIP Value" },
                ].map(({ name, label }) => (
                  <F key={name} name={name} label={label} suffix="INR">
                    {(field) => (
                      <input
                        {...field}
                        type="number"
                        className="af-input"
                        placeholder="..."
                        disabled={isView}
                      />
                    )}
                  </F>
                ))}
              </div>

              <div className="af-row af-row--4">
                {[
                  { name: "totalVtagValue", label: "Total VTAG Value" },
                  { name: "totalPaidAmount", label: "Total Paid Amount" },
                  { name: "ptpPosValue", label: "PTP POS Value" },
                  { name: "projectionValue", label: "Projection Value" },
                ].map(({ name, label }) => (
                  <F key={name} name={name} label={label} suffix="INR">
                    {(field) => (
                      <input
                        {...field}
                        type="number"
                        className="af-input"
                        placeholder="..."
                        disabled={isView}
                      />
                    )}
                  </F>
                ))}
              </div>

              <div className="af-row af-row--2">
                <F name="blankContactStatus" label="Blank Contact Status" suffix="INR">
                  {(field) => (
                    <input
                      {...field}
                      type="number"
                      className="af-input"
                      placeholder="..."
                      disabled={isView}
                    />
                  )}
                </F>
                <F name="blankDispo" label="Blank Dispo" suffix="INR">
                  {(field) => (
                    <input
                      {...field}
                      type="number"
                      className="af-input"
                      placeholder="..."
                      disabled={isView}
                    />
                  )}
                </F>
              </div>

            </div>
          </div>

          {/* ══════════════════════════════════════════
              RIGHT PANEL — Campaign Details
          ══════════════════════════════════════════ */}
          <div className="af-card af-card--right">
            <div className="af-card-header">Campaign Details</div>
            <div className="af-card-body af-card-body--right">

              {/* Status */}
              <F name="status" label="Status">
                {(field) => (
                  <SelectInput
                    {...field}
                    options={STATUS_OPTIONS}
                    placeholder="Select Status"
                    disabled={isView}
                  />
                )}
              </F>

              {/* Assigned User (TL) — auto-set from selected client's TL field */}
              <F name="assignedUserTl" label="Assigned User (TL)" required rules={req("Team Leader")}>
                {(field) => (
                  <SelectInput
                    {...field}
                    options={tlOptions}
                    placeholder={fetchingData ? "Loading TL..." : "Select TL"}
                    disabled={isView || fetchingData}
                  />
                )}
              </F>

              {/* Manager — auto-filled from TL's campaign */}
              <F name="manager" label="Manager" rules={req("manager")}>
                {(field) => (
                  <SelectInput
                    {...field}
                    options={managerOptions}
                    placeholder={fetchingData ? "Loading managers..." : "Select Manager"}
                    disabled={isView || fetchingData}
                  />
                )}
              </F>

              {/* AM Name — auto-filled from TL's campaign */}
              <F name="amName" label="AM Name" rules={req("AM Name")}>
                {(field) => (
                  <SelectInput
                    {...field}
                    options={assistantManagerOptions}
                    placeholder={fetchingData ? "Loading AM..." : "Select AM"}
                    disabled={isView || fetchingData}
                  />
                )}
              </F>

              {/* Send Approval */}
              <F name="sendApprovalForUserChange" label="Send Approval For User Change">
                {(field) => (
                  <input
                    type="checkbox"
                    className="af-checkbox"
                    checked={!!field.value}
                    onChange={field.onChange}
                    disabled={isView}
                  />
                )}
              </F>

              {/* User Change Request Approval */}
              <F name="userChangeRequestApproval" label="User Change Request Approval">
                {(field) => (
                  <SelectInput
                    {...field}
                    options={STATUS_OPTIONS}
                    placeholder="Select"
                    disabled={isView}
                  />
                )}
              </F>

            </div>
          </div>

        </div>
      </form>
    </section>
  );
};

export default AllocationForm;
