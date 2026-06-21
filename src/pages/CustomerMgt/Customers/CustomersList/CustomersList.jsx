import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiCheckSquare, FiDatabase, FiFilter, FiPhone } from "react-icons/fi";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  fetchCustomersApi,
  deleteCustomerApi,
} from "@/features/customers/customerApi";
import { fetchUsersApi } from "@/features/users/userApi";
import { fetchRoleByIdApi } from "@/features/roles/roleApi";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import DeleteModal from "@/components/DeleteModal/DeleteModal";
import FilterBar from "@/components/FilterBar/FilterBar";
import FilterableHeader from "@/components/FilterableHeader/FilterableHeader";
import Button from "@/components/Button/Button";
import CaseMassUpdateModal from "@/components/CaseMassUpdateModal/CaseMassUpdateModal";
import CaseMassDeleteModal from "@/components/CaseMassDeleteModal/CaseMassDeleteModal";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import { getNextSortConfig, sortTableRows } from "@/utils/tableSortHelpers";
import {
  applyAdvancedFilters,
  buildListQueryParams,
  getActiveFiltersCount,
  matchesStatusFilters,
  normalizeListQueryFilters,
} from "@/utils/listFilterHelpers";
import {
  buildCustomersFilterConfig,
  CUSTOMER_FILTER_RULES,
} from "@/config/listFilterConfigs";
import "./CustomersList.scss";

const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

const normalizeMassUpdateFilters = (filters) =>
  Object.entries(filters).reduce((result, [key, value]) => {
    if (Array.isArray(value)) {
      if (value.length === 1) result[key] = value[0];
      else if (value.length > 1) result[key] = value;
    } else if (value != null && value !== "") {
      result[key] = value;
    }
    return result;
  }, {});

const readObjectId = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "object") {
    return String(value._id ?? value.id ?? value.value ?? "");
  }
  return String(value);
};

const normalizePermissionName = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const readModulePermission = (modules, moduleName, permissionName) => {
  if (!Array.isArray(modules)) return null;
  const targetModule = normalizePermissionName(moduleName);
  const targetPermission = normalizePermissionName(permissionName);
  const modulePermission = modules.find(
    (item) =>
      normalizePermissionName(item?.module ?? item?.moduleId ?? item?.name) ===
      targetModule,
  );
  if (!modulePermission) return null;

  const permissions =
    modulePermission?.permissions ??
    modulePermission?.access ??
    modulePermission?.actions ??
    [];

  if (Array.isArray(permissions)) {
    return permissions.some(
      (permission) =>
        normalizePermissionName(
          typeof permission === "object"
            ? permission?.name ?? permission?.permission ?? permission?.action
            : permission,
        ) === targetPermission &&
        (typeof permission !== "object" || permission?.enabled !== false),
    );
  }
  if (permissions && typeof permissions === "object") {
    return Object.entries(permissions).some(
      ([permission, enabled]) =>
        enabled && normalizePermissionName(permission) === targetPermission,
    );
  }
  return false;
};

const getEmbeddedModulePermission = (user, moduleName, permissionName) => {
  const permissionSources = [
    user?.permissions,
    user?.roleId?.permissions,
    user?.role?.permissions,
  ];

  for (const permissions of permissionSources) {
    const result = readModulePermission(
      permissions,
      moduleName,
      permissionName,
    );
    if (result != null) return result;
  }
  return null;
};

const mapFilterToIds = (selectedValues, rows, displayField, getRawValue) => {
  const selected = Array.isArray(selectedValues)
    ? selectedValues
    : selectedValues == null || selectedValues === ""
      ? []
      : [selectedValues];

  return [
    ...new Set(
      rows
        .filter((row) => selected.includes(row[displayField]))
        .map((row) => readObjectId(getRawValue(row._raw)))
        .filter(Boolean),
    ),
  ];
};

const formatCurrency = (value) => {
  if (value == null || value === "") return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
};

const formatNumber = (value) => {
  if (value == null || value === "") return "—";
  return Number(value).toLocaleString("en-IN");
};

const formatPercent = (value) => {
  if (value == null || value === "") return "—";
  return `${Number(value)}%`;
};

const formatCampaignRef = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(
      ref.campaignId ??
      ref.campaign_id ??
      ref.campaignName ??
      ref.campaign_name ??
      ref.name ??
      ref.code ??
      "",
    );
  }
  return String(ref);
};

