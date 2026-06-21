import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import FilterBar from "@/components/FilterBar/FilterBar";
import FilterableHeader from "@/components/FilterableHeader/FilterableHeader";
import DeleteModal from "@/components/DeleteModal/DeleteModal";
import {
  deleteTargetApi,
  fetchTargetsApi,
  getTargetApiErrorMessage,
} from "@/features/targets/targetApi";
import { formatCampaignOptionLabel } from "@/features/targets/targetMappers";
import { formatClientRef, toListStatus } from "@/utils/formatters";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import {
  applyAdvancedFilters,
  buildListQueryParams,
  buildUniqueSelectOptions,
  getActiveFiltersCount,
  matchesStatusFilters,
  normalizeListQueryFilters,
} from "@/utils/listFilterHelpers";
import { getNextSortConfig, sortTableRows } from "@/utils/tableSortHelpers";
import {
  buildTargetsFilterConfig,
  TARGET_FILTER_RULES,
} from "@/config/listFilterConfigs";
import "./TargetsList.scss";

const formatCampaignRef = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") return formatCampaignOptionLabel(ref);
  return String(ref);
};

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

const displayValue = (value) => {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length;
  return String(value);
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN");
};

const renderTargetChip = (value, modifier = "") => (
  <span className={`table-field-chip target-field-chip ${modifier}`.trim()}>
    {displayValue(value)}
  </span>
);

const buildColumnOptions = (rows, field, formatter = (value) => value) =>
  buildUniqueSelectOptions(rows, (row) => row[field], (row) =>
    formatter(row[field]),
  );

const TARGET_COLUMN_FILTERS = {
  sno: { field: "_listOrder", filterable: false },
  targetID: { field: "targetID" },
  campaign: { field: "campaign" },
  month: { field: "month" },
  location: { field: "location" },
  state: { field: "state" },
  branch: { field: "branch" },
  bankName: { field: "bankName" },
  product: { field: "product" },
  type: { field: "type" },
  fosCount: { field: "fosCount" },
  tcCount: { field: "tcCount" },
  tlCount: { field: "tlCount" },
  totalCount: { field: "totalCount" },
  collectionTarget: { field: "collectionTarget" },
  targetResolutionPercent: { field: "targetResolutionPercent" },
  rbNrTargetPercent: { field: "rbNrTargetPercent" },
  targetAmount: { field: "targetAmount" },
  achievedCollection: { field: "achievedCollection" },
  targetCases: { field: "targetCases" },
  workingDays: { field: "workingDays" },
  dailyTargetAmount: { field: "dailyTargetAmount" },
  achievedPaidCases: { field: "achievedPaidCases" },
  achievedPTPCases: { field: "achievedPTPCases" },
  achievedResolutionPercent: { field: "achievedResolutionPercent" },
  achievedRbNrPercent: { field: "achievedRbNrPercent" },
  createdAt: { field: "createdAt", formatter: formatDateTime },
  updatedAt: { field: "updatedAt", formatter: formatDateTime },
  status: { field: "status" },
};

const mapTargetRow = (raw, index) => {
  const _id = raw?._id ?? raw?.id ?? raw?.uuid ?? `row_${index}`;
  const targetName = String(
    raw?.entity ??
      raw?.targetName ??
      raw?.target_name ??
      raw?.employeeName ??
      raw?.employee_name ??
      raw?.employeeId?.name ??
      raw?.name ??
      raw?.title ??
      "",
  ).trim();
  const targetID = String(
    raw?.targetID ?? raw?.target_id ?? raw?.targetId ?? raw?.targetCode ?? "",
  ).trim();
  const targetCode = String(
    raw?.targetCode ?? raw?.target_code ?? raw?.code ?? raw?.targetID ?? "",
  ).trim();
  const clientRef =
    raw?.bank ??
    raw?.bank_id ??
    raw?.bankId ??
    raw?.client ??
    raw?.client_id ??
    raw?.clientId;
  const clientName =
    formatClientRef(clientRef) || String(raw?.bankName ?? raw?.bank_name ?? "");
  const clientCode =
    clientRef != null && typeof clientRef === "object"
      ? String(
          clientRef.code ?? clientRef.client_code ?? clientRef.bank_code ?? "",
        )
      : "";
  const campaign = formatCampaignRef(
    raw?.portfolio ??
      raw?.portfolio_id ??
      raw?.portfolioId ??
      raw?.campaign ??
      raw?.campaign_id ??
      raw?.campaignId,
  );
  const product = formatProductRef(
    raw?.product ??
      raw?.product_id ??
      raw?.productId ??
      raw?.product_name ??
      raw?.productName,
  );
  const type = String(
    raw?.type ?? raw?.target_type ?? raw?.targetType ?? "",
  ).toUpperCase();
  const status = toListStatus(raw?.status ?? raw?.is_active ?? raw?.active);

  return {
    ...raw,
    _id: String(_id),
    _listOrder: index,
    targetName,
    targetID,
    targetCode,
    clientName,
    clientCode,
    campaign,
    product,
    type,
    status,
  };
};

