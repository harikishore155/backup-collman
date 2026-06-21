import { Controller, useForm } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Col, Row, Offcanvas } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { useEffect, useMemo, useState } from "react";
import PreLoader from "@/components/PreLoader/PreLoader";
import SelectInput from "@/components/SelectInput/SelectInput";
import toast from "react-hot-toast";
import { fetchClientsApi } from "@/features/clients/clientApi";
import { fetchProductsApi } from "@/features/products/productApi";
import { fetchUsersApi } from "@/features/users/userApi";
import { fetchCampaignsApi } from "@/features/campaigns/campaignApi";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import {
  fetchCustomerByIdApi,
  createCustomerApi,
  updateCustomerApi,
} from "@/features/customers/customerApi";
import { LuSlidersHorizontal } from "react-icons/lu";
import "./CustomerForm.scss";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// Returns "Jun 2026" — canonical form used internally
const getCurrentMonthYear = () => {
  const now = new Date();
  return `${MONTH_SHORT[now.getMonth()]} ${now.getFullYear()}`;
};

// Normalise whatever the API returns into "Jun 2026" so filtering is consistent.
// Handles: "Jun 2026", "Jun26", "Jun 26", "2026-06", "06-2026", "June 2026" etc.
const normaliseMonthYear = (raw) => {
  if (!raw) return "";
  const s = String(raw).trim();

  // Already canonical: "Jun 2026"
  if (/^[A-Za-z]{3} \d{4}$/.test(s)) return s;

  // "Jun26" or "Jun 26" → "Jun 2026"
  const shortYear = s.match(/^([A-Za-z]{3,9})\s*(\d{2})$/);
  if (shortYear) {
    const mon = shortYear[1].slice(0, 3);
    const yr = parseInt(shortYear[2], 10);
    const fullYear = yr < 50 ? 2000 + yr : 1900 + yr;
    return `${mon.charAt(0).toUpperCase()}${mon.slice(1).toLowerCase()} ${fullYear}`;
  }

  // "June 2026" → "Jun 2026"
  const longMonth = s.match(/^([A-Za-z]{4,9})\s+(\d{4})$/);
  if (longMonth) {
    return `${longMonth[1].slice(0, 3).charAt(0).toUpperCase()}${longMonth[1].slice(1, 3).toLowerCase()} ${longMonth[2]}`;
  }

  // "2026-06" or "06-2026" or "2026/06"
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

  return s; // unchanged fallback
};

const resolveId = (val) => {
  if (!val) return "";
  if (typeof val === "object") return String(val._id ?? val.id ?? "");
  return String(val);
};

const DEFAULT_CUSTOMER_FORM_VALUES = {
  customerName: "",
  contactNumber: "",
  email: "",
  accountNumber: "",
  campaignId: "",
  clientId: "",
  productId: "",
  teamLeaderId: "",
  status: "active",
  branchName: "",
  district: "",
  collType: "",
  pos: "",
  tos: "",
  waiverPercent: "",
  dpd: "",
  dpdSeg: "",
  tenure: "",
  installmentPaid: "",
  pendingEmi: "",
  oneMonthEmi: "",
  totalInstallment: "",
  outstandingAmount: "",
  outstandingInterest: "",
  outstandingPrincipal: "",
  disbursedAmount: "",
  remarks: "",
};