const formatUserRef = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(
      ref.name ??
      ref.fullName ??
      ref.full_name ??
      ref.firstName ??
      ref.lastName ??
      ref.employeeName ??
      ref.employee_name ??
      ref.username ??
      ref.email ??
      ref._id ??
      "",
    );
  }
  return String(ref);
};

const buildUserMap = (userRows = []) => {
  const map = {};
  const addEntry = (key, name) => {
    const normalized = String(key ?? "").trim();
    if (!normalized || !name) return;
    map[normalized] = name;
  };

  userRows.forEach((user) => {
    const name =
      user?.name ??
      user?.fullName ??
      user?.full_name ??
      user?.username ??
      user?.email ??
      "";
    [
      user?._id,
      user?.id,
      user?.UID,
      user?.code,
      user?.employee_code,
      user?.emp_id,
      user?.employeeId,
      user?.employee_id,
    ].forEach((key) => addEntry(key, name || String(key)));
  });

  return map;
};

const resolveUserName = (value, userMap = {}) => {
  if (!value || value === "—") return "—";
  const key = String(value).trim();
  return userMap[key] || value;
};

const buildColumnOptions = (rows, field) => {
  const values = new Set(
    rows
      .map((row) => row[field])
      .filter((value) => value != null && value !== "" && value !== "â€”")
      .map(String),
  );

  return [...values]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((value) => ({ value, label: value }));
};

const CUSTOMER_COLUMN_FILTERS = {
  name: "name",
  contact: "phone",
  accountNo: "accountNo",
  campaignId: "campaignId",
  client: "clientName",
  product: "product",
  branch: "branch",
  district: "district",
  collType: "collType",
  dpd: "dpd",
  dpdSeg: "dpdSeg",
  outstandingAmt: "outstandingAmt",
  outstandingInterest: "outstandingInterest",
  outstandingPrincipal: "outstandingPrincipal",
  disbursedAmount: "disbursedAmount",
  pos: "pos",
  tos: "tos",
  oneMonthEmi: "oneMonthEmi",
  waiverPercent: "waiverPercent",
  tenure: "tenure",
  totalInstallment: "totalInstallment",
  installmentPaid: "installmentPaid",
  pendingEmi: "pendingEmi",
  teamLead: "teamLead",
};

const renderCustomerChip = (value, modifier = "") => (
  <span className={`table-field-chip customer-field-chip ${modifier}`.trim()}>
    {value == null || value === "" ? "—" : value}
  </span>
);

