import { Controller, useForm } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Col, Row, Offcanvas } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { useEffect, useMemo, useState } from "react";
import PreLoader from "@/components/PreLoader/PreLoader";
import SelectInput from "@/components/SelectInput/SelectInput";
import toast from "react-hot-toast";
import { LuSlidersHorizontal, LuX, LuRotateCcw } from "react-icons/lu";
import { fetchClientsApi } from "@/features/clients/clientApi";
import { fetchProductsApi } from "@/features/products/productApi";
import { fetchUsersApi } from "@/features/users/userApi";
import { fetchCampaignsApi, fetchCampaignByIdApi, pickCampaignFromResponse } from "@/features/campaigns/campaignApi";
import {
  createTargetApi,
  fetchTargetByIdApi,
  getTargetApiErrorMessage,
  pickTargetFromResponse,
  updateTargetApi,
} from "@/features/targets/targetApi";
import {
  buildTargetPayload,
  DEFAULT_TARGET_FORM_VALUES,
  formatBranchFromApi,
  formatCampaignOptionLabel,
  formatMonthFromCampaign,
  campaignMatchesPortfolioId,
  mapTargetToFormValues,
  resolveBankIdFromName,
  readCampaignMongoId,
  resolveCampaignClientId,
  resolveRefId,
} from "@/features/targets/targetMappers";
import {
  isTeamLeaderRoleName,
  normalizeRoleNameValue,
} from "@/constants/roles";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import {
  DUMMY_ASST_MANAGER_OPTIONS,
  DUMMY_BANK_OPTIONS,
  DUMMY_BOSS_OPTIONS,
  DUMMY_BRANCH_OPTIONS,
  DUMMY_EMPLOYEE_OPTIONS,
  DUMMY_LOCATION_OPTIONS,
  DUMMY_PRODUCT_OPTIONS,
  DUMMY_TL_OPTIONS,
  ensureSelectOptions,
} from "./targetFormDummyData";
import "./TargetForm.scss";

// ─── Month/Year helpers ────────────────────────────────────────────────────────

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const getCurrentMonthYear = () => {
  const now = new Date();
  return `${MONTH_SHORT[now.getMonth()]} ${now.getFullYear()}`;
};

const normaliseMonthYear = (raw) => {
  if (!raw) return "";
  const s = String(raw).trim();

  if (/^[A-Za-z]{3} \d{4}$/.test(s)) return s;

  const shortYear = s.match(/^([A-Za-z]{3,9})\s*(\d{2})$/);
  if (shortYear) {
    const mon = shortYear[1].slice(0, 3);
    const yr = parseInt(shortYear[2], 10);
    const fullYear = yr < 50 ? 2000 + yr : 1900 + yr;
    return `${mon.charAt(0).toUpperCase()}${mon.slice(1).toLowerCase()} ${fullYear}`;
  }

  const longMonth = s.match(/^([A-Za-z]{4,9})\s+(\d{4})$/);
  if (longMonth) {
    return `${longMonth[1].slice(0, 3).charAt(0).toUpperCase()}${longMonth[1].slice(1, 3).toLowerCase()} ${longMonth[2]}`;
  }

  const numericA = s.match(/^(\d{4})[-/](\d{1,2})$/);
  if (numericA) {
    const idx = parseInt(numericA[2], 10) - 1;
    return idx >= 0 && idx < 12 ? `${MONTH_SHORT[idx]} ${numericA[1]}` : s;
  }
  const numericB = s.match(/^(\d{1,2})[-/](\d{4})$/);
  if (numericB) {
    const idx = parseInt(numericB[1], 10) - 1;
    return idx >= 0 && idx < 12 ? `${MONTH_SHORT[idx]} ${numericB[2]}` : s;
  }

  return s;
};

// ─── User role helpers ─────────────────────────────────────────────────────────

const getUserRoleName = (u) => {
  if (!u || typeof u !== "object") return "";
  if (typeof u.roleId === "object" && u.roleId?.name != null) {
    return String(u.roleId.name);
  }
  return String(u?.role_name ?? u?.role?.name ?? u?.role ?? u?.designation ?? "");
};

