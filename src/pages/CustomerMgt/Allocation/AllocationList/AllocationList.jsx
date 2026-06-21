import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiCheckSquare, FiDatabase, FiFilter } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";
import CAMPAIGN_ENDPOINTS from "@/api/endpoints/campaignEndpoints";
import USER_ENDPOINTS from "@/api/endpoints/userEndpoints";
import { fetchRoleByIdApi } from "@/features/roles/roleApi";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import FilterBar from "@/components/FilterBar/FilterBar";
import FilterableHeader from "@/components/FilterableHeader/FilterableHeader";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import DeleteModal from "@/components/DeleteModal/DeleteModal";
import Button from "@/components/Button/Button";
import CampaignMassDeleteModal from "@/components/CampaignMassDeleteModal/CampaignMassDeleteModal";
import {
  formatClientRef,
  formatDisplayDate,
  toListStatus,
} from "@/utils/formatters";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import { getNextSortConfig, sortTableRows } from "@/utils/tableSortHelpers";
import {
  applyAdvancedFilters,
  buildListQueryParams,
  buildUniqueSelectOptions,
  getActiveFiltersCount,
  matchesStatusFilters,
  normalizeListQueryFilters,
} from "@/utils/listFilterHelpers";
import {
  buildAllocationsFilterConfig,
  ALLOCATION_FILTER_RULES,
} from "@/config/listFilterConfigs";
import "./AllocationList.scss";

const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

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
  for (const permissions of [
    user?.permissions,
    user?.roleId?.permissions,
    user?.role?.permissions,
  ]) {
    const result = readModulePermission(permissions, moduleName, permissionName);
    if (result != null) return result;
  }
  return null;
};

const normalizeMassDeleteFilters = (filters) =>
  Object.entries(filters).reduce((result, [key, value]) => {
    const normalizedValue =
      key === "status"
        ? Array.isArray(value)
          ? value.map((item) => String(item).toLowerCase())
          : String(value ?? "").toLowerCase()
        : value;

    if (Array.isArray(normalizedValue)) {
      if (normalizedValue.length === 1) result[key] = normalizedValue[0];
      else if (normalizedValue.length > 1) result[key] = normalizedValue;
    } else if (normalizedValue != null && normalizedValue !== "") {
      result[key] = normalizedValue;
    }
    return result;
  }, {});

const mapFilterValuesToIds = (values, rows, displayField, idField) => {
  const selected = Array.isArray(values)
    ? values
    : values == null || values === ""
      ? []
      : [values];

  return [
    ...new Set(
      rows
        .filter((row) => selected.includes(row[displayField]))
        .map((row) => row[idField])
        .filter(Boolean),
    ),
  ];
};

const CAMPAIGN_MASS_FILTER_RULES = [
  { key: "campaignId", getValue: (row) => row.id },
  { key: "approvalStatus", getValue: (row) => row.approvalStatus },
  { key: "managerId", getValue: (row) => row.managerId },
  { key: "teamLeaderId", getValue: (row) => row.teamLeaderId },
  { key: "createdBy", getValue: (row) => row.createdBy },
];

const formatProductRef = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(
      ref.productName ??
      ref.product_name ??
      ref.name ??
      ref.code ??
      ref.productCode ??
      "",
    );
  }
  return String(ref);
};

const formatBranchRef = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(ref.branch ?? ref.branch_name ?? ref.name ?? ref.code ?? "");
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

const formatNumber = (value) => {
  if (value == null || value === "") return "-";
  return Number.isFinite(Number(value))
    ? Number(value).toLocaleString("en-IN")
    : String(value);
};

const buildColumnOptions = (rows, field, formatter = (value) => value) => {
  const values = new Map();
  rows.forEach((row) => {
    const value = row[field];
    if (value == null || value === "") return;
    values.set(String(value), String(formatter(value)));
  });

  return [...values.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }))
    .map(([value, label]) => ({ value, label }));
};

const ALLOCATION_COLUMN_FILTERS = {
  sno: { field: "_listOrder", filterable: false },
  name: { field: "id" },
  allocatedDate: { field: "allocatedDate", formatter: formatDisplayDate },
  closingDate: { field: "allocationClosingDate", formatter: formatDisplayDate },
  allocationType: { field: "allocationType" },
  am: { field: "assistantManagerId" },
  manager: { field: "managerId" },
  tl: { field: "teamLeaderId" },
  client: { field: "clientName" },
  type: { field: "type" },
  product: { field: "product" },
  workingDays: { field: "workingDays" },
  resolutionTarget: { field: "resolutionTarget" },
  nrrbTarget: { field: "nrrbTarget" },
  ceTarget: { field: "ceTarget" },
  moneyCollectionTarget: { field: "moneyCollectionTarget" },
  status: { field: "status" },
};