const mapCustomerRow = (raw, index, userMap = {}) => {
  const campaignRef = raw?.campaignId ?? raw?.campaign_id ?? raw?.campaign;
  const managerRef = formatUserRef(
    raw?.managerId ??
    raw?.manager ??
    raw?.manager_id ??
    (typeof campaignRef === "object" ? campaignRef?.managerId : null),
  );

  return {
    _id: raw?._id ?? `row_${index}`,
    _listOrder: index,
    id: raw?._id ?? `row_${index}`,
    name: raw?.customerName ?? raw?.customer_name ?? "—",
    phone: raw?.contactNumber ?? raw?.customerMobile ?? "—",
    email: raw?.email ?? "—",
    accountNo: raw?.accountNumber ?? raw?.accountId ?? "—",
    campaignId: formatCampaignRef(campaignRef) || "—",
    clientName: raw?.clientId?.bankName ?? "—",
    clientCode: raw?.clientId?.code ?? "—",
    product: raw?.productId?.productName ?? "—",
    productCode: raw?.productId?.code ?? "—",
    outstandingAmt: formatCurrency(raw?.outstandingAmount),
    teamLead: raw?.teamLeaderId?.name ?? "—",
    status: raw?.status ?? (raw?.is_active ? "active" : "inactive"),
    branch: raw?.branchName ?? "—",
    district: raw?.district ?? "—",
    collType: raw?.collType ?? "—",
    pos: raw?.pos != null ? formatNumber(raw.pos) : "—",
    tos: raw?.tos != null ? formatNumber(raw.tos) : "—",
    waiverPercent:
      raw?.waiverPercent != null ? formatPercent(raw.waiverPercent) : "—",
    dpd: raw?.dpd ?? "—",
    dpdSeg: raw?.dpdSeg ?? "—",
    tenure: raw?.tenure ?? "—",
    installmentPaid: raw?.installmentPaid ?? "—",
    pendingEmi: raw?.pendingEmi ?? "—",
    oneMonthEmi: raw?.oneMonthEmi != null ? formatCurrency(raw.oneMonthEmi) : "—",
    totalInstallment: raw?.totalInstallment ?? "—",
    outstandingInterest: formatCurrency(raw?.outstandingInterest),
    outstandingPrincipal: formatCurrency(raw?.outstandingPrincipal),
    disbursedAmount: formatCurrency(raw?.disbursedAmount),

    // ── NEW fields for filters ─────────────────────────────────────────────────

    // 3. Created At
    createdAt: raw?.createdAt ?? null,

    // 4. Latest Disposition — aprilCrm is the most recent CRM disposition
    latestDisposition: raw?.aprilCrm ?? raw?.oldFeedback ?? "—",

    // 6. Allocation Status
    allocationStatus: raw?.allocationStatus ?? "—",

    // 7. Allotted Date — use campaignId.allocatedDate if present, else createdAt
    allottedDate:
      raw?.campaignId?.allocatedDate ??
      raw?.allocatedDate ??
      raw?.createdAt ??
      null,

    // 8. Manager — resolve ID to display name via userMap
    manager: managerRef ? resolveUserName(managerRef, userMap) : "—",

    // 12. Contact Status — contactNoContact from API
    contactStatus: raw?.contactNoContact ?? "—",

    // 13. Cycle
    cycle: raw?.cycle ?? "—",

    // 16. Paid Date
    paidDate: raw?.lastPaidDate ?? null,

    // 17. PTP Date
    ptpDate: raw?.dueDate ?? null,

    // 18. Old / New — vintage (V1, V2 etc.)
    vintage: raw?.vintage ?? "—",

    // 19. Retain / Non Retain
    retainFresh: raw?.retainFresh ?? "—",

    // 20. Recovery Disposition Original — oldFeedback or misCode
    recoveryDisposition: raw?.oldFeedback ?? raw?.misCode ?? "—",

    // 21. State — not a direct API field; parsed from resAddress last segment if needed
    // resAddress example: "...Coimbatore,641654"  → second-last comma segment
    state: (() => {
      const addr = raw?.resAddress ?? "";
      const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
      // Typically: "street, area, city, pincode" — city is second last
      return parts.length >= 2 ? parts[parts.length - 2] : "—";
    })(),

    _raw: raw,
  };
};