const normalizeRoleKey = (name) =>
  String(name ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");

const matchesRoleKeys = (u, keys) => {
  const roleKey = normalizeRoleKey(getUserRoleName(u));
  const normalized = normalizeRoleKey(normalizeRoleNameValue(getUserRoleName(u)));
  return keys.some(
    (key) => roleKey === key || roleKey.includes(key) || normalized === key,
  );
};

const isBossMdUser = (u) =>
  matchesRoleKeys(u, ["md", "boss", "unithead", "manager"]);

const isAsstManagerUser = (u) =>
  matchesRoleKeys(u, ["assistantmanager", "asstmanager", "am"]);

const isEmployeeTcUser = (u) =>
  matchesRoleKeys(u, ["telecaller", "tc", "teammember", "employee"]);

const mapUserToOption = (u, index) => {
  const uid = u?._id ?? u?.id ?? `row_${index}`;
  const label = u?.name ?? u?.full_name ?? u?.username ?? u?.email ?? String(uid);
  return { label: String(label), value: String(uid) };
};

const filterUsersToOptions = (rows, predicate) => {
  const filtered = rows.filter(predicate);
  const list = filtered.length > 0 ? filtered : rows;
  return list.map(mapUserToOption);
};

const resolveCampaignStaffIds = (campaign) => ({
  assistantManagerId: resolveRefId(
    campaign?.assistantManagerId ??
      campaign?.assistant_manager_id ??
      campaign?.assistantManager ??
      campaign?.assistant_manager ??
      campaign?.assistantMangerId ??
      campaign?.assitantMangerId,
  ),
  tlId: resolveRefId(
    campaign?.teamLeaderId ??
      campaign?.team_leader_id ??
      campaign?.teamLeader ??
      campaign?.team_leader ??
      campaign?.tlId ??
      campaign?.tl_id,
  ),
  bossMdId: resolveRefId(
    campaign?.managerId ??
      campaign?.manager_id ??
      campaign?.manager ??
      campaign?.bossId ??
      campaign?.boss_id,
  ),
});

// ─── Portfolio Filter Offcanvas ────────────────────────────────────────────────

const PortfolioFilterCanvas = ({
  show,
  onHide,
  bankOptions,
  teamLeadOptions,
  monthYearOptions,
  activeFilters,
  onApply,
}) => {
  const [local, setLocal] = useState(activeFilters);

  useEffect(() => {
    if (show) setLocal(activeFilters);
  }, [show, activeFilters]);

  const activeCount = Object.values(local).filter(Boolean).length;

  const handleApply = () => {
    onApply(local);
    onHide();
  };

  const handleReset = () => {
    const cleared = { bank: "", teamLeader: "", monthYear: "" };
    setLocal(cleared);
    onApply(cleared);
    onHide();
  };

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="portfolio-filter-canvas"
    >
      {/* ── Header ── */}
      <Offcanvas.Header className="portfolio-canvas-header">
        <div className="canvas-title-row">
          <span className="canvas-icon">
            <LuSlidersHorizontal size={18} />
          </span>
          <Offcanvas.Title className="canvas-title">
            Filter Portfolio
          </Offcanvas.Title>
          {activeCount > 0 && (
            <span className="canvas-active-badge">{activeCount}</span>
          )}
        </div>
        <button className="canvas-close-btn" onClick={onHide} aria-label="Close">
          <LuX size={18} />
        </button>
      </Offcanvas.Header>

      {/* ── Body ── */}
      <Offcanvas.Body className="portfolio-canvas-body">
        <div className="canvas-fields">

          <div className="canvas-field-group">
            <label className="canvas-label">Bank / Client</label>
            <SelectInput
              value={local.bank}
              options={[{ label: "All Banks", value: "" }, ...bankOptions]}
              placeholder="All Banks"
              onChange={(val) => setLocal((p) => ({ ...p, bank: val }))}
            />
          </div>

          <div className="canvas-field-group">
            <label className="canvas-label">Team Leader</label>
            <SelectInput
              value={local.teamLeader}
              options={[{ label: "All Team Leaders", value: "" }, ...teamLeadOptions]}
              placeholder="All Team Leaders"
              onChange={(val) => setLocal((p) => ({ ...p, teamLeader: val }))}
            />
          </div>

          <div className="canvas-field-group">
            <label className="canvas-label">Month / Year</label>
            <SelectInput
              value={local.monthYear}
              options={[{ label: "All Months", value: "" }, ...monthYearOptions]}
              placeholder="All Months"
              onChange={(val) => setLocal((p) => ({ ...p, monthYear: val }))}
            />
          </div>

        </div>
      </Offcanvas.Body>

      {/* ── Footer ── */}
      <div className="portfolio-canvas-footer">
        <Button
          variant="secondary"
          size="lg"
          onClick={handleReset}
          disabled={activeCount === 0}
          className="canvas-reset-btn"
        >
          <LuRotateCcw size={14} />
          Reset
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleApply}
          className="canvas-apply-btn"
        >
          Apply Filters
        </Button>
      </div>
    </Offcanvas>
  );
};

