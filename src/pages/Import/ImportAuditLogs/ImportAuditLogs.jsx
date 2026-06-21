import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import toast from "react-hot-toast";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import FilterBar from "@/components/FilterBar/FilterBar";
import Button from "@/components/Button/Button";
import { fetchAuditLogsApi } from "@/features/auditLogs/auditLogApi";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import { mapAuditLogTableRow } from "@/utils/auditLogHelpers";
import {
  applyAdvancedFilters,
  buildListQueryParams,
  buildUniqueSelectOptions,
  getActiveFiltersCount,
  normalizeListQueryFilters,
} from "@/utils/listFilterHelpers";
import "../ImportHome/ImportHome.scss";

const AUDIT_FILTER_RULES = [
  { key: "recordType", getValue: (row) => row.recordType },
  { key: "changedBy", getValue: (row) => row.changedBy },
  { key: "action", getValue: (row) => row.action },
];

const AUDIT_COLUMNS = [
  { key: "sno", title: "S.No", dataIndex: "sno" },
  { key: "action", title: "Action", dataIndex: "action" },
  { key: "module", title: "Module", dataIndex: "module" },
  { key: "recordType", title: "Record Type", dataIndex: "recordType" },
  { key: "changedBy", title: "Changed By", dataIndex: "changedBy" },
  { key: "createdAtLabel", title: "Created At", dataIndex: "createdAtLabel" },
  { key: "remarks", title: "Remarks", dataIndex: "remarks" },
];

const ImportAuditLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});

  const fetchAuditLogs = async () => {
    try {
      setListLoading(true);
      const data = await fetchAuditLogsApi({
        module: "Campaign",
        action: "DELETE",
        ...buildListQueryParams({
          searchTerm,
          pageNo,
          rowsPerPage,
          withPagination: true,
        }),
        ...normalizeListQueryFilters(filters),
      });

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to load audit logs");
        setLogs([]);
        setTotalLogs(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setLogs(rows.map(mapAuditLogTableRow));
      setTotalLogs(total);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load audit logs";
      toast.error(typeof msg === "string" ? msg : "Failed to load audit logs");
      setLogs([]);
      setTotalLogs(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, pageNo, rowsPerPage, filters]);

  const filterConfig = useMemo(() => {
    const recordTypeOptions = buildUniqueSelectOptions(logs, (row) => row.recordType);
    const changedByOptions = buildUniqueSelectOptions(logs, (row) => row.changedBy);
    const actionOptions = buildUniqueSelectOptions(logs, (row) => row.action);

    const config = [];
    if (actionOptions.length) {
      config.push({
        key: "action",
        label: "Action",
        type: "select",
        multiple: true,
        options: actionOptions,
      });
    }
    if (recordTypeOptions.length) {
      config.push({
        key: "recordType",
        label: "Record Type",
        type: "select",
        multiple: true,
        options: recordTypeOptions,
      });
    }
    if (changedByOptions.length) {
      config.push({
        key: "changedBy",
        label: "Changed By",
        type: "select",
        multiple: true,
        options: changedByOptions,
      });
    }
    return config;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return logs.filter((row) => {
      const matchesRecordType =
        filterStatus === "All" || row.recordType === filterStatus;

      const matchesSearch =
        !normalizedSearch ||
        [
          row.action,
          row.module,
          row.recordType,
          row.changedBy,
          row.remarks,
          row.createdAtLabel,
        ].some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesAdvanced = applyAdvancedFilters(row, filters, AUDIT_FILTER_RULES);

      return matchesRecordType && matchesSearch && matchesAdvanced;
    });
  }, [logs, searchTerm, filterStatus, filters]);

  const totalCount = totalLogs;
  const paginatedLogs = filteredLogs
    .map((row, index) => ({
      ...row,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  const recordTypeOptions = useMemo(() => {
    const types = buildUniqueSelectOptions(logs, (row) => row.recordType);
    return [{ value: "All", label: "All" }, ...types];
  }, [logs]);

  return (
    <section className="import-page-container">
      <div className="import-page-top import-audit-page-top">
        <div className="import-audit-title-wrap">
          <Button
            variant="custom"
            size="md"
            className="import-back-btn"
            onClick={() => navigate("/imports")}
          >
            <LuArrowLeft aria-hidden="true" />
            Back
          </Button>
          <PageHeader
            title="Import Audit Logs"
            subtitle="View campaign delete and import revert activity."
          />
        </div>
      </div>

      <ListHeader
        className="import-list-header"
        selectValue={filterStatus}
        selectOptions={recordTypeOptions}
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
        activeFiltersCount={getActiveFiltersCount(filters)}
      />

      {filterAnchor && (
        <FilterBar
          anchorEl={filterAnchor}
          onClose={() => setFilterAnchor(null)}
          config={filterConfig}
          filters={filters}
          onApply={handleApplyFilters}
          showButton={false}
        />
      )}

      <DataTable
        rowKey="_id"
        wrapperClassName="import-table-wrap"
        className="import-table"
        columns={AUDIT_COLUMNS}
        data={paginatedLogs}
        loading={listLoading}
        emptyMessage="No audit logs found"
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
    </section>
  );
};

export default ImportAuditLogs;