const mapCustomerToFormValues = (raw) => ({
  customerName: raw?.customerName ?? raw?.customer_name ?? "",
  contactNumber: raw?.contactNumber ?? raw?.customerMobile ?? "",
  email: raw?.email ?? "",
  accountNumber: raw?.accountNumber ?? raw?.accountId ?? "",
  campaignId: resolveId(raw?.campaignId ?? raw?.campaign_id ?? raw?.campaign),
  clientId: resolveId(raw?.clientId),
  productId: resolveId(raw?.productId),
  teamLeaderId: resolveId(raw?.teamLeaderId),
  status: raw?.status ?? "active",
  branchName: raw?.branchName ?? "",
  district: raw?.district ?? "",
  collType: raw?.collType ?? "",
  pos: raw?.pos ?? "",
  tos: raw?.tos ?? "",
  waiverPercent: raw?.waiverPercent ?? "",
  dpd: raw?.dpd ?? "",
  dpdSeg: raw?.dpdSeg ?? "",
  tenure: raw?.tenure ?? "",
  installmentPaid: raw?.installmentPaid ?? "",
  pendingEmi: raw?.pendingEmi ?? "",
  oneMonthEmi: raw?.oneMonthEmi ?? "",
  totalInstallment: raw?.totalInstallment ?? "",
  outstandingAmount: raw?.outstandingAmount ?? "",
  outstandingInterest: raw?.outstandingInterest ?? "",
  outstandingPrincipal: raw?.outstandingPrincipal ?? "",
  disbursedAmount: raw?.disbursedAmount ?? "",
  remarks: raw?.remarks ?? "",
});

const buildCustomerPayload = (data) => ({
  customerName: data.customerName,
  contactNumber: data.contactNumber,
  email: data.email,
  accountNumber: data.accountNumber,
  campaignId: data.campaignId || undefined,
  clientId: data.clientId || undefined,
  productId: data.productId || undefined,
  teamLeaderId: data.teamLeaderId || undefined,
  status: data.status,
  branchName: data.branchName || undefined,
  district: data.district || undefined,
  collType: data.collType || undefined,
  pos: data.pos !== "" ? Number(data.pos) : undefined,
  tos: data.tos !== "" ? Number(data.tos) : undefined,
  waiverPercent:
    data.waiverPercent !== "" ? Number(data.waiverPercent) : undefined,
  dpd: data.dpd || undefined,
  dpdSeg: data.dpdSeg || undefined,
  tenure: data.tenure !== "" ? Number(data.tenure) : undefined,
  installmentPaid:
    data.installmentPaid !== "" ? Number(data.installmentPaid) : undefined,
  pendingEmi: data.pendingEmi !== "" ? Number(data.pendingEmi) : undefined,
  oneMonthEmi: data.oneMonthEmi !== "" ? Number(data.oneMonthEmi) : undefined,
  totalInstallment:
    data.totalInstallment !== "" ? Number(data.totalInstallment) : undefined,
  outstandingAmount:
    data.outstandingAmount !== "" ? Number(data.outstandingAmount) : undefined,
  outstandingInterest:
    data.outstandingInterest !== ""
      ? Number(data.outstandingInterest)
      : undefined,
  outstandingPrincipal:
    data.outstandingPrincipal !== ""
      ? Number(data.outstandingPrincipal)
      : undefined,
  disbursedAmount:
    data.disbursedAmount !== "" ? Number(data.disbursedAmount) : undefined,
  remarks: data.remarks || undefined,
});

// ─── Campaign Filter Offcanvas ─────────────────────────────────────────────────