// ─── TargetForm ────────────────────────────────────────────────────────────────

const TargetForm = ({ mode = "create", onSubmit }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();

  const [submitLoading, setSubmitLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [bankOptions, setBankOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [userRows, setUserRows] = useState([]);
  const [campaignRows, setCampaignRows] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");

  const [showFilterCanvas, setShowFilterCanvas] = useState(false);
  const [portfolioFilters, setPortfolioFilters] = useState({
    bank: "",
    teamLeader: "",
    monthYear: getCurrentMonthYear(),
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_TARGET_FORM_VALUES });

  const bankId = watch("bankId");
  const portfolioId = watch("portfolioId");

  useEffect(() => {
    const loadData = async () => {
      try {
        setFetchingData(true);

        const [clientsResult, productsResult, usersResult, campaignsResult] =
          await Promise.allSettled([
            fetchClientsApi(),
            fetchProductsApi(),
            fetchUsersApi(),
            fetchCampaignsApi(),
          ]);
        if (clientsResult.status === "rejected") throw clientsResult.reason;
        if (productsResult.status === "rejected") throw productsResult.reason;

        const clientsData = clientsResult.value;
        const productsData = productsResult.value;
        const usersData = usersResult.status === "fulfilled" ? usersResult.value : {};
        const campaignsData = campaignsResult.status === "fulfilled" ? campaignsResult.value : {};

        const { rows: clientRows } = extractListPayload(clientsData ?? {});
        setBankOptions(
          clientRows.map((client) => ({
            label:
              client.bankName ?? client.bank_name ??
              client.client_name ?? client.clientName ?? "",
            value: String(client._id ?? client.id ?? ""),
          })),
        );

        const { rows: productRows } = extractListPayload(productsData);
        setProductOptions(
          productRows.map((p, index) => {
            const pid = p?._id ?? p?.id ?? `row_${index}`;
            const label = p?.productName ?? p?.product_name ?? p?.name ?? p?.code ?? "";
            return { label: String(label), value: String(pid) };
          }),
        );

        const { rows: users } = extractListPayload(usersData);
        setUserRows(users);

        if (isApiFailure(campaignsData)) {
          toast.error(
            campaignsData?.message || campaignsData?.error || "Failed to load campaigns",
          );
          setCampaignRows([]);
        } else {
          const { rows: campaignList } = extractListPayload(campaignsData ?? {});
          setCampaignRows(campaignList);
        }

        const alignFilterToPortfolio = (target) => {
          const camp =
            target?.portfolioId ?? target?.campaignId ??
            target?.campaign_id ?? target?.campaign;
          const code =
            typeof camp === "string"
              ? camp
              : typeof camp?.campaignId === "string"
              ? camp.campaignId
              : typeof camp?.name === "string"
              ? camp.name
              : null;
          if (code) {
            const prefix = code.match(/^([A-Za-z]{3})(\d{2})/);
            if (prefix) {
              const yr = parseInt(prefix[2], 10);
              const fullYear = yr < 50 ? 2000 + yr : 1900 + yr;
              const mon =
                prefix[1].charAt(0).toUpperCase() + prefix[1].slice(1).toLowerCase();
              setPortfolioFilters((prev) => ({
                ...prev,
                monthYear: `${mon} ${fullYear}`,
              }));
            }
          }
        };

        if ((mode === "edit" || mode === "view") && id) {
          const body = await fetchTargetByIdApi(id);
          if (isApiFailure(body)) {
            toast.error(body?.message || body?.error || "Failed to load target");
            navigate("/customer-mgt/goal-sheet");
            return;
          }
          const target = pickTargetFromResponse(body);
          if (target) {
            const values = mapTargetToFormValues(target);
            if (!values.bankId) {
              values.bankId = resolveBankIdFromName(
                target?.bankName ?? target?.bank_name, clientRows,
              );
            }
            alignFilterToPortfolio(target);
            reset(values);
            setSelectedMonth(
              String(target?.month ?? target?.monthYear ?? target?.month_year ?? ""),
            );
          }
        } else if (state?.target) {
          const values = mapTargetToFormValues(state.target);
          if (!values.bankId) {
            values.bankId = resolveBankIdFromName(
              state.target?.bankName ?? state.target?.bank_name, clientRows,
            );
          }
          alignFilterToPortfolio(state.target);
          reset(values);
          setSelectedMonth(
            String(
              state.target?.month ?? state.target?.monthYear ??
              state.target?.month_year ?? "",
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load target form data", error);
        toast.error(getTargetApiErrorMessage(error, "Failed to load necessary data"));
        if (mode === "edit" || mode === "view") {
          navigate("/customer-mgt/goal-sheet");
        }
      } finally {
        setFetchingData(false);
      }
    };

    loadData();
  }, [mode, id, state, reset, navigate]);

  useEffect(() => {
    if (!portfolioId) {
      setSelectedCampaign(null);
      return;
    }

    const fetchAndSetCampaignDetails = async () => {
      try {
        const response = await fetchCampaignByIdApi(portfolioId);
        const campaign = pickCampaignFromResponse(response);
        if (!campaign) return;
        setSelectedCampaign(campaign);

        const branch = formatBranchFromApi(campaign?.branch);
        if (branch) setValue("branchName", branch);

        const productId = resolveRefId(
          campaign?.product ?? campaign?.product_id ?? campaign?.productId,
        );
        if (productId) setValue("productId", productId);

        const month = formatMonthFromCampaign(campaign);
        if (month) setSelectedMonth(month);

        if (campaign?.type) {
          const typeVal = String(campaign.type).toUpperCase() === "REC" ? "REC" : "BKT";
          setValue("type", typeVal);
        }
        if (campaign?.resolutionTarget != null) {
          setValue("resolutionPercentage", String(campaign.resolutionTarget));
        }
        if (campaign?.nrrbTarget != null) {
          setValue("nrrbPercentage", String(campaign.nrrbTarget));
        }
        if (campaign?.ceTarget != null) {
          setValue("collectionTarget", String(campaign.ceTarget));
        }

        const resolvedBankId = resolveRefId(
          campaign?.clientId ?? campaign?.client ?? campaign?.bankId ?? campaign?.bank,
        );
        if (resolvedBankId) setValue("bankId", resolvedBankId);

        const campaignStaffIds = resolveCampaignStaffIds(campaign);
        if (campaignStaffIds.tlId) setValue("tlId", campaignStaffIds.tlId);
        if (campaignStaffIds.bossMdId) setValue("bossMdId", campaignStaffIds.bossMdId);
        if (campaignStaffIds.assistantManagerId)
          setValue("assistantManagerId", campaignStaffIds.assistantManagerId);
      } catch (error) {
        console.error("Failed to fetch campaign details for target form", error);
      }
    };

    fetchAndSetCampaignDetails();
  }, [portfolioId, setValue]);

  const selectedPortfolioId = control._formValues?.portfolioId ?? "";

  const portfolioOptions = useMemo(() => {
    const { bank, teamLeader, monthYear } = portfolioFilters;

    return campaignRows
      .filter((c) => {
        const cId = readCampaignMongoId(c);
        if (selectedPortfolioId && cId === selectedPortfolioId) return true;

        if (bank) {
          const clientId = c.clientId?._id ?? c.clientId;
          if (String(clientId) !== String(bank)) return false;
        }
        if (teamLeader) {
          const tlId = c.teamLeaderId?._id ?? c.teamLeaderId;
          if (String(tlId) !== String(teamLeader)) return false;
        }
        if (monthYear) {
          const m = normaliseMonthYear(c.monthYear ?? c.month_year ?? "");
          if (m !== monthYear) return false;
        }
        return true;
      })
      .map((c) => {
        const id = readCampaignMongoId(c);
        if (!id) return null;
        return { label: formatCampaignOptionLabel(c), value: id };
      })
      .filter(Boolean);
  }, [campaignRows, portfolioFilters, selectedPortfolioId]);

  const monthYearOptions = useMemo(() => {
    const seen = new Set();
    return campaignRows
      .map((c) => normaliseMonthYear(c.monthYear ?? c.month_year ?? ""))
      .filter((m) => m && !seen.has(m) && seen.add(m))
      .map((m) => ({ label: m, value: m }));
  }, [campaignRows]);

  const tlFilterOptions = useMemo(
    () =>
      filterUsersToOptions(userRows, (u) =>
        isTeamLeaderRoleName(getUserRoleName(u)) ||
        isTeamLeaderRoleName(u?.designation),
      ),
    [userRows],
  );

  const activeFilterCount = useMemo(
    () => Object.values(portfolioFilters).filter(Boolean).length,
    [portfolioFilters],
  );

  const resolvedBankOptions = useMemo(
    () => ensureSelectOptions(bankOptions, DUMMY_BANK_OPTIONS),
    [bankOptions],
  );

  const branchOptions = useMemo(() => {
    const scopedCampaigns = bankId
      ? campaignRows.filter(
          (campaign) => resolveCampaignClientId(campaign) === String(bankId),
        )
      : campaignRows;
    const branches = new Set();
    scopedCampaigns.forEach((campaign) => {
      const branch = formatBranchFromApi(campaign?.branch);
      if (branch) branches.add(branch);
    });
    const fromApi = Array.from(branches).map((branch) => ({
      label: branch,
      value: branch,
    }));
    return ensureSelectOptions(fromApi, DUMMY_BRANCH_OPTIONS);
  }, [campaignRows, bankId]);

  const locationOptions = useMemo(() => {
    const locations = new Set();
    userRows.forEach((user) => {
      const location = user?.location ?? user?.city ?? user?.office_location ?? "";
      if (location) locations.add(String(location));
    });
    const fromApi = Array.from(locations).map((location) => ({
      label: location,
      value: location,
    }));
    return ensureSelectOptions(fromApi, DUMMY_LOCATION_OPTIONS);
  }, [userRows]);

  const employeeTcOptions = useMemo(
    () => ensureSelectOptions(filterUsersToOptions(userRows, isEmployeeTcUser), DUMMY_EMPLOYEE_OPTIONS),
    [userRows],
  );

  const bossMdOptions = useMemo(
    () => ensureSelectOptions(filterUsersToOptions(userRows, isBossMdUser), DUMMY_BOSS_OPTIONS),
    [userRows],
  );

  const asstManagerOptions = useMemo(
    () => ensureSelectOptions(filterUsersToOptions(userRows, isAsstManagerUser), DUMMY_ASST_MANAGER_OPTIONS),
    [userRows],
  );

  const tlOptions = useMemo(
    () =>
      ensureSelectOptions(
        filterUsersToOptions(userRows, (u) =>
          isTeamLeaderRoleName(getUserRoleName(u)) || isTeamLeaderRoleName(u?.designation),
        ),
        DUMMY_TL_OPTIONS,
      ),
    [userRows],
  );

  const resolvedProductOptions = useMemo(
    () => ensureSelectOptions(productOptions, DUMMY_PRODUCT_OPTIONS),
    [productOptions],
  );

  const handleBack = () => navigate(-1);

  const getSelectedCampaignForSubmit = (portfolioId) => {
    if (selectedCampaign && campaignMatchesPortfolioId(selectedCampaign, portfolioId)) {
      return selectedCampaign;
    }
    return campaignRows.find((campaign) =>
      campaignMatchesPortfolioId(campaign, portfolioId),
    );
  };

  const submitTarget = async (data) => {
    if (onSubmit) {
      onSubmit(data);
      return;
    }

    if (mode === "edit" && !id) {
      toast.error("Target not found");
      return;
    }

    try {
      setSubmitLoading(true);
      const campaign = getSelectedCampaignForSubmit(data.portfolioId);
      const campaignStaffIds = resolveCampaignStaffIds(campaign);
      const dataWithCampaignStaff = {
        ...data,
        assistantManagerId: campaignStaffIds.assistantManagerId || data.assistantManagerId,
        tlId: campaignStaffIds.tlId || data.tlId,
        bossMdId: campaignStaffIds.bossMdId || data.bossMdId,
      };

      const payload = buildTargetPayload(dataWithCampaignStaff, {
        bankOptions: resolvedBankOptions,
        month: selectedMonth,
        campaigns: campaignRows,
      });

      const response =
        mode === "edit"
          ? await updateTargetApi(id, payload)
          : await createTargetApi(payload);

      if (isApiFailure(response)) {
        toast.error(
          response?.message || response?.error ||
            (mode === "edit" ? "Failed to update target" : "Failed to create target"),
        );
        return;
      }

      toast.success(
        response?.message ||
          (mode === "edit" ? "Target updated successfully" : "Target created successfully"),
      );
      navigate("/customer-mgt/goal-sheet");
    } catch (error) {
      console.error("Target form submission error", error);
      toast.error(
        getTargetApiErrorMessage(
          error,
          mode === "edit" ? "Failed to update target" : "Failed to create target",
        ),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFormSubmit = (data) => submitTarget(data);

  const basicSetupFields = useMemo(
    () => [
      {
        name: "entity",
        label: "Entity",
        type: "text",
        placeholder: "Enter Entity",
        col: 4,
        required: true,
      },
      {
        name: "bankId",
        label: "Bank",
        type: "select",
        placeholder: "Select Bank",
        col: 4,
        required: true,
        options: resolvedBankOptions,
      },
      {
        name: "location",
        label: "Location",
        type: "select",
        placeholder: "Select Location",
        col: 4,
        options: locationOptions,
      },
      {
        name: "branchName",
        label: "Branch Name",
        type: "select",
        placeholder: "Select Branch Name",
        col: 4,
        options: branchOptions,
      },
    ],
    [resolvedBankOptions, bankId, locationOptions, branchOptions],
  );

  const typeTargetRowOneFields = useMemo(
    () => [
      {
        name: "productId",
        label: "Product",
        type: "select",
        placeholder: "Select Product",
        col: 4,
        options: resolvedProductOptions,
      },
      {
        name: "collectionTarget",
        label: "Collection Target",
        type: "number",
        placeholder: "Enter Collection Target",
        col: 4,
      },
    ],
    [resolvedProductOptions],
  );

  const typeTargetRowTwoFields = useMemo(
    () => [
      {
        name: "resolutionPercentage",
        label: "Target Resolution %",
        type: "number",
        placeholder: "Enter Target Resolution %",
        col: 4,
      },
      {
        name: "nrrbPercentage",
        label: "NR/RB %",
        type: "number",
        placeholder: "Enter NR/RB %",
        col: 4,
      },
      {
        name: "fos",
        label: "FOS",
        type: "number",
        placeholder: "Enter FOS",
        col: 4,
      },
    ],
    [],
  );

  const targetSetupFields = useMemo(
    () => [
      {
        name: "target01",
        label: "Target 01",
        type: "text",
        placeholder: "Enter Target 01",
        col: 6,
      },
      {
        name: "remarks",
        label: "Remarks",
        type: "textarea",
        placeholder: "Enter Remarks",
        col: 12,
      },
    ],
    [],
  );

  if (fetchingData) return <PreLoader />;

  const renderField = (field, { type, placeholder, options, disabled }) => {
    switch (type) {
      case "select":
        return (
          <SelectInput
            {...field}
            options={options || []}
            placeholder={placeholder}
            disabled={mode === "view" || disabled}
          />
        );
      case "textarea":
        return (
          <textarea
            {...field}
            className="form-input form-textarea"
            placeholder={placeholder}
            disabled={mode === "view"}
            rows={4}
          />
        );
      default:
        return (
          <input
            {...field}
            type={type}
            className="form-input"
            placeholder={placeholder}
            disabled={mode === "view"}
          />
        );
    }
  };

  const renderFormFields = (fields) =>
    fields.map((field) => (
      <Col xxl={field.col} xl={field.col} lg={field.col} key={field.name}>
        <div className="input-container">
          <label className="form-label">
            {field.label}{" "}
            {field.required && <span className="required">*</span>}
          </label>
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
            }}
            render={({ field: controllerField }) =>
              renderField(controllerField, field)
            }
          />
          {errors[field.name] && (
            <span className="error-message">{errors[field.name]?.message}</span>
          )}
        </div>
      </Col>
    ));

  return (
    <section className="target-form-container">
      <div className="page-header-container">
        <div className="page-title-wrap">
          <div className="title-breadcrumb-group">
            <div className="title-with-back">
              <BackButton onClick={handleBack} />
              <h4 className="mb-0">
                {mode === "edit"
                  ? "Edit Target"
                  : mode === "view"
                  ? "View Target"
                  : "Create Target"}
              </h4>
            </div>
          </div>
        </div>

        <div className="page-header-actions">
          <Button variant="custom" size="lg" onClick={handleBack}>
            Cancel
          </Button>

          {mode !== "view" && (
            <Button
              variant="primary"
              size="lg"
              type="submit"
              form="target-form"
              disabled={submitLoading}
            >
              {submitLoading
                ? mode === "edit"
                  ? "Updating..."
                  : "Saving..."
                : mode === "edit"
                ? "Update"
                : "Save"}
            </Button>
          )}
        </div>
      </div>

      <form
        id="target-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="mt-4 target-form-content"
      >
        {/* Section 1 – Basic Target Setup */}
        <div className="form-section">
          <h4>Basic Target Setup</h4>
          <Row className="form-group">

            {/* ── Portfolio field with filter button ── */}
            <Col xxl={4} xl={4} lg={4}>
              <div className="input-container">
                <label className="form-label">Portfolio</label>
                <div className="campaign-field-row">
                  <Controller
                    name="portfolioId"
                    control={control}
                    render={({ field }) => (
                      <SelectInput
                        {...field}
                        options={portfolioOptions}
                        placeholder="Select Portfolio"
                        disabled={mode === "view"}
                      />
                    )}
                  />

                  {mode !== "view" && (
                    <button
                      type="button"
                      className={`filter-icon-btn ${activeFilterCount > 0 ? "has-filters" : ""}`}
                      onClick={() => setShowFilterCanvas(true)}
                      title="Filter portfolio"
                    >
                      <LuSlidersHorizontal size={16} />
                      {activeFilterCount > 0 && (
                        <span className="filter-dot">{activeFilterCount}</span>
                      )}
                    </button>
                  )}
                </div>
                {errors.portfolioId && (
                  <span className="error-message">{errors.portfolioId?.message}</span>
                )}
              </div>
            </Col>

            {renderFormFields(basicSetupFields)}
          </Row>
        </div>

        {/* Section 2 – Type & Target */}
        <div className="form-section">
          <h4>Type &amp; Target</h4>
          <div className="form-group">
            <Row>
              <Col xxl={4} xl={4} lg={4}>
                <div className="input-container type-radio-field">
                  <label className="form-label d-block">Type</label>
                  <div className="type-radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        value="BKT"
                        {...control.register("type")}
                        className="form-check-input"
                        disabled={mode === "view"}
                      />
                      <span>BKT</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        value="REC"
                        {...control.register("type")}
                        className="form-check-input"
                        disabled={mode === "view"}
                      />
                      <span>REC</span>
                    </label>
                  </div>
                </div>
              </Col>
              {renderFormFields(typeTargetRowOneFields)}
            </Row>
            <Row className="align-items-end">
              {renderFormFields(typeTargetRowTwoFields)}
            </Row>
          </div>
        </div>

        {/* Section 3 – Target Setup */}
        <div className="form-section">
          <h4>Target Setup</h4>
          <Row className="form-group">
            {renderFormFields(targetSetupFields)}
          </Row>
        </div>
      </form>

      {/* ── Portfolio Filter Offcanvas ── */}
      <PortfolioFilterCanvas
        show={showFilterCanvas}
        onHide={() => setShowFilterCanvas(false)}
        bankOptions={bankOptions}
        teamLeadOptions={tlFilterOptions}
        monthYearOptions={monthYearOptions}
        activeFilters={portfolioFilters}
        onApply={(newFilters) => setPortfolioFilters(newFilters)}
      />
    </section>
  );
};

export default TargetForm;