const renderAllocationChip = (value, modifier = "") => (
  <span className={`table-field-chip allocation-field-chip ${modifier}`.trim()}>
    {value == null || value === "" ? "—" : value}
  </span>
);

const mapAllocationRow = (raw, index) => {
  const _id = raw?._id ?? raw?.id ?? raw?.uuid ?? `row_${index}`;
  const campaignId =
    raw?.campaignId ??
    raw?.campaign_id ??
    raw?.code ??
    raw?.campaign_code ??
    _id;
  const clientRef = raw?.client ?? raw?.client_id ?? raw?.clientId;
  const clientName = formatClientRef(clientRef);
  const clientCode =
    clientRef != null && typeof clientRef === "object"
      ? String(
        clientRef.code ?? clientRef.client_code ?? clientRef.bank_code ?? "",
      )
      : "";
  const branch = formatBranchRef(
    raw?.branch ?? raw?.branch_id ?? raw?.branchId ?? raw?.branch_name,
  );
  const product = formatProductRef(
    raw?.product ?? raw?.product_id ?? raw?.productId ?? raw?.product_name,
  );
  const type = String(
    raw?.type ?? raw?.campaign_type ?? raw?.campaignType ?? "",
  ).toUpperCase();
  const status = toListStatus(raw?.status ?? raw?.is_active ?? raw?.active);

  return {
    _id: String(_id),
    _listOrder: index,
    id: String(campaignId),
    clientObjectId: readObjectId(clientRef),
    productObjectId: readObjectId(
      raw?.product ?? raw?.product_id ?? raw?.productId,
    ),
    assistantManagerObjectId: readObjectId(
      raw?.assistantManagerId ??
      raw?.assistantManager ??
      raw?.assistant_manager_id ??
      raw?.assistant_manager,
    ),
    managerObjectId: readObjectId(
      raw?.managerId ?? raw?.manager ?? raw?.manager_id ?? raw?.allocationBy,
    ),
    teamLeaderObjectId: readObjectId(
      raw?.teamLeaderId ??
      raw?.teamLeader ??
      raw?.team_leader_id ??
      raw?.team_leader ??
      raw?.tlId ??
      raw?.tl,
    ),
    createdByObjectId: readObjectId(
      raw?.createdBy ?? raw?.created_by ?? raw?.creator,
    ),
    createdBy: formatUserRef(raw?.createdBy ?? raw?.created_by ?? raw?.creator),
    approvalStatus: raw?.approvalStatus ?? raw?.approval_status ?? "",
    allocatedDate: raw?.allocatedDate ?? raw?.allocated_date,
    allocationClosingDate:
      raw?.allocationClosingDate ?? raw?.allocation_closing_date,
    allocationType: raw?.allocationType ?? raw?.allocation_type ?? "",
    // FIX: also check allocationBy as fallback for managerId
    assistantManagerId: formatUserRef(
      raw?.assistantManagerId ??
      raw?.assistantManager ??
      raw?.assistant_manager_id ??
      raw?.assistant_manager,
    ),
    managerId: formatUserRef(
      raw?.managerId ?? raw?.manager ?? raw?.manager_id ?? raw?.allocationBy,
    ),
    teamLeaderId: formatUserRef(
      raw?.teamLeaderId ??
      raw?.teamLeader ??
      raw?.team_leader_id ??
      raw?.team_leader ??
      raw?.tlId ??
      raw?.tl,
    ),
    clientName,
    clientCode,
    branch,
    product,
    type,
    workingDays: raw?.workingDays ?? raw?.working_days,
    resolutionTarget: raw?.resolutionTarget ?? raw?.resolution_target,
    nrrbTarget: raw?.nrrbTarget ?? raw?.nrrb_target,
    ceTarget: raw?.ceTarget ?? raw?.ce_target,
    moneyCollectionTarget:
      raw?.moneyCollectionTarget ?? raw?.money_collection_target,
    status,
    createdAt: raw?.createdAt ?? raw?.created_at ?? null,
    monthYear: raw?.monthYear ?? raw?.month_year ?? "",
    totalPaidAmount: raw?.totalPaidAmount ?? raw?.total_paid_amount ?? 0,
  };
};