const CustomersList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});

  const [customers, setCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedCaseIds, setSelectedCaseIds] = useState([]);
  const [showMassUpdateModal, setShowMassUpdateModal] = useState(false);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
  const [canMassDelete, setCanMassDelete] = useState(
    () =>
      getEmbeddedModulePermission(user, "caseUploadAllocation", "Delete") ??
      false,
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setListLoading(true);
      const [customersResult, usersResult] = await Promise.allSettled([
        fetchCustomersApi({
          ...buildListQueryParams({
            filterStatus,
            searchTerm,
            pageNo,
            rowsPerPage,
            withPagination: true,
          }),
          ...normalizeListQueryFilters(filters),
          ...normalizeListQueryFilters(columnFilters),
        }),
        fetchUsersApi(),
      ]);
      if (customersResult.status === "rejected") throw customersResult.reason;

      const customersData = customersResult.value;
      const usersData =
        usersResult.status === "fulfilled" ? usersResult.value : {};

      if (isApiFailure(customersData)) {
        toast.error(
          customersData?.message ||
          customersData?.error ||
          "Failed to load customers",
        );
        setCustomers([]);
        setTotalCustomers(0);
        return;
      }

      const { rows: userRows } = extractListPayload(usersData ?? {});
      const userMap = buildUserMap(userRows);
      const { rows, total } = extractListPayload(customersData);
      setCustomers(rows.map((raw, index) => mapCustomerRow(raw, index, userMap)));
      setTotalCustomers(total);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load customers";
      toast.error(typeof msg === "string" ? msg : "Failed to load customers");
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters, columnFilters]);

  useEffect(() => {
    const embeddedPermission = getEmbeddedModulePermission(
      user,
      "caseUploadAllocation",
      "Delete",
    );
    if (embeddedPermission != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanMassDelete(embeddedPermission);
      return;
    }

    const roleId = readObjectId(user?.roleId);
    if (!roleId) {
      setCanMassDelete(false);
      return;
    }

    let active = true;
    const loadRolePermission = async () => {
      try {
        const data = await fetchRoleByIdApi(roleId);
        const role = data?.data && !Array.isArray(data.data) ? data.data : data;
        const permission =
          readModulePermission(
            role?.permissions,
            "caseUploadAllocation",
            "Delete",
          ) ?? false;
        if (active) setCanMassDelete(permission);
      } catch {
        if (active) setCanMassDelete(false);
      }
    };

    loadRolePermission();
    return () => {
      active = false;
    };
  }, [user]);

  // ── Export to Excel ────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!filteredCustomers.length) {
      toast.error("No customer records available to export.");
      return;
    }

    const exportRows = filteredCustomers.map((c, index) => ({
      "S.No": index + 1,
      "Name": c.name,
      "Phone": c.phone,
      "Email": c.email,
      "Account No": c.accountNo,
      "Campaign ID": c.campaignId,
      "Client": c.clientName,
      "Client Code": c.clientCode,
      "Product": c.product,
      "Product Code": c.productCode,
      "Branch": c.branch,
      "District": c.district,
      "Collection Type": c.collType,
      "DPD": c.dpd,
      "DPD Segment": c.dpdSeg,
      "Outstanding Amount": c.outstandingAmt,
      "Outstanding Interest": c.outstandingInterest,
      "Outstanding Principal": c.outstandingPrincipal,
      "Disbursed Amount": c.disbursedAmount,
      "POS": c.pos,
      "TOS": c.tos,
      "1 Month EMI": c.oneMonthEmi,
      "Waiver %": c.waiverPercent,
      "Tenure": c.tenure,
      "Total Installment": c.totalInstallment,
      "Installment Paid": c.installmentPaid,
      "Pending EMI": c.pendingEmi,
      "Team Lead": c.teamLead,
      "Status": c.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Auto column widths based on content
    const colWidths = Object.keys(exportRows[0]).map((key) => ({
      wch: Math.max(
        key.length,
        ...exportRows.map((row) => String(row[key] ?? "").length),
      ) + 2,
    }));
    worksheet["!cols"] = colWidths;

    // Style header row bold
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = { font: { bold: true } };
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    const timestamp = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
    XLSX.writeFile(workbook, `customers_${timestamp}.xlsx`);

    toast.success(`Exported ${filteredCustomers.length} customer records`);
  };

  const handleDeleteClick = (id) => {
    setSelectedCustomerId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const data = await deleteCustomerApi(selectedCustomerId);

      if (isApiFailure(data)) {
        toast.error(data?.message || "Failed to delete customer");
        return;
      }

      toast.success(data?.message || "Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to delete customer",
      );
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedCustomerId(null);
    }
  };

  const baseColumns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "name",
      title: "Name",
      render: (_, c) => (
        <span
          className="customer-name-link"
          style={{ cursor: "pointer", color: "#0085ff", fontWeight: 500 }}
          onClick={() =>
            navigate(`/customer-mgt/customers/view/${c._id}`, {
              state: { customer: c },
            })
          }
        >
          {c.name}
        </span>
      ),
    },
    {
      key: "contact",
      title: "Contact",
      render: (_, c) => (
        <div className="contact-cell">
          <span className="contact-item">
            <FiPhone size={14} />
            <span className="customer-phone-link">{c.phone}</span>
          </span>
        </div>
      ),
    },
    {
      key: "accountNo",
      title: "Account No",
      render: (_, c) => renderCustomerChip(c.accountNo, "account"),
    },
    {
      key: "campaignId",
      title: "Campaign ID",
      render: (_, c) =>
        c.campaignId !== "—" ? (
          <span
            className="table-field-chip customer-field-chip campaign campaign-id-link"
            onClick={() =>
              navigate(`/customer-mgt/customers/view/${c._id}`, {
                state: { customer: c },
              })
            }
          >
            {c.campaignId}
          </span>
        ) : (
          renderCustomerChip(c.campaignId, "campaign")
        ),
    },
    {
      key: "client",
      title: "Client",
      render: (_, c) => renderCustomerChip(c.clientName, "client"),
    },
    {
      key: "product",
      title: "Product",
      render: (_, c) => renderCustomerChip(c.product, "product"),
    },
    {
      key: "branch",
      title: "Branch",
      render: (_, c) => renderCustomerChip(c.branch, "branch"),
    },
    {
      key: "district",
      title: "District",
      render: (_, c) => renderCustomerChip(c.district, "district"),
    },
    {
      key: "collType",
      title: "Coll Type",
      render: (_, c) => renderCustomerChip(c.collType, "colltype"),
    },
    {
      key: "dpd",
      title: "DPD",
      render: (_, c) => renderCustomerChip(c.dpd, "dpd"),
    },
    {
      key: "dpdSeg",
      title: "DPD Segment",
      render: (_, c) => renderCustomerChip(c.dpdSeg, "dpd-seg"),
    },
    {
      key: "outstandingAmt",
      title: "Outstanding Amt",
      render: (_, c) => renderCustomerChip(c.outstandingAmt, "money"),
    },
    {
      key: "outstandingInterest",
      title: "Outstanding Interest",
      render: (_, c) => renderCustomerChip(c.outstandingInterest, "money"),
    },
    {
      key: "outstandingPrincipal",
      title: "Outstanding Principal",
      render: (_, c) => renderCustomerChip(c.outstandingPrincipal, "money"),
    },
    {
      key: "disbursedAmount",
      title: "Disbursed Amt",
      render: (_, c) => renderCustomerChip(c.disbursedAmount, "money"),
    },
    {
      key: "pos",
      title: "POS",
      render: (_, c) => renderCustomerChip(c.pos, "pos"),
    },
    {
      key: "tos",
      title: "TOS",
      render: (_, c) => renderCustomerChip(c.tos, "tos"),
    },
    {
      key: "oneMonthEmi",
      title: "1 Month EMI",
      render: (_, c) => renderCustomerChip(c.oneMonthEmi, "money"),
    },
    {
      key: "waiverPercent",
      title: "Waiver %",
      render: (_, c) => renderCustomerChip(c.waiverPercent, "percent"),
    },
    {
      key: "tenure",
      title: "Tenure",
      render: (_, c) => renderCustomerChip(c.tenure, "tenure"),
    },
    {
      key: "totalInstallment",
      title: "Total Installment",
      render: (_, c) => renderCustomerChip(c.totalInstallment, "installment"),
    },
    {
      key: "installmentPaid",
      title: "Installment Paid",
      render: (_, c) => renderCustomerChip(c.installmentPaid, "installment"),
    },
    {
      key: "pendingEmi",
      title: "Pending EMI",
      render: (_, c) => renderCustomerChip(c.pendingEmi, "installment"),
    },
    {
      key: "teamLead",
      title: "Team Lead",
      render: (_, c) => renderCustomerChip(c.teamLead, "teamlead"),
    },
    {
      key: "action",
      title: "Action",

      render: (_, record) => (
        <div className="action-cell">
          <Button
            variant="tertiary"
            size="md"
            className="update-btn"
            onClick={() =>
              navigate("/customer-mgt/allocation/update-status", {
                state: { data: record },
              })
            }
          >
            Update
          </Button>
        </div>
      ),
    },
    {
      key: "more",
      title: "",

      render: (_, record) => (
        <MoreIcon
          onView={() =>
            navigate(`/customer-mgt/customers/view/${record._id}`, {
              state: { customer: record },
            })
          }
          onEdit={() =>
            navigate(`/customer-mgt/customers/edit/${record._id}`, {
              state: { customer: record, mode: "edit" },
            })
          }
          onDelete={() => handleDeleteClick(record._id)}
        />
      ),
    },
  ];

  const handleColumnFilterChange = (key, values) => {
    setColumnFilters((current) => ({ ...current, [key]: values }));
    setPageNo(1);
  };

  const handleSort = (key) => {
    setSortConfig((current) => getNextSortConfig(current, key));
    setPageNo(1);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter((item) => {
    const matchesStatus = matchesStatusFilters(
      filterStatus,
      filters.status,
      item.status,
    );
    const matchesSearch =
      !normalizedSearch ||
      [
        item.name,
        item.accountNo,
        item.campaignId,
        item.email,
        item.phone,
        item.clientName,
        item.product,
        item.branch,
        item.district,
        item.collType,
        item.dpdSeg,
        item.teamLead,
      ].some((value) =>
        String(value).toLowerCase().includes(normalizedSearch),
      );
    const matchesAdvanced = applyAdvancedFilters(
      item,
      filters,
      CUSTOMER_FILTER_RULES,
    );
    const matchesColumns = Object.entries(columnFilters).every(
      ([field, values]) =>
        !values.length || values.includes(String(item[field] ?? "")),
    );

    return matchesStatus && matchesSearch && matchesAdvanced && matchesColumns;
  });
  const sortedCustomers = sortTableRows(filteredCustomers, sortConfig);

  const totalCount = totalCustomers;
  const paginatedData = sortedCustomers
    .map((item, index) => ({
      ...item,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const displayedCaseIds = paginatedData
    .map((row) => row._id)
    .filter((id) => id && !String(id).startsWith("row_"));
  const allDisplayedSelected =
    displayedCaseIds.length > 0 &&
    displayedCaseIds.every((id) => selectedCaseIds.includes(id));

  const toggleDisplayedCases = () => {
    setSelectedCaseIds((current) => {
      if (allDisplayedSelected) {
        return current.filter((id) => !displayedCaseIds.includes(id));
      }
      return [...new Set([...current, ...displayedCaseIds])];
    });
  };

  const toggleCase = (id) => {
    setSelectedCaseIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  };

  const columns = [
    {
      key: "selection",
      title: (
        <label className="checkbox-label">
          <input
            type="checkbox"
            aria-label="Select all displayed cases"
            checked={allDisplayedSelected}
            onChange={toggleDisplayedCases}
          />
          <span></span>
        </label>
      ),
      render: (_, row) => (
        <label className="checkbox-label">
          <input
            type="checkbox"
            aria-label={`Select case ${row._id}`}
            checked={selectedCaseIds.includes(row._id)}
            onChange={() => toggleCase(row._id)}
            disabled={!row._id || String(row._id).startsWith("row_")}
          />
          <span></span>
        </label>
      ),
    },
    ...baseColumns,
  ].map((column) => {
    const field =
      column.key === "sno" ? "_listOrder" : CUSTOMER_COLUMN_FILTERS[column.key];
    if (!field) return column;

    return {
      ...column,
      title: (
        <FilterableHeader
          label={column.title}
          filterKey={field}
          options={buildColumnOptions(customers, field)}
          selectedValues={columnFilters[field] ?? []}
          onFilterChange={handleColumnFilterChange}
          sortKey={field}
          sortConfig={sortConfig}
          onSort={handleSort}
          filterable={column.key !== "sno"}
        />
      ),
    };
  });

  const filterConfig = useMemo(
    () => buildCustomersFilterConfig(customers),
    [customers],
  );
  const activeFiltersCount = useMemo(
    () => getActiveFiltersCount(filters),
    [filters],
  );
  const massActionFilters = useMemo(() => {
    const mappedFilters = {};
    const copyDirectFilter = (key) => {
      if (filters[key] != null && filters[key] !== "") {
        mappedFilters[key] = filters[key];
      }
    };
    const copyMappedIds = (key, values) => {
      if (values.length) mappedFilters[key] = values;
    };

    [
      "campaignId",
      "clientId",
      "productId",
      "collType",
      "allocationStatus",
      "teamLeaderId",
      "telecallerId",
      "uploadBatchId",
      "misCodeId",
    ].forEach(copyDirectFilter);

    copyMappedIds(
      "campaignId",
      mapFilterToIds(filters.campaignId, customers, "campaignId", (raw) =>
        raw?.campaignId ?? raw?.campaign_id ?? raw?.campaign,
      ),
    );
    copyMappedIds(
      "clientId",
      mapFilterToIds(filters.clientName, customers, "clientName", (raw) =>
        raw?.clientId ?? raw?.client_id ?? raw?.client,
      ),
    );
    copyMappedIds(
      "productId",
      mapFilterToIds(filters.product, customers, "product", (raw) =>
        raw?.productId ?? raw?.product_id ?? raw?.product,
      ),
    );
    copyMappedIds(
      "teamLeaderId",
      mapFilterToIds(filters.teamLead, customers, "teamLead", (raw) =>
        raw?.teamLeaderId ?? raw?.team_leader_id,
      ),
    );

    return normalizeMassUpdateFilters(mappedFilters);
  }, [customers, filters]);
  const hasMassActionScope =
    selectedCaseIds.length > 0 || Object.keys(massActionFilters).length > 0;
  const massActionFilterCount = Object.keys(massActionFilters).length;
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setSelectedCaseIds([]);
    setPageNo(1);
  };

  const handleMassUpdateSuccess = async () => {
    setShowMassUpdateModal(false);
    setSelectedCaseIds([]);
    await fetchCustomers();
  };

  const handleMassDeleteSuccess = async () => {
    setShowMassDeleteModal(false);
    setSelectedCaseIds([]);
    await fetchCustomers();
  };

  return (
    <section className="customers-page-container">
      <PageHeader
        title="Customers"
        subtitle="View, search and manage all Customer records"
        breadcrumbItems={[{ label: "Home" }, { label: "Customers" }]}
        exportLabel="Export"
        onExport={handleExport}
      />

      <div className="customer-case-count-strip" aria-label="Case count summary">
        <div className="case-count-main">
          <span className="case-count-icon">
            <FiDatabase />
          </span>
          <div>
            <span className="case-count-label">Total Cases</span>
            <strong>{formatCount(totalCustomers)}</strong>
          </div>
        </div>
        <div className="case-count-divider" />
        <div className="case-count-metric">
          <FiFilter />
          <span>
            <strong>{formatCount(totalCount)}</strong>
            <small>matching filters</small>
          </span>
        </div>
        <div className="case-count-metric">
          <FiCheckSquare />
          <span>
            <strong>{formatCount(selectedCaseIds.length)}</strong>
            <small>selected</small>
          </span>
        </div>
      </div>

      <ListHeader
        selectValue={filterStatus}
        selectOptions={[
          { value: "All", label: "All" },

        ]}
        onSelectChange={(value) => {
          setFilterStatus(value);
          setPageNo(1);
        }}
        searchValue={searchTerm}
        onSearchChange={(event) => {
          setSearchTerm(event.target.value);
          setPageNo(1);
        }}
        searchPlaceholder="Search..."
        onFiltersClick={(e) => setFilterAnchor(e.currentTarget)}
        filterLabel="Filters"
        activeFiltersCount={activeFiltersCount}
      />

      <div className="customer-mass-update-toolbar">
        <span>
          {selectedCaseIds.length
            ? `${selectedCaseIds.length} case(s) selected`
            : massActionFilterCount
              ? `${massActionFilterCount} mass-action filter(s) applied`
              : "Select cases or apply a supported filter to enable mass actions"}
        </span>
        <div className="customer-mass-actions">
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowMassUpdateModal(true)}
            disabled={!hasMassActionScope}
          >
            Mass Update
          </Button>
          {canMassDelete && (
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowMassDeleteModal(true)}
              disabled={!hasMassActionScope || selectedCaseIds.length > 5000}
            >
              Mass Delete
            </Button>
          )}
        </div>
      </div>

      <FilterBar
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        config={filterConfig}
        filters={filters}
        onApply={handleApplyFilters}
        showButton={false}
      />

      <DataTable
        rowKey="_id"
        wrapperClassName="customers-table-wrap"
        className="customers-table"
        columns={columns}
        data={paginatedData}
        loading={listLoading}
        showScrollControls
      />

      <DeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCustomerId(null);
        }}
        onDelete={handleConfirmDelete}
        loading={deleteLoading}
      />

      <CaseMassUpdateModal
        show={showMassUpdateModal}
        onClose={() => setShowMassUpdateModal(false)}
        selectedCaseIds={selectedCaseIds}
        filters={massActionFilters}
        onSuccess={handleMassUpdateSuccess}
      />

      {canMassDelete && (
        <CaseMassDeleteModal
          show={showMassDeleteModal}
          onClose={() => setShowMassDeleteModal(false)}
          selectedCaseIds={selectedCaseIds}
          filters={massActionFilters}
          onSuccess={handleMassDeleteSuccess}
        />
      )}

      <CustomPagination
        pageNo={pageNo}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPageNo}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPageNo(1);
        }}
      />

      <Outlet />
    </section>
  );
};

export default CustomersList;
