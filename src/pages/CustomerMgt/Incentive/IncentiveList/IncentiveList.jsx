import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import Button from "@/components/Button/Button";
import FilterBar from "@/components/FilterBar/FilterBar";
import FilterableHeader from "@/components/FilterableHeader/FilterableHeader";
import "./IncentiveList.scss";
import UploadModal from "@/components/UploadModal/UploadModal";
import SlapCalculateModal from "@/components/SlapCalculateModal/SlapCalculateModal";
import { MdOutlineCalculate } from "react-icons/md";
import { LuUpload, LuDownload } from "react-icons/lu";
import axiosInstance from "@/utils/axiosInstance";
import INCENTIVE_ENDPOINTS from "@/api/endpoints/incentiveEndpoints";
import CAMPAIGN_ENDPOINTS from "@/api/endpoints/campaignEndpoints";
import toast from "react-hot-toast";
import {
  applyAdvancedFilters,
  matchesStatusFilters,
  buildUniqueSelectOptions,
  getActiveFiltersCount,
} from "@/utils/listFilterHelpers";
import { extractListPayload } from "@/utils/apiHelpers";
import { getNextSortConfig, sortTableRows } from "@/utils/tableSortHelpers";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const ACCEPTED_MIME_TYPES =
  "text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const INCENTIVE_FILTER_RULES = [
  { key: "status", getValue: (r) => r.calculationStatus },
  { key: "bank", getValue: (r) => r.bank },
  { key: "role", getValue: (r) => r.role },
  { key: "month", getValue: (r) => r.month },
];

const renderIncentiveChip = (value, modifier = "") => (
  <span className={`table-field-chip incentive-field-chip ${modifier}`.trim()}>
    {value == null || value === "" ? "—" : value}
  </span>
);

const buildColumnOptions = (rows, field, formatter = (value) => value) =>
  buildUniqueSelectOptions(rows, (row) => row[field], (row) =>
    formatter(row[field]),
  );

const formatPercent = (value) => {
  if (value == null || value === "") return "-";
  return `${value}%`;
};

const formatRefLabel = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(
      ref.name ??
        ref.fullName ??
        ref.full_name ??
        ref.employeeName ??
        ref.employee_name ??
        ref.username ??
        ref.email ??
        ref.code ??
        ref.employeeId ??
        ref.employee_id ??
        ref._id ??
        ref.id ??
        "",
    ).trim();
  }
  return String(ref);
};

const getCampaign = (record) =>
  record?.campaignId && typeof record.campaignId === "object"
    ? record.campaignId
    : {};

const readCampaignCode = (campaign) =>
  String(
    campaign?.campaignCode ??
      campaign?.campaign_code ??
      campaign?.campaignId ??
      campaign?.campaign_id ??
      campaign?.code ??
      campaign?.name ??
      "",
  ).trim();

function getCampaignId(record, campaignCodeById = {}) {
  const ref =
    record?.campaignCode ??
    record?.campaign_code ??
    record?.campaignId ??
    record?.campaign_id ??
    record?.campaign;
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    const code = readCampaignCode(ref);
    if (code) return code;

    const id = String(ref._id ?? ref.id ?? "").trim();
    return campaignCodeById[id] ?? id;
  }

  const id = String(ref).trim();
  return campaignCodeById[id] ?? id;
}

const getBossName = (record) => {
  const campaign = getCampaign(record);
  return (
    record?.bossName ??
    record?.boss ??
    record?.managerName ??
    campaign?.managerName ??
    formatRefLabel(campaign?.managerId)
  );
};

const getAssistantManagerName = (record) => {
  const campaign = getCampaign(record);
  return (
    record?.assistantManagerName ??
    record?.asstManagerName ??
    record?.asstManager ??
    campaign?.assistantManagerName ??
    formatRefLabel(campaign?.assistantManagerId)
  );
};

const getTlName = (record) => {
  const campaign = getCampaign(record);
  const tlId = formatRefLabel(campaign?.teamLeaderId);
  return (
    record?.tlName ??
    record?.teamLeaderName ??
    campaign?.teamLeaderName ??
    (String(record?.employeeId ?? "") === tlId ? record?.employeeName : "") ??
    tlId
  );
};