const TargetsList = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState([]);
  const [totalTargets, setTotalTargets] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTargets = async () => {
    try {
      setListLoading(true);

      const data = await fetchTargetsApi(
        {
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
      );

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to load targets");
        setTargets([]);
        setTotalTargets(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setTargets(rows.map(mapTargetRow));
      setTotalTargets(total);
    } catch (error) {
      console.error("Failed to fetch targets", error);
      toast.error(getTargetApiErrorMessage(error, "Failed to load targets"));
      setTargets([]);
      setTotalTargets(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters, columnFilters]);

  const handleDeleteClick = (targetId) => {
    setSelectedTargetId(targetId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTargetId) return;

    try {
      setDeleteLoading(true);
      const data = await deleteTargetApi(selectedTargetId);

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to delete target");
        return;
      }

      toast.success(data?.message || "Target deleted successfully");
      fetchTargets();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(getTargetApiErrorMessage(error, "Failed to delete target"));
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedTargetId(null);
    }
  };

  const columns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    { key: "entity", title: "Entity", dataIndex: "entity" },
    {
      key: "targetName",
      title: "Target name",
      render: (_, record) => (
        <div className="target-name-cell">
          <strong>{record.targetName || "—"}</strong>
          {record.targetID ? (
            <span className="target-code">{record.targetID}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "client",
      title: "Client",
      render: (_, record) => (
        <div className="client-cell">
          <strong>{record.clientName || "—"}</strong>
          {record.clientCode ? (
            <span className="client-code">{record.clientCode}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "campaign",
      title: "Campaign",
      render: (_, record) => renderTargetChip(record.campaign, "campaign"),
    },
    {
      key: "product",
      title: "Product",
      render: (_, record) => renderTargetChip(record.product, "product"),
    },
    {
      key: "type",
      title: "Type",
      render: (_, record) => (
        <span className={`type-badge ${record.type?.toLowerCase()}`}>
          {record.type || "—"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_, record) => (
        <span className={`status-badge ${record.status?.toLowerCase()}`}>
          {record.status}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (_, record) => (
        <MoreIcon
          onView={() => navigate(`view/${record._id}`)}
          onEdit={() => navigate(`edit/${record._id}`)}
          onDelete={() => handleDeleteClick(record._id)}
        />
      ),
    },
  ];

  const baseColumns = [
    columns[0],
    {
      key: "targetID",
      title: "Target ID",
      render: (_, record) => (
        <span onClick={() => navigate(`view/${record._id}`)}>
          {renderTargetChip(record.targetID, "target-id")}
        </span>
      ),
    },
    {
      key: "campaign",
      title: "Campaign",
      render: (_, record) =>
        renderTargetChip(
          record.campaign || record.campaignId?.campaignId,
          "campaign",
        ),
    },
    {
      key: "month",
      title: "Month",
      render: (_, record) => renderTargetChip(record.month, "month"),
    },
    {
      key: "location",
      title: "Location",
      render: (_, record) => renderTargetChip(record.location, "location"),
    },
    {
      key: "state",
      title: "State",
      render: (_, record) => renderTargetChip(record.state, "state"),
    },
    {
      key: "branch",
      title: "Branch",
      render: (_, record) => renderTargetChip(record.branch, "branch"),
    },
    {
      key: "bankName",
      title: "Bank",
      render: (_, record) => renderTargetChip(record.bankName, "bank"),
    },
    {
      key: "product",
      title: "Product",
      render: (_, record) => renderTargetChip(record.product, "product"),
    },
    columns.find((column) => column.key === "type"),
    {
      key: "fosCount",
      title: "FOS Count",
      render: (_, record) => renderTargetChip(record.fosCount, "count fos"),
    },
    {
      key: "tcCount",
      title: "TC Count",
      render: (_, record) => renderTargetChip(record.tcCount, "count tc"),
    },
    {
      key: "tlCount",
      title: "TL Count",
      render: (_, record) => renderTargetChip(record.tlCount, "count tl"),
    },
    {
      key: "totalCount",
      title: "Total Count",
      render: (_, record) => renderTargetChip(record.totalCount, "count total"),
    },
    {
      key: "collectionTarget",
      title: "Collection Target",
      render: (_, record) =>
        renderTargetChip(record.collectionTarget, "percent target"),
    },
    {
      key: "targetResolutionPercent",
      title: "Target Resolution %",
      render: (_, record) =>
        renderTargetChip(record.targetResolutionPercent, "percent resolution"),
    },
    {
      key: "rbNrTargetPercent",
      title: "RB/NR Target %",
      render: (_, record) =>
        renderTargetChip(record.rbNrTargetPercent, "percent rbnr"),
    },
    {
      key: "targetAmount",
      title: "Goal 1",
      render: (_, record) => renderTargetChip(record.targetAmount, "money goal"),
    },
    {
      key: "achievedCollection",
      title: "Goal 2",
      render: (_, record) =>
        renderTargetChip(record.achievedCollection, "money achieved"),
    },
    {
      key: "targetCases",
      title: "Target Cases",
      render: (_, record) => renderTargetChip(record.targetCases, "cases"),
    },
    {
      key: "workingDays",
      title: "Working Days",
      render: (_, record) => renderTargetChip(record.workingDays, "days"),
    },
    {
      key: "dailyTargetAmount",
      title: "Daily Target Amount",
      render: (_, record) =>
        renderTargetChip(record.dailyTargetAmount, "money daily"),
    },
    {
      key: "achievedPaidCases",
      title: "Achieved Paid Cases",
      render: (_, record) =>
        renderTargetChip(record.achievedPaidCases, "cases paid"),
    },
    {
      key: "achievedPTPCases",
      title: "Achieved PTP Cases",
      render: (_, record) =>
        renderTargetChip(record.achievedPTPCases, "cases ptp"),
    },
    {
      key: "achievedResolutionPercent",
      title: "Achieved Resolution %",
      render: (_, record) =>
        renderTargetChip(record.achievedResolutionPercent, "percent achieved"),
    },
    {
      key: "achievedRbNrPercent",
      title: "Achieved RB/NR %",
      render: (_, record) =>
        renderTargetChip(record.achievedRbNrPercent, "percent achieved-rbnr"),
    },
    {
      key: "createdAt",
      title: "Created At",
      render: (_, record) => (
        <span className="table-field-chip target-date-chip date">
          {formatDateTime(record.createdAt)}
        </span>
      ),
    },
    {
      key: "updatedAt",
      title: "Updated At",
      render: (_, record) => (
        <span className="table-field-chip target-date-chip date">
          {formatDateTime(record.updatedAt)}
        </span>
      ),
    },
    columns.find((column) => column.key === "status"),
    columns.find((column) => column.key === "actions"),
  ].filter(Boolean);

  const handleColumnFilterChange = (key, values) => {
    setColumnFilters((current) => ({ ...current, [key]: values }));
    setPageNo(1);
  };

  const handleSort = (key) => {
    setSortConfig((current) => getNextSortConfig(current, key));
    setPageNo(1);
  };

  const allColumns = baseColumns.map((column) => {
    const config = TARGET_COLUMN_FILTERS[column.key];
    if (!config) return column;

    return {
      ...column,
      title: (
        <FilterableHeader
          label={column.title}
          filterKey={config.field}
          options={buildColumnOptions(targets, config.field, config.formatter)}
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

  const filteredTargets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return targets.filter((item) => {
      const matchesStatus = matchesStatusFilters(
        filterStatus,
        filters.status,
        item.status,
      );
      const matchesSearch =
        !normalizedSearch ||
        [
          item.targetName,
          item.targetID,
          item.targetCode,
          item.clientName,
          item.clientCode,
          item.campaign,
          item.product,
          item.type,
          item.employeeName,
          item.employeeCode,
          item.location,
          item.state,
          item.branch,
          item.bankName,
          item.month,
          item.notification,
          JSON.stringify(item),
        ].some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );
      const matchesAdvanced = applyAdvancedFilters(
        item,
        filters,
        TARGET_FILTER_RULES,
      );
      const matchesColumns = Object.entries(columnFilters).every(
        ([field, values]) =>
          !values.length || values.includes(String(item[field] ?? "")),
      );

      return matchesStatus && matchesSearch && matchesAdvanced && matchesColumns;
    });
  }, [targets, searchTerm, filterStatus, filters, columnFilters]);

  const buildCsvContent = (rows) => {
    if (!rows.length) return "";

    const headers = [
      "S.No",
      "Target ID",
      "Target Name",
      "Client Name",
      "Client Code",
      "Campaign",
      "Month",
      "Location",
      "State",
      "Branch",
      "Bank",
      "Product",
      "Type",
      "FOS Count",
      "TC Count",
      "TL Count",
      "Total Count",
      "Collection Target",
      "Target Resolution %",
      "RB/NR Target %",
      "Goal 1",
      "Goal 2",
      "Target Cases",
      "Working Days",
      "Daily Target Amount",
      "Achieved Paid Cases",
      "Achieved PTP Cases",
      "Achieved Resolution %",
      "Achieved RB/NR %",
      "Created At",
      "Updated At",
      "Status",
    ];

    const escapeCell = (value) => {
      const cell = value == null || value === "—" ? "" : String(value);
      return `"${cell.replace(/"/g, '""')}"`;
    };

    const rowsData = rows.map((item, index) => [
      index + 1,
      item.targetID ?? "",
      item.targetName ?? "",
      item.clientName ?? "",
      item.clientCode ?? "",
      item.campaign ?? "",
      item.month ?? "",
      item.location ?? "",
      item.state ?? "",
      item.branch ?? "",
      item.bankName ?? "",
      item.product ?? "",
      item.type ?? "",
      item.fosCount ?? "",
      item.tcCount ?? "",
      item.tlCount ?? "",
      item.totalCount ?? "",
      item.collectionTarget ?? "",
      item.targetResolutionPercent ?? "",
      item.rbNrTargetPercent ?? "",
      item.targetAmount ?? "",
      item.achievedCollection ?? "",
      item.targetCases ?? "",
      item.workingDays ?? "",
      item.dailyTargetAmount ?? "",
      item.achievedPaidCases ?? "",
      item.achievedPTPCases ?? "",
      item.achievedResolutionPercent ?? "",
      item.achievedRbNrPercent ?? "",
      formatDateTime(item.createdAt),
      formatDateTime(item.updatedAt),
      item.status ?? "",
    ]);

    return [
      headers.map(escapeCell).join(","),
      ...rowsData.map((row) => row.map(escapeCell).join(",")),
    ].join("\r\n");
  };

  const handleExport = () => {
    if (!filteredTargets.length) {
      toast.info("No goal sheet records available to export.");
      return;
    }

    const csvContent = buildCsvContent(filteredTargets);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "goal-sheets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sortedTargets = useMemo(
    () => sortTableRows(filteredTargets, sortConfig),
    [filteredTargets, sortConfig],
  );

  const totalCount = totalTargets;
  const paginatedData = sortedTargets
    .map((item, index) => ({
      ...item,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const filterConfig = useMemo(
    () => buildTargetsFilterConfig(targets),
    [targets],
  );

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  const activeFiltersCount = useMemo(
    () => getActiveFiltersCount(filters),
    [filters],
  );

  const handleCreate = () => {
    navigate("create");
  };

  return (
    <section className="targets-page-container">
      <PageHeader
        title="Goal Sheet"
        subtitle="View, search and manage all goal sheets"
        exportLabel="Export"
        onExport={handleExport}
        createLabel="Create Goal Sheet"
        onCreate={handleCreate}
      />

      <ListHeader
        searchValue={searchTerm}
        onSearchChange={(event) => {
          setSearchTerm(event.target.value);
          setPageNo(1);
        }}
        selectValue={filterStatus}
        selectOptions={[
          { value: "All", label: "All" },
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ]}
        onSelectChange={(value) => {
          setFilterStatus(value);
          setPageNo(1);
        }}
        searchPlaceholder="Search..."
        onSearch={() => setPageNo(1)}
        onFiltersClick={(e) => setFilterAnchor(e.currentTarget)}
        filterLabel="Filters"
        activeFiltersCount={activeFiltersCount}
        showSearchButton={true}
      />

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
        wrapperClassName="targets-table-wrap"
        className="targets-table"
        columns={allColumns}
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

export default TargetsList;