const CampaignFilterCanvas = ({
  show,
  onHide,
  clientOptions,
  teamLeadOptions,
  monthYearOptions,
  activeFilters,
  onApply,
}) => {
  const [local, setLocal] = useState(activeFilters);

  // Sync local state when canvas opens
  useEffect(() => {
    if (show) setLocal(activeFilters);
  }, [show, activeFilters]);

  const handleApply = () => {
    onApply(local);
    onHide();
  };

  const handleReset = () => {
    const reset = { bank: "", teamLeader: "", monthYear: "" };
    setLocal(reset);
    onApply(reset);
    onHide();
  };

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="campaign-filter-canvas"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Filter Campaigns</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="campaign-filter-body">
        <div className="filter-fields">
          {/* Bank / Client */}
          <div className="filter-field-group">
            <label className="filter-field-label">Bank / Client</label>
            <SelectInput
              value={local.bank}
              options={[{ label: "All Banks", value: "" }, ...clientOptions]}
              placeholder="All Banks"
              onChange={(val) => setLocal((p) => ({ ...p, bank: val }))}
            />
          </div>

          {/* Team Leader */}
          <div className="filter-field-group">
            <label className="filter-field-label">Team Leader</label>
            <SelectInput
              value={local.teamLeader}
              options={[
                { label: "All Team Leaders", value: "" },
                ...teamLeadOptions,
              ]}
              placeholder="All Team Leaders"
              onChange={(val) => setLocal((p) => ({ ...p, teamLeader: val }))}
            />
          </div>

          {/* Month / Year */}
          <div className="filter-field-group">
            <label className="filter-field-label">Month / Year</label>
            <SelectInput
              value={local.monthYear}
              options={[
                { label: "All Months", value: "" },
                ...monthYearOptions,
              ]}
              placeholder="All Months"
              onChange={(val) => setLocal((p) => ({ ...p, monthYear: val }))}
            />
          </div>
        </div>

        <div className="filter-footer">
          <button
            type="button"
            className="filter-reset-btn"
            onClick={handleReset}
          >
            <span className="reset-icon">↺</span> Reset
          </button>
          <Button variant="primary" size="lg" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

// ─── component ────────────────────────────────────────────────────────────────

const CustomerForm = ({ mode = "create" }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();

  const [submitLoading, setSubmitLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Reference data (raw)
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [teamLeadOptions, setTeamLeadOptions] = useState([]);

  // Campaign filter state — default to current month
  const [showFilterCanvas, setShowFilterCanvas] = useState(false);
  const [campaignFilters, setCampaignFilters] = useState({
    bank: "",
    teamLeader: "",
    monthYear: getCurrentMonthYear(),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_CUSTOMER_FORM_VALUES });

  // ── fetch reference data + pre-fill for edit/view ──────────────────────────
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
        if (campaignsResult.status === "rejected") throw campaignsResult.reason;

        const clientsData = clientsResult.value;
        const productsData = productsResult.value;
        const usersData = usersResult.status === "fulfilled" ? usersResult.value : {};
        const campaignsData = campaignsResult.value;

        // clients
        const { rows: clientRows } = extractListPayload(clientsData ?? {});
        setClientOptions(
          clientRows.map((c) => ({
            label: c.bankName ?? c.clientName ?? c.name ?? "",
            value: String(c._id ?? c.id ?? ""),
          })),
        );

        // products
        const { rows: productRows } = extractListPayload(productsData ?? {});
        setProductOptions(
          productRows.map((p) => ({
            label: p.productName ?? p.name ?? p.code ?? "",
            value: String(p._id ?? p.id ?? ""),
          })),
        );

        // campaigns — store raw rows; filtering happens in useMemo
        const { rows: campaignList } = extractListPayload(campaignsData ?? {});
        setAllCampaigns(campaignList);

        // team leads
        const { rows: users } = extractListPayload(usersData ?? {});
        const tlUsers = users.filter((u) => {
          const roleName = String(
            u?.roleId?.name ?? u?.role?.name ?? u?.role ?? u?.designation ?? "",
          )
            .toLowerCase()
            .replace(/[\s_-]+/g, "");
          return (
            roleName.includes("teamlead") ||
            roleName.includes("tl") ||
            roleName.includes("leader")
          );
        });
        setTeamLeadOptions(
          (tlUsers.length > 0 ? tlUsers : users).map((u) => ({
            label: u.name ?? u.full_name ?? u.username ?? "",
            value: String(u._id ?? u.id ?? ""),
          })),
        );

        // pre-fill for edit / view
        // Helper: extract the month from a populated campaign object so the
        // filter is adjusted and the label resolves correctly in the dropdown.
        const alignFilterToRaw = (raw) => {
          const camp = raw?.campaignId ?? raw?.campaign_id ?? raw?.campaign;
          if (camp && typeof camp === "object") {
            // Try the campaignId string field first (e.g. "May26_ICICI_PRD_003_REC_Subash")
            const code =
              typeof camp.campaignId === "string" ? camp.campaignId : null;
            if (code) {
              // Parse "May26" prefix → "May 2026" canonical form
              const prefix = code.match(/^([A-Za-z]{3})(\d{2})/);
              if (prefix) {
                const yr = parseInt(prefix[2], 10);
                const fullYear = yr < 50 ? 2000 + yr : 1900 + yr;
                const mon =
                  prefix[1].charAt(0).toUpperCase() +
                  prefix[1].slice(1).toLowerCase();
                setCampaignFilters((prev) => ({
                  ...prev,
                  monthYear: `${mon} ${fullYear}`,
                }));
              }
            }
          }
        };

        if ((mode === "edit" || mode === "view") && id) {
          const resp = await fetchCustomerByIdApi(id);
          const raw = resp?.data ?? resp?.result ?? resp?.customer ?? resp;
          if (raw && typeof raw === "object") {
            alignFilterToRaw(raw);
            reset(mapCustomerToFormValues(raw));
          }
        } else if (state?.customer?._raw) {
          alignFilterToRaw(state.customer._raw);
          reset(mapCustomerToFormValues(state.customer._raw));
        } else if (state?.customer) {
          alignFilterToRaw(state.customer);
          reset(mapCustomerToFormValues(state.customer));
        }
      } catch (err) {
        console.error("CustomerForm load error", err);
        toast.error("Failed to load form data");
        if (mode === "edit" || mode === "view") navigate(-1);
      } finally {
        setFetchingData(false);
      }
    };

    loadData();
  }, [mode, id, state, reset, navigate]);

  // ── Filtered campaign options ──────────────────────────────────────────────
  // Also reads the current form value so the selected campaign is always
  // included in the list even if it falls outside the active month filter.
  const selectedCampaignId = control._formValues?.campaignId ?? "";

  const campaignOptions = useMemo(() => {
    const { bank, teamLeader, monthYear } = campaignFilters;

    const toCampaignOption = (c) => {
      // API stores the human-readable name in c.campaignId string field
      // c._id is the Mongo ObjectId — only used as the select value
      const label =
        (typeof c.campaignId === "string" ? c.campaignId : null) ??
        c.campaignName ??
        c.name ??
        c.code ??
        c.campaignCode ??
        "";
      return { label, value: String(c._id ?? c.id ?? "") };
    };

    const filtered = allCampaigns
      .filter((c) => {
        const cId = String(c._id ?? c.id ?? "");

        // Always keep the currently-selected campaign so the label resolves
        if (selectedCampaignId && cId === selectedCampaignId) return true;

        if (bank) {
          const clientId = c.clientId?._id ?? c.clientId;
          if (String(clientId) !== String(bank)) return false;
        }
        if (teamLeader) {
          const tlId = c.teamLeaderId?._id ?? c.teamLeaderId;
          if (String(tlId) !== String(teamLeader)) return false;
        }
        if (monthYear) {
          // Normalise before comparing — handles "Jun26", "Jun 26", "Jun 2026" etc.
          const m = normaliseMonthYear(c.monthYear ?? c.month_year ?? "");
          if (m !== monthYear) return false;
        }
        return true;
      })
      .map(toCampaignOption)
      .filter((o) => o.value);

    return filtered;
  }, [allCampaigns, campaignFilters, selectedCampaignId]);

  // ── Month/Year options — normalised to match filter value format ───────────
  const monthYearOptions = useMemo(() => {
    const seen = new Set();
    return allCampaigns
      .map((c) => normaliseMonthYear(c.monthYear ?? c.month_year ?? ""))
      .filter((m) => m && !seen.has(m) && seen.add(m))
      .map((m) => ({ label: m, value: m }));
  }, [allCampaigns]);

  // ── Active filter count ────────────────────────────────────────────────────
  const activeFilterCount = useMemo(
    () => Object.values(campaignFilters).filter(Boolean).length,
    [campaignFilters],
  );

  // ── submit ─────────────────────────────────────────────────────────────────
  const submitCustomer = async (data) => {
    if (mode === "edit" && !id) {
      toast.error("Customer not found");
      return;
    }
    try {
      setSubmitLoading(true);
      const payload = buildCustomerPayload(data);

      const resp =
        mode === "edit"
          ? await updateCustomerApi(id, payload)
          : await createCustomerApi(payload);

      if (isApiFailure(resp)) {
        toast.error(
          resp?.message ??
            (mode === "edit"
              ? "Failed to update customer"
              : "Failed to create customer"),
        );
        return;
      }

      toast.success(
        resp?.message ??
          (mode === "edit"
            ? "Customer updated successfully"
            : "Customer created successfully"),
      );
      navigate("/customer-mgt/customers");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ??
          (mode === "edit"
            ? "Failed to update customer"
            : "Failed to create customer"),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── field definitions ──────────────────────────────────────────────────────

  const identityFields = useMemo(
    () => [
      {
        name: "customerName",
        label: "Customer Name",
        type: "text",
        placeholder: "Enter customer name",
        col: 4,
        required: true,
      },
      {
        name: "contactNumber",
        label: "Contact Number",
        type: "text",
        placeholder: "Enter contact number",
        col: 4,
        required: true,
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "Enter email address",
        col: 4,
      },
      {
        name: "accountNumber",
        label: "Account Number",
        type: "text",
        placeholder: "Enter account number",
        col: 4,
        required: true,
      },
      // Campaign field is rendered separately (with filter button)
      {
        name: "clientId",
        label: "Client (Bank)",
        type: "select",
        placeholder: "Select Client",
        col: 4,
        options: clientOptions,
      },
      {
        name: "productId",
        label: "Product",
        type: "select",
        placeholder: "Select Product",
        col: 4,
        options: productOptions,
      },
      {
        name: "teamLeaderId",
        label: "Team Lead",
        type: "select",
        placeholder: "Select Team Lead",
        col: 4,
        options: teamLeadOptions,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        placeholder: "Select Status",
        col: 4,
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
    ],
    [clientOptions, productOptions, teamLeadOptions],
  );

  const locationFields = useMemo(
    () => [
      {
        name: "branchName",
        label: "Branch Name",
        type: "text",
        placeholder: "Enter branch name",
        col: 4,
      },
      {
        name: "district",
        label: "District",
        type: "text",
        placeholder: "Enter district",
        col: 4,
      },
      {
        name: "collType",
        label: "Collection Type",
        type: "text",
        placeholder: "Enter collection type",
        col: 4,
      },
    ],
    [],
  );

  const dpdFields = useMemo(
    () => [
      {
        name: "dpd",
        label: "DPD",
        type: "text",
        placeholder: "Enter DPD",
        col: 4,
      },
      {
        name: "dpdSeg",
        label: "DPD Segment",
        type: "text",
        placeholder: "Enter DPD Segment",
        col: 4,
      },
    ],
    [],
  );

  const financialFields = useMemo(
    () => [
      {
        name: "outstandingAmount",
        label: "Outstanding Amount",
        type: "number",
        placeholder: "Enter outstanding amount",
        col: 4,
      },
      {
        name: "outstandingInterest",
        label: "Outstanding Interest",
        type: "number",
        placeholder: "Enter outstanding interest",
        col: 4,
      },
      {
        name: "outstandingPrincipal",
        label: "Outstanding Principal",
        type: "number",
        placeholder: "Enter outstanding principal",
        col: 4,
      },
      {
        name: "disbursedAmount",
        label: "Disbursed Amount",
        type: "number",
        placeholder: "Enter disbursed amount",
        col: 4,
      },
      {
        name: "pos",
        label: "POS",
        type: "number",
        placeholder: "Enter POS",
        col: 4,
      },
      {
        name: "tos",
        label: "TOS",
        type: "number",
        placeholder: "Enter TOS",
        col: 4,
      },
      {
        name: "oneMonthEmi",
        label: "1 Month EMI",
        type: "number",
        placeholder: "Enter 1 month EMI",
        col: 4,
      },
      {
        name: "waiverPercent",
        label: "Waiver %",
        type: "number",
        placeholder: "Enter waiver percentage",
        col: 4,
      },
    ],
    [],
  );

  const installmentFields = useMemo(
    () => [
      {
        name: "tenure",
        label: "Tenure",
        type: "number",
        placeholder: "Enter tenure",
        col: 4,
      },
      {
        name: "totalInstallment",
        label: "Total Installment",
        type: "number",
        placeholder: "Enter total installment",
        col: 4,
      },
      {
        name: "installmentPaid",
        label: "Installment Paid",
        type: "number",
        placeholder: "Enter installment paid",
        col: 4,
      },
      {
        name: "pendingEmi",
        label: "Pending EMI",
        type: "number",
        placeholder: "Enter pending EMI",
        col: 4,
      },
      {
        name: "remarks",
        label: "Remarks",
        type: "textarea",
        placeholder: "Enter remarks",
        col: 12,
      },
    ],
    [],
  );

  // ── renderers ──────────────────────────────────────────────────────────────

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

  if (fetchingData) return <PreLoader />;

  const pageTitle =
    mode === "edit"
      ? "Edit Customer"
      : mode === "view"
        ? "View Customer"
        : "Create Customer";

  return (
    <section className="customer-form-container">
      {/* ── page header ── */}
      <div className="page-header-container">
        <div className="page-title-wrap">
          <div className="title-breadcrumb-group">
            <div className="title-with-back">
              <BackButton onClick={() => navigate(-1)} />
              <h4 className="mb-0">{pageTitle}</h4>
            </div>
          </div>
        </div>

        <div className="page-header-actions">
          <Button variant="custom" size="lg" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          {mode !== "view" && (
            <Button
              variant="primary"
              size="lg"
              type="submit"
              form="customer-form"
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

      {/* ── form ── */}
      <form
        id="customer-form"
        onSubmit={handleSubmit(submitCustomer)}
        className="mt-4 customer-form-content"
      >
        {/* Section 1 – Customer Identity */}
        <div className="form-section">
          <h4>Customer Information</h4>
          <Row className="form-group">
            {/* First 4 plain text fields */}
            {renderFormFields(identityFields.slice(0, 4))}

            {/* ── Campaign field with filter button ── */}
            <Col xxl={4} xl={4} lg={4}>
              <div className="input-container">
                <label className="form-label">Campaign</label>
                <div className="campaign-field-row">
                  <Controller
                    name="campaignId"
                    control={control}
                    render={({ field }) => (
                      <SelectInput
                        {...field}
                        options={campaignOptions}
                        placeholder="Select Campaign"
                        disabled={mode === "view"}
                      />
                    )}
                  />

                  {mode !== "view" && (
                    <button
                      type="button"
                      className={`filter-icon-btn ${activeFilterCount > 0 ? "has-filters" : ""}`}
                      onClick={() => setShowFilterCanvas(true)}
                      title="Filter campaigns"
                    >
                      <LuSlidersHorizontal size={16} />
                      {activeFilterCount > 0 && (
                        <span className="filter-dot">{activeFilterCount}</span>
                      )}
                    </button>
                  )}
                </div>
                {errors.campaignId && (
                  <span className="error-message">
                    {errors.campaignId?.message}
                  </span>
                )}
              </div>
            </Col>

            {/* Remaining identity fields */}
            {renderFormFields(identityFields.slice(4))}
          </Row>
        </div>

        {/* Section 2 – Location & Collection */}
        <div className="form-section">
          <h4>Location &amp; Collection Details</h4>
          <Row className="form-group">
            {renderFormFields(locationFields)}
            {renderFormFields(dpdFields)}
          </Row>
        </div>

        {/* Section 3 – Financials */}
        <div className="form-section">
          <h4>Financial Details</h4>
          <Row className="form-group">{renderFormFields(financialFields)}</Row>
        </div>

        {/* Section 4 – Installment & Remarks */}
        <div className="form-section">
          <h4>Installment &amp; Remarks</h4>
          <Row className="form-group">
            {renderFormFields(installmentFields)}
          </Row>
        </div>
      </form>

      {/* ── Campaign Filter Offcanvas ── */}
      <CampaignFilterCanvas
        show={showFilterCanvas}
        onHide={() => setShowFilterCanvas(false)}
        clientOptions={clientOptions}
        teamLeadOptions={teamLeadOptions}
        monthYearOptions={monthYearOptions}
        activeFilters={campaignFilters}
        onApply={(newFilters) => setCampaignFilters(newFilters)}
      />
    </section>
  );
};

export default CustomerForm;