const readValue = (record, keys) => {
  for (const key of keys) {
    const value = record?.[key];
    if (value != null && value !== "") return value;
  }
  return "";
};

const INCENTIVE_COLUMN_FILTERS = {
  sno: { field: "_listOrder", filterable: false },
  location: { field: "location" },
  salaryType: { field: "salaryTypeDisplay" },
  empCode: { field: "empCode" },
  name: { field: "employeeName" },
  boss: { field: "bossNameDisplay" },
  asstManager: { field: "assistantManagerNameDisplay" },
  tlName: { field: "tlNameDisplay" },
  designation: { field: "designationDisplay" },
  month: { field: "month" },
  bank: { field: "bank" },
  dpd: { field: "dpdDisplay" },
  basic: { field: "basicDisplay" },
  collection: { field: "collection" },
  percent: { field: "incentivePercent" },
  incentive: { field: "incentiveAmount" },
  specialIncentive: { field: "specialIncentive" },
  ta: { field: "ta" },
  oos: { field: "oos" },
  alreadyPaid: { field: "alreadyPaid" },
  legal: { field: "legal" },
  dra: { field: "dra" },
  pv: { field: "pv" },
  advanceOrPenalty: { field: "advanceOrPenalty" },
  netPay: { field: "netPay" },
  target: { field: "target" },
  tlCollection: { field: "tlCollectionDisplay" },
  resolutionPercent: { field: "resolutionPercent" },
  rbPercent: { field: "rbPercent" },
  remarks: { field: "remarksDisplay" },
  taRemark: { field: "taRemarkDisplay" },
};