const AllocationList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const [allocations, setAllocations] = useState([]);
  const [totalAllocations, setTotalAllocations] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
  const [canMassDelete, setCanMassDelete] = useState(
    () =>
      getEmbeddedModulePermission(user, "campaignManagement", "Delete") ??
      false,
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAllocationId, setSelectedAllocationId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAllocations = async () => {
    try {
      setListLoading(true);

      const [campaignResult, usersResult] = await Promise.allSettled([
        axiosInstance.get(CAMPAIGN_ENDPOINTS.LIST, {
          params: {
            ...buildListQueryParams({
              filterStatus,
              searchTerm,
              pageNo,
              rowsPerPage,
              withPagination: true,
            }),
            ...normalizeListQueryFilters(filters),
            ...normalizeListQueryFilters(columnFilters),
          },
        }),
        axiosInstance.get(USER_ENDPOINTS.LIST),
      ]);
      if (campaignResult.status === "rejected") throw campaignResult.reason;

      const data = campaignResult.value.data;

      if (isApiFailure(data)) {
        toast.error(
          data?.message || data?.error || "Failed to load allocations",
        );
        setAllocations([]);
        setTotalAllocations(0);
        return;
      }

      const usersData =
        usersResult.status === "fulfilled" ? usersResult.value.data : {};
      const { rows: userRows } = extractListPayload(usersData ?? {});
      const userMap = {};
      userRows.forEach((u) => {
        const id = String(u._id ?? u.id ?? "");
        if (id)
          userMap[id] = u.name ?? u.fullName ?? u.full_name ?? u.email ?? id;
      });

      const resolve = (val) => {
        if (!val) return "";
        if (/^[a-f0-9]{24}$/i.test(val)) return userMap[val] || val;
        return val;
      };

      const { rows, total } = extractListPayload(data);
      setAllocations(
        rows.map((raw, index) => {
          const row = mapAllocationRow(raw, index);
          return {
            ...row,
            managerId: resolve(row.managerId),
            assistantManagerId: resolve(row.assistantManagerId),
            teamLeaderId: resolve(row.teamLeaderId),
          };
        }),
      );
      setTotalAllocations(total);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load allocations";
      toast.error(typeof msg === "string" ? msg : "Failed to load allocations");
      setAllocations([]);
      setTotalAllocations(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters, columnFilters]);

  useEffect(() => {
    const embeddedPermission = getEmbeddedModulePermission(
      user,
      "campaignManagement",
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
          readModulePermission(role?.permissions, "campaignManagement", "Delete") ??
          false;
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

  const handleDeleteClick = (id) => {
    setSelectedAllocationId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await axiosInstance.delete(
        CAMPAIGN_ENDPOINTS.DELETE(selectedAllocationId),
      );

      if (isApiFailure(response.data)) {
        toast.error(response.data?.message || "Failed to delete allocation");
        return;
      }

      toast.success(
        response.data?.message || "Allocation deleted successfully",
      );
      fetchAllocations();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to delete allocation",
      );
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedAllocationId(null);
    }
  };

  const buildCsvContent = (rows) => {
    if (!rows.length) return "";

    const headers = [
      "S.No",
      "Campaign ID",
      "Allocated Date",
      "Closing Date",
      "Allocation Type",
      "AM",
      "Manager",
      "TL",
      "Client Name",
      "Client Code",
      "Type",
      "Branch",
      "Product",
      "Working Days",
      "Resolution Target",
      "NRRB Target",
      "CE Target",
      "Money Collection Target",
      "Status",
    ];

    const escapeCell = (value) => {
      const cell = value == null ? "" : String(value);
      return `"${cell.replace(/"/g, '""')}"`;
    };

    const rowsData = rows.map((item, index) => [
      index + 1,
      item.id,
      formatDisplayDate(item.allocatedDate),
      formatDisplayDate(item.allocationClosingDate),
      item.allocationType,
      item.assistantManagerId,
      item.managerId,
      item.teamLeaderId,
      item.clientName,
      item.clientCode,
      item.type,
      // item.branch,
      item.product,
      item.workingDays,
      item.resolutionTarget,
      item.nrrbTarget,
      item.ceTarget,
      item.moneyCollectionTarget,
      item.status,
    ]);

    return [
      headers.map(escapeCell).join(","),
      ...rowsData.map((row) => row.map(escapeCell).join(",")),
    ].join("\r\n");
  };

  const handleExport = () => {
    if (!filteredAllocations.length) {
      toast.info("No allocation records available to export.");
      return;
    }

    const csvContent = buildCsvContent(filteredAllocations);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "allocations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const baseColumns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "name",
      title: "Campaign ID",
      render: (_, allocation) =>
        allocation.id ? (
          <span
            className="table-field-chip allocation-field-chip campaign campaign-id-link"
            onClick={() => navigate(`view/${allocation._id}`)}
          >
            {allocation.id}
          </span>
        ) : (
          renderAllocationChip(allocation.id, "campaign")
        ),
    },
    {
      key: "allocatedDate",
      title: "Allocated Date",
      render: (_, allocation) =>
        renderAllocationChip(
          formatDisplayDate(allocation.allocatedDate),
          "date",
        ),
    },
    {
      key: "closingDate",
      title: "Closing Date",
      render: (_, allocation) =>
        renderAllocationChip(
          formatDisplayDate(allocation.allocationClosingDate),
          "date closing",
        ),
    },
    {
      key: "allocationType",
      title: "Allocation Type",
      render: (_, allocation) =>
        renderAllocationChip(allocation.allocationType, "allocation-type"),
    },
    {
      key: "am",
      title: "AM",
      render: (_, allocation) =>
        renderAllocationChip(allocation.assistantManagerId, "person am"),
    },
    {
      key: "manager",
      title: "Manager",
      render: (_, allocation) =>
        renderAllocationChip(allocation.managerId, "person manager"),
    },
    {
      key: "tl",
      title: "TL",
      render: (_, allocation) =>
        renderAllocationChip(allocation.teamLeaderId, "person tl"),
    },
    {
      key: "client",
      title: "Client",
      render: (_, allocation) => (
        <div className="client-cell">
          <strong>{allocation.clientName || "—"}</strong>
          {allocation.clientCode ? (
            <span className="client-code">{allocation.clientCode}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (_, allocation) => (
        <span className={`type-badge ${allocation.type?.toLowerCase()}`}>
          {allocation.type || "—"}
        </span>
      ),
    },
    // {
    //   key: "branch",
    //   title: "Branch",
    //   render: (_, allocation) => renderAllocationChip(allocation.branch, "branch"),
    // },
    {
      key: "product",
      title: "Product",
      render: (_, allocation) =>
        renderAllocationChip(allocation.product, "product"),
    },
    {
      key: "workingDays",
      title: "Working Days",
      render: (_, allocation) =>
        renderAllocationChip(formatNumber(allocation.workingDays), "days"),
    },
    {
      key: "resolutionTarget",
      title: "Resolution Target",
      render: (_, allocation) =>
        renderAllocationChip(
          formatNumber(allocation.resolutionTarget),
          "target resolution",
        ),
    },
    {
      key: "nrrbTarget",
      title: "NRRB Target",
      render: (_, allocation) =>
        renderAllocationChip(
          formatNumber(allocation.nrrbTarget),
          "target nrrb",
        ),
    },
    {
      key: "ceTarget",
      title: "CE Target",
      render: (_, allocation) =>
        renderAllocationChip(formatNumber(allocation.ceTarget), "target ce"),
    },
    {
      key: "moneyCollectionTarget",
      title: "Money Collection Target",
      render: (_, allocation) =>
        renderAllocationChip(
          formatNumber(allocation.moneyCollectionTarget),
          "money",
        ),
    },
    {
      key: "status",
      title: "Status",
      render: (_, allocation) => (
        <span className={`status-badge ${allocation.status?.toLowerCase()}`}>
          {allocation.status}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (_, allocation) => (
        <MoreIcon
          onView={() => navigate(`view/${allocation._id}`)}
          onEdit={() => navigate(`edit/${allocation._id}`)}
          onDelete={() => handleDeleteClick(allocation._id)}
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

  const decoratedColumns = baseColumns.map((column) => {
    const config = ALLOCATION_COLUMN_FILTERS[column.key];
    if (!config) return column;

    return {
      ...column,
      title: (
        <FilterableHeader
          label={column.title}
          filterKey={config.field}
          options={buildColumnOptions(
            allocations,
            config.field,
            config.formatter,
          )}
          selectedValues={columnFilters[config.field] ?? []}
          onFilterChange={handleColumnFilterChange}
          sortKey={config.field}
          sortConfig={sortConfig}
          onSort={handleSort}
          filterable={config.filterable !== false}
        />
      ),
    };
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredAllocations = allocations.filter((item) => {
    const matchesStatus = matchesStatusFilters(
      filterStatus,
      filters.status,
      item.status,
    );
    const matchesSearch =
      !normalizedSearch ||
      [
        item.id,
        item.clientName,
        item.clientCode,
        item.branch,
        item.product,
        item.type,
        item.allocationType,
        item.assistantManagerId,
        item.managerId,
        item.teamLeaderId,
      ].some((value) =>
        String(value).toLowerCase().includes(normalizedSearch),
      );
    const matchesAdvanced = applyAdvancedFilters(
      item,
      filters,
      ALLOCATION_FILTER_RULES,
    );
    const matchesCampaignAdvanced = applyAdvancedFilters(
      item,
      filters,
      CAMPAIGN_MASS_FILTER_RULES,
    );
    const matchesColumns = Object.entries(columnFilters).every(
      ([field, values]) =>
        !values.length || values.includes(String(item[field] ?? "")),
    );

    return (
      matchesStatus &&
      matchesSearch &&
      matchesAdvanced &&
      matchesCampaignAdvanced &&
      matchesColumns
    );
  });
  const sortedAllocations = sortTableRows(filteredAllocations, sortConfig);

  const totalCount = totalAllocations;
  const paginatedData = sortedAllocations
    .map((item, index) => ({
      ...item,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const displayedCampaignIds = paginatedData
    .map((row) => row._id)
    .filter((id) => id && !String(id).startsWith("row_"));
  const allDisplayedSelected =
    displayedCampaignIds.length > 0 &&
    displayedCampaignIds.every((id) => selectedCampaignIds.includes(id));

  const toggleDisplayedCampaigns = () => {
    setSelectedCampaignIds((current) => {
      if (allDisplayedSelected) {
        return current.filter((id) => !displayedCampaignIds.includes(id));
      }
      return [...new Set([...current, ...displayedCampaignIds])];
    });
  };

  const toggleCampaign = (id) => {
    setSelectedCampaignIds((current) =>
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
            aria-label="Select all displayed campaigns"
            checked={allDisplayedSelected}
            onChange={toggleDisplayedCampaigns}
          />
          <span></span>
        </label>
      ),
      render: (_, row) => (
        <label className="checkbox-label">
          <input
            type="checkbox"
            aria-label={`Select campaign ${row.id}`}
            checked={selectedCampaignIds.includes(row._id)}
            onChange={() => toggleCampaign(row._id)}
            disabled={!row._id || String(row._id).startsWith("row_")}
          />
          <span></span>
        </label>
      ),
    },
    ...decoratedColumns,
  ];

  const filterConfig = useMemo(
    () => [
      ...buildAllocationsFilterConfig(allocations),
      {
        key: "campaignId",
        label: "Campaign ID",
        type: "select",
        multiple: true,
        options: buildUniqueSelectOptions(allocations, (row) => row.id),
      },
      {
        key: "approvalStatus",
        label: "Approval Status",
        type: "select",
        multiple: true,
        options: buildUniqueSelectOptions(
          allocations,
          (row) => row.approvalStatus,
        ),
      },
      {
        key: "managerId",
        label: "Manager",
        type: "select",
        multiple: true,
        options: buildUniqueSelectOptions(allocations, (row) => row.managerId),
      },
      {
        key: "teamLeaderId",
        label: "Team Leader",
        type: "select",
        multiple: true,
        options: buildUniqueSelectOptions(
          allocations,
          (row) => row.teamLeaderId,
        ),
      },
      {
        key: "createdBy",
        label: "Created By",
        type: "select",
        multiple: true,
        options: buildUniqueSelectOptions(allocations, (row) => row.createdBy),
      },
    ].filter((field) => field.type !== "select" || field.options?.length),
    [allocations],
  );

  const activeFiltersCount = useMemo(
    () => getActiveFiltersCount(filters),
    [filters],
  );

  const massDeleteFilters = useMemo(() => {
    const mappedFilters = {};
    const copyDirect = (targetKey, value) => {
      if (
        value != null &&
        value !== "" &&
        (!Array.isArray(value) || value.length)
      ) {
        mappedFilters[targetKey] = value;
      }
    };
    const copyIds = (targetKey, values, displayField, idField) => {
      const ids = mapFilterValuesToIds(
        values,
        allocations,
        displayField,
        idField,
      );
      if (ids.length) mappedFilters[targetKey] = ids;
    };

    copyDirect("type", filters.type);
    copyDirect(
      "campaignId",
      filters.campaignId?.length ? filters.campaignId : columnFilters.id,
    );
    copyDirect("monthYear", filters.monthYear);
    copyDirect(
      "status",
      filterStatus === "All" ? filters.status : filterStatus,
    );
    copyDirect("approvalStatus", filters.approvalStatus);

    copyIds("clientId", filters.clientName, "clientName", "clientObjectId");
    copyIds("productId", filters.product, "product", "productObjectId");
    copyIds(
      "assistantManagerId",
      filters.assistantManagerId,
      "assistantManagerId",
      "assistantManagerObjectId",
    );
    copyIds(
      "managerId",
      filters.managerId?.length ? filters.managerId : columnFilters.managerId,
      "managerId",
      "managerObjectId",
    );
    copyIds(
      "teamLeaderId",
      filters.teamLeaderId?.length
        ? filters.teamLeaderId
        : columnFilters.teamLeaderId,
      "teamLeaderId",
      "teamLeaderObjectId",
    );
    copyIds("createdBy", filters.createdBy, "createdBy", "createdByObjectId");
    return normalizeMassDeleteFilters(mappedFilters);
  }, [allocations, columnFilters, filterStatus, filters]);

  const hasMassDeleteScope =
    selectedCampaignIds.length > 0 || Object.keys(massDeleteFilters).length > 0;

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setSelectedCampaignIds([]);
    setPageNo(1);
  };

  const handleMassDeleteSuccess = async () => {
    setShowMassDeleteModal(false);
    setSelectedCampaignIds([]);
    await fetchAllocations();
  };

  const handleCreate = () => {
    navigate("create");
  };

  return (
    <section className="allocation-page-container">
      <PageHeader
        title="Allocation"
        subtitle="View, search and manage all Allocation records"
        breadcrumbItems={[{ label: "Home" }, { label: "Allocation" }]}
        exportLabel="Export"
        onExport={handleExport}
        createLabel="Create Allocation"
        onCreate={handleCreate}
      />

      <div className="allocation-count-strip" aria-label="Allocation count summary">
        <div className="allocation-count-main">
          <span className="allocation-count-icon">
            <FiDatabase />
          </span>
          <div>
            <span className="allocation-count-label">Total Allocations</span>
            <strong>{formatCount(totalAllocations)}</strong>
          </div>
        </div>
        <div className="allocation-count-divider" />
        <div className="allocation-count-metric">
          <FiFilter />
          <span>
            <strong>{formatCount(totalCount)}</strong>
            <small>matching filters</small>
          </span>
        </div>
        <div className="allocation-count-metric">
          <FiCheckSquare />
          <span>
            <strong>{formatCount(selectedCampaignIds.length)}</strong>
            <small>selected</small>
          </span>
        </div>
      </div>

      <ListHeader
        selectValue={filterStatus}
        selectOptions={[
          { value: "All", label: "All" },
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ]}
        onSelectChange={(value) => {
          setFilterStatus(value);
          setSelectedCampaignIds([]);
          setPageNo(1);
        }}
        searchValue={searchTerm}
        onSearchChange={(event) => {
          setSearchTerm(event.target.value);
          setPageNo(1);
        }}
        searchPlaceholder="Search..."
        onSearch={() => setPageNo(1)}
        showSearchButton={true}
        onFiltersClick={(e) => setFilterAnchor(e.currentTarget)}
        filterLabel="Filters"
        activeFiltersCount={activeFiltersCount}
      />

      {canMassDelete && (
        <div className="allocation-mass-delete-toolbar">
          <span>
            {selectedCampaignIds.length
              ? `${selectedCampaignIds.length} campaign(s) selected`
              : Object.keys(massDeleteFilters).length
                ? `${Object.keys(massDeleteFilters).length} supported filter(s) applied`
                : "Select campaigns or apply a supported filter to enable mass delete"}
          </span>
          <Button
            variant="danger"
            size="md"
            onClick={() => setShowMassDeleteModal(true)}
            disabled={!hasMassDeleteScope}
          >
            Mass Delete
          </Button>
        </div>
      )}

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
        wrapperClassName="allocation-table-wrap"
        className="allocation-table"
        columns={columns}
        data={paginatedData}
        loading={listLoading}
        showScrollControls
      />

      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleConfirmDelete}
        loading={deleteLoading}
      />

      {canMassDelete && (
        <CampaignMassDeleteModal
          show={showMassDeleteModal}
          onClose={() => setShowMassDeleteModal(false)}
          selectedCampaignIds={selectedCampaignIds}
          filters={massDeleteFilters}
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

export default AllocationList;