const IncentiveList = () => {
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [incentives, setIncentives] = useState([]);
  const [totalIncentives, setTotalIncentives] = useState(0);
  const [campaignCodeById, setCampaignCodeById] = useState({});
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const uploadRef = useRef(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await axiosInstance.get(CAMPAIGN_ENDPOINTS.LIST);
      const { rows } = extractListPayload(res.data ?? {});
      const nextCampaignCodeById = {};

      rows.forEach((campaign) => {
        const code = readCampaignCode(campaign);
        if (!code) return;

        [
          campaign?._id,
          campaign?.id,
          campaign?.campaignId,
          campaign?.campaign_id,
        ]
          .filter((value) => value != null && value !== "")
          .forEach((value) => {
            nextCampaignCodeById[String(value).trim()] = code;
          });
      });

      setCampaignCodeById(nextCampaignCodeById);
    } catch {
      // Campaign labels are optional for the incentive list.
    }
  }, []);

  const fetchIncentives = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(INCENTIVE_ENDPOINTS.LIST, {
        params: {
          page: pageNo,
          limit: rowsPerPage,
          ...(searchTerm.trim() && { search: searchTerm.trim() }),
        },
      });

      const data = res.data;

      if (data?.success) {
        const { rows, total } = extractListPayload(data);
        setIncentives(rows);
        setTotalIncentives(total);
      } else {
        toast.error(data?.message || "Failed to load incentives");
        setIncentives([]);
        setTotalIncentives(0);
      }
    } catch (error) {
   
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load incentives";
      toast.error(typeof msg === "string" ? msg : "Failed to load incentives");
      setIncentives([]);
      setTotalIncentives(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, rowsPerPage, searchTerm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIncentives();
  }, [fetchIncentives]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleUploadSlab = () => setShowUploadModal(true);

  const isValidFile = (f) => {
    if (!f) return false;
    const name = f.name.toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";

    if (!file) return;

    if (!isValidFile(file)) {
      toast.error("Only CSV, XLSX and XLS files are supported");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axiosInstance.post(
        INCENTIVE_ENDPOINTS.UPLOAD_INVENTIVE,
        formData,
        { headers: { "Content-Type": undefined } },
      );

      const data = res.data;

      if (data?.success) {
        toast.success(
          `Upload successful — ${data.uploaded ?? 0} uploaded, ${data.failed ?? 0} failed`,
        );
        fetchIncentives();
      } else {
        toast.error(data?.message || "Upload failed");
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Upload failed";
      toast.error(typeof msg === "string" ? msg : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const displayIncentives = useMemo(
    () =>
      incentives.map((record, index) => ({
        ...record,
        _id: String(
          record?._id ?? record?.id ?? record?.empCode ?? `row_${index}`,
        ),
        _listOrder: index,
        campaignIdDisplay: getCampaignId(record, campaignCodeById),
        salaryTypeDisplay: readValue(record, [
          "salaryType",
          "salary_type",
          "incentiveType",
        ]),
        bossNameDisplay: getBossName(record),
        assistantManagerNameDisplay: getAssistantManagerName(record),
        tlNameDisplay: getTlName(record),
        designationDisplay: readValue(record, ["designation", "role"]),
        dpdDisplay: readValue(record, ["dpd", "bucket"]),
        basicDisplay: readValue(record, [
          "basic",
          "basicSalary",
          "basic_salary",
          "salary",
        ]),
        tlCollectionDisplay: readValue(record, [
          "tlCollection",
          "tl_collection",
        ]),
        remarksDisplay: readValue(record, ["remarks", "Remarks", "remark"]),
        taRemarkDisplay: readValue(record, [
          "taRemark",
          "taRemarks",
          "ta_remark",
          "ta_remarks",
        ]),
      })),
    [incentives, campaignCodeById],
  );

  const baseColumns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "location",
      title: "LOCATION",
      render: (_, record) => renderIncentiveChip(record.location),
    },
    {
      key: "salaryType",
      title: "SALARY TYPE",
      render: (_, record) => renderIncentiveChip(record.salaryTypeDisplay),
    },
    {
      key: "empCode",
      title: "EMP_ID",
      render: (_, record) => renderIncentiveChip(record.empCode, "emp-code"),
    },
    {
      key: "name",
      title: "NAME",
      render: (_, record) => renderIncentiveChip(record.employeeName),
    },
    {
      key: "boss",
      title: "BOSS",
      render: (_, record) => renderIncentiveChip(record.bossNameDisplay),
    },
    {
      key: "asstManager",
      title: "ASST MANAGER",
      render: (_, record) =>
        renderIncentiveChip(record.assistantManagerNameDisplay),
    },
    {
      key: "tlName",
      title: "TL NAME",
      render: (_, record) => renderIncentiveChip(record.tlNameDisplay),
    },
    {
      key: "designation",
      title: "DESIGNATION",
      render: (_, record) => renderIncentiveChip(record.designationDisplay),
    },
    {
      key: "month",
      title: "MONTH",
      render: (_, record) => renderIncentiveChip(record.month, "month"),
    },
    {
      key: "bank",
      title: "BANK",
      render: (_, record) => renderIncentiveChip(record.bank, "bank"),
    },
    {
      key: "dpd",
      title: "DPD",
      render: (_, record) => renderIncentiveChip(record.dpdDisplay),
    },
    {
      key: "basic",
      title: "BASIC",
      render: (_, record) => renderIncentiveChip(record.basicDisplay),
    },
    {
      key: "collection",
      title: "COLLECTION",
      render: (_, record) =>
        renderIncentiveChip(record.collection, "collection"),
    },
    {
      key: "percent",
      title: "%",
      render: (_, record) =>
        renderIncentiveChip(formatPercent(record.incentivePercent)),
    },
    {
      key: "incentive",
      title: "INCENTIVE",
      render: (_, record) =>
        renderIncentiveChip(record.incentiveAmount, "money"),
    },
    {
      key: "specialIncentive",
      title: "SPECIAL INCENTIVE",
      render: (_, record) =>
        renderIncentiveChip(record.specialIncentive, "money"),
    },
    {
      key: "ta",
      title: "TA",
      render: (_, record) => renderIncentiveChip(record.ta, "money"),
    },
    {
      key: "oos",
      title: "OOS",
      render: (_, record) => renderIncentiveChip(record.oos, "money"),
    },
    {
      key: "alreadyPaid",
      title: "ALREADY PAID",
      render: (_, record) => renderIncentiveChip(record.alreadyPaid, "money"),
    },
    {
      key: "legal",
      title: "LEGAL",
      render: (_, record) => renderIncentiveChip(record.legal, "money"),
    },
    {
      key: "dra",
      title: "DRA",
      render: (_, record) => renderIncentiveChip(record.dra, "money"),
    },
    {
      key: "pv",
      title: "PV",
      render: (_, record) => renderIncentiveChip(record.pv, "money"),
    },
    {
      key: "advanceOrPenalty",
      title: "ADVANCE/PENALTY",
      render: (_, record) =>
        renderIncentiveChip(record.advanceOrPenalty, "money"),
    },
    {
      key: "netPay",
      title: "NET PAY",
      render: (_, record) => renderIncentiveChip(record.netPay, "net-pay"),
    },
    {
      key: "target",
      title: "TARGET",
      render: (_, record) => renderIncentiveChip(record.target, "money"),
    },
    {
      key: "tlCollection",
      title: "TL COLLECTION",
      render: (_, record) => renderIncentiveChip(record.tlCollectionDisplay),
    },
    {
      key: "resolutionPercent",
      title: "RES %",
      render: (_, record) =>
        renderIncentiveChip(formatPercent(record.resolutionPercent)),
    },
    {
      key: "rbPercent",
      title: "RB%",
      render: (_, record) =>
        renderIncentiveChip(formatPercent(record.rbPercent)),
    },
    {
      key: "remarks",
      title: "REMARKS",
      render: (_, record) => renderIncentiveChip(record.remarksDisplay),
    },
    {
      key: "taRemark",
      title: "TA Remark",
      render: (_, record) => renderIncentiveChip(record.taRemarkDisplay),
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

  const columns = baseColumns.map((column) => {
    const config = INCENTIVE_COLUMN_FILTERS[column.key];
    if (!config) return column;

    return {
      ...column,
      title: (
        <FilterableHeader
          label={column.title}
          filterKey={config.field}
          options={buildColumnOptions(
            displayIncentives,
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

  const filterConfig = useMemo(() => {
    const pruned = [
      {
        key: "status",
        label: "Status",
        type: "select",
        multiple: true,
        options: buildUniqueSelectOptions(
          displayIncentives,
          (r) => r.calculationStatus,
        ),
      },
      {
        key: "campaignId",
        label: "Campaign ID",
        type: "select",
        multiple: true,
        options: buildUniqueSelectOptions(displayIncentives, (r) =>
          r.campaignIdDisplay,
        ),
      },
      {
        key: "bank",
        label: "Bank",
        type: "select",
        multiple: true,
        options: buildUniqueSelectOptions(displayIncentives, (r) => r.bank),
      },
      {
        key: "role",
        label: "Role",
        type: "select",
        multiple: true,
        options: buildUniqueSelectOptions(displayIncentives, (r) => r.role),
      },
      {
        key: "month",
        label: "Month",
        type: "select",
        multiple: true,
        options: buildUniqueSelectOptions(displayIncentives, (r) => r.month),
      },
    ].filter((f) => f.options.length > 0);

    return pruned;
  }, [displayIncentives]);

  const filteredIncentives = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const incentiveFilterRules = [
      ...INCENTIVE_FILTER_RULES,
      {
        key: "campaignId",
        getValue: (r) => r.campaignIdDisplay,
      },
    ];

    return displayIncentives.filter((item) => {
      const matchesStatus = matchesStatusFilters(
        filterStatus,
        filters.status,
        item.calculationStatus,
      );
      const matchesSearch =
        !normalizedSearch ||
        [
          item.empCode,
          item.employeeName,
          item.bank,
          item.month,
          item.role,
          item.location,
          item.incentiveType,
          item.campaignIdDisplay,
          item.bossNameDisplay,
          item.assistantManagerNameDisplay,
          item.tlNameDisplay,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedSearch),
        );
      const matchesAdvanced = applyAdvancedFilters(
        item,
        filters,
        incentiveFilterRules,
      );
      const matchesColumns = Object.entries(columnFilters).every(
        ([field, values]) =>
          !values.length || values.includes(String(item[field] ?? "")),
      );

      return matchesStatus && matchesSearch && matchesAdvanced && matchesColumns;
    });
  }, [displayIncentives, filterStatus, searchTerm, filters, columnFilters]);

  const buildCsvContent = (rows) => {
    if (!rows.length) return "";

    const headers = [
      "S.No",
      "Location",
      "Salary Type",
      "Emp ID",
      "Name",
      "Boss",
      "Asst Manager",
      "TL Name",
      "Designation",
      "Month",
      "Bank",
      "DPD",
      "Basic",
      "Collection",
      "Incentive %",
      "Incentive Amount",
      "Special Incentive",
      "TA",
      "OOS",
      "Already Paid",
      "Legal",
      "DRA",
      "PV",
      "Advance/Penalty",
      "Net Pay",
      "Target",
      "TL Collection",
      "Resolution %",
      "RB%",
      "Remarks",
      "TA Remark",
    ];

    const escapeCell = (value) => {
      const cell = value == null ? "" : String(value);
      return `"${cell.replace(/"/g, '""')}"`;
    };

    const rowsData = rows.map((item, index) => [
      index + 1,
      item.location ?? "",
      item.salaryTypeDisplay,
      item.empCode ?? "",
      item.employeeName ?? "",
      item.bossNameDisplay,
      item.assistantManagerNameDisplay,
      item.tlNameDisplay,
      item.designationDisplay,
      item.month ?? "",
      item.bank ?? "",
      item.dpdDisplay,
      item.basicDisplay,
      item.collection ?? "",
      item.incentivePercent != null ? `${item.incentivePercent}%` : "",
      item.incentiveAmount ?? "",
      item.specialIncentive ?? "",
      item.ta ?? "",
      item.oos ?? "",
      item.alreadyPaid ?? "",
      item.legal ?? "",
      item.dra ?? "",
      item.pv ?? "",
      item.advanceOrPenalty ?? "",
      item.netPay ?? "",
      item.target ?? "",
      item.tlCollectionDisplay,
      item.resolutionPercent != null ? `${item.resolutionPercent}%` : "",
      item.rbPercent != null ? `${item.rbPercent}%` : "",
      item.remarksDisplay,
      item.taRemarkDisplay,
    ]);

    return [
      headers.map(escapeCell).join(","),
      ...rowsData.map((row) => row.map(escapeCell).join(",")),
    ].join("\r\n");
  };

  const handleExport = () => {
    if (!filteredIncentives.length) {
      toast.info("No incentive records available to export.");
      return;
    }

    const csvContent = buildCsvContent(filteredIncentives);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "incentives.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sortedIncentives = useMemo(
    () => sortTableRows(filteredIncentives, sortConfig),
    [filteredIncentives, sortConfig],
  );

  const paginatedIncentives = useMemo(
    () =>
      sortedIncentives.map((item, index) => ({
        ...item,
        sno: (pageNo - 1) * rowsPerPage + index + 1,
      })),
    [sortedIncentives, pageNo, rowsPerPage],
  );

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  const activeFiltersCount = useMemo(
    () => getActiveFiltersCount(filters),
    [filters],
  );

  return (
    <section className="incentive-page-container">
      <input
        ref={uploadRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="incentive-page-header">
        <PageHeader
          title="Incentive"
          subtitle="View, search and manage all Incentive records"
        />
        <div className="incentive-header-actions">
          <button
            type="button"
            className="incentive-export-btn"
            onClick={handleExport}
          >
            <LuDownload />
            Export
          </button>
          <Button
            variant="tertiary"
            size="lg"
            onClick={() => setShowCalculateModal(true)}
          >
            <MdOutlineCalculate />
            Calculate
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleUploadSlab}
            disabled={uploading}
          >
            <LuUpload />
            {uploading ? "Uploading..." : "Upload Slab"}
          </Button>
        </div>
      </div>

      <ListHeader
        className="incentive-list-header"
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
        searchValue={searchTerm}
        onSearchChange={(event) => {
          setSearchTerm(event.target.value);
          setPageNo(1);
        }}
        searchPlaceholder="Search..."
        onSearch={() => {
          setPageNo(1);
          fetchIncentives();
        }}
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
        wrapperClassName="incentive-table-wrap"
        className="incentive-table"
        columns={columns}
        data={paginatedIncentives}
        loading={loading}
        showScrollControls
      />

      <CustomPagination
        pageNo={pageNo}
        rowsPerPage={rowsPerPage}
        totalCount={totalIncentives}
        onPageChange={setPageNo}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPageNo(1);
        }}
      />

      <Outlet />

      <SlapCalculateModal
        show={showCalculateModal}
        onHide={() => setShowCalculateModal(false)}
        onSuccess={fetchIncentives}
      />

      <UploadModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        onSuccess={fetchIncentives}
      />
    </section>
  );
};

export default IncentiveList;
