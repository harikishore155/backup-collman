import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchDailyCallReportsApi,
  deleteDailyCallReportApi,
} from "@/features/dcrs/dcrApi";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import DeleteModal from "@/components/DeleteModal/DeleteModal";
import FilterBar from "@/components/FilterBar/FilterBar";
import { isApiFailure } from "@/utils/apiHelpers";
import { applyAdvancedFilters } from "@/utils/listFilterHelpers";
import {
  buildDcrsFilterConfig,
  DCR_FILTER_RULES,
} from "@/config/listFilterConfigs";
import "./DCRsList.scss";

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
        ref.employeeName ??
        ref.employee_name ??
        ref.employeeId ??
        ref.employee_id ??
        ref.username ??
        ref.email ??
        "",
    );
  }
  return String(ref);
};

// ─── Replace mapDcrRow in DCRsList.jsx with this updated version ──────────────
// Added 3 new fields: telecallerId, month, paymentType

const mapDcrRow = (raw, index) => {
  const _id = raw?._id ?? raw?.id ?? raw?.uuid ?? `row_${index}`;
  const campaignId = formatCampaignRef(
    raw?.campaignId ?? raw?.campaign_id ?? raw?.campaign,
  );
  const customer   = raw?.customerName  ?? raw?.customer_name ?? "";
  const paidDate   = raw?.paidDate      ?? raw?.paid_date     ?? "";
  const paidType   = raw?.paidType      ?? raw?.paid_type     ?? "";
  const paidAmount = raw?.paidAmount    ?? raw?.paid_amount   ?? "";
  const assistantManager = formatUserRef(
    raw?.assistantManagerId ??
      raw?.assistantManager ??
      raw?.assistant_manager_id ??
      raw?.assistant_manager,
  );
  const teamLeader = formatUserRef(
    raw?.teamLeaderId ??
      raw?.teamLeader ??
      raw?.team_leader_id ??
      raw?.team_leader ??
      raw?.tlId ??
      raw?.tl,
  );
  const manager = formatUserRef(
    raw?.managerId ?? raw?.manager ?? raw?.manager_id,
  );

  return {
    _id:              String(_id),
    id:               String(_id),
    campaignId:       campaignId || "-",
    customer:         customer   || "-",
    paidDate:         paidDate   || "-",
    paidType:         paidType   || "-",
    paidAmount:       paidAmount !== "" ? `Rs ${paidAmount}` : "-",
    assistantManager: assistantManager || "-",
    teamLeader:       teamLeader       || "-",
    manager:          manager          || "-",
    contactStatus:    raw?.contactStatus ?? raw?.status ?? "-",

    // ── NEW fields for DCR filters ────────────────────────────────────────────

    // 1. TC/FOS — raw telecallerId string (e.g. "EMP_026")
    telecallerId: raw?.telecallerId ?? raw?.teleCallerId ?? "-",

    // 5. Month — pulled from campaignId.monthYear (e.g. "Jun 2026")
    month:
      (typeof raw?.campaignId === "object"
        ? raw.campaignId?.monthYear
        : null) ?? "-",

    // 6. Type — paymentType (e.g. "SLA")
    paymentType: raw?.paymentType ?? raw?.payment_type ?? "-",
  };
};

const renderDcrChip = (value, modifier = "") => {
  const displayVal = value === "-" || value == null || value === "" ? "—" : value;
  return (
    <span className={`table-field-chip ${modifier}`.trim()}>
      {displayVal}
    </span>
  );
};

const DCRsList = () => {
  const navigate = useNavigate();
  const [dcrs, setDcrs] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});
  const [totalCount, setTotalCount] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDcrId, setSelectedDcrId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search so we don't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPageNo(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDcrs = async () => {
    try {
      setListLoading(true);

      const data = await fetchDailyCallReportsApi({
        page: pageNo,
        limit: rowsPerPage,
        search: debouncedSearch,
      });

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to load DCRs");
        setDcrs([]);
        return;
      }

      const rows = data?.data ?? data?.rows ?? [];
      setDcrs(rows.map(mapDcrRow));
      setTotalCount(data?.total ?? data?.count ?? rows.length);
    } catch (error) {
      console.error("Failed to fetch DCRs", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load DCRs";
      toast.error(typeof msg === "string" ? msg : "Failed to load DCRs");
      setDcrs([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchDcrs();
  }, [pageNo, rowsPerPage, debouncedSearch]);

  const handleDeleteClick = (id) => {
    setSelectedDcrId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const data = await deleteDailyCallReportApi(selectedDcrId);

      if (isApiFailure(data)) {
        toast.error(data?.message || "Failed to delete DCR");
        return;
      }

      toast.success(data?.message || "DCR deleted successfully");
      fetchDcrs();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete DCR");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedDcrId(null);
    }
  };

  const columns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "customer",
      title: "Name",
      render: (_, dcr) => renderDcrChip(dcr.customer, "person"),
    },
    {
      key: "paidAmount",
      title: "Paid Amount",
      render: (_, dcr) => renderDcrChip(dcr.paidAmount, "money"),
    },
    {
      key: "paidDate",
      title: "Paid Date",
      render: (_, dcr) => renderDcrChip(dcr.paidDate, "date"),
    },
    {
      key: "teamLeader",
      title: "TL Name",
      render: (_, dcr) => renderDcrChip(dcr.teamLeader, "tl"),
    },
    {
      key: "manager",
      title: "Manager",
      render: (_, dcr) => renderDcrChip(dcr.manager, "manager"),
    },
    {
      key: "campaignId",
      title: "Allocation",
      render: (_, dcr) => renderDcrChip(dcr.campaignId, "campaign"),
    },
  ];

  // Client-side filter as fallback (in case backend doesn't support search)
  const filteredDCRs = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();

    return dcrs.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          item.campaignId,
          item.customer,
          item.paidDate,
          item.paidType,
          item.paidAmount,
          item.assistantManager,
          item.teamLeader,
          item.manager,
          item.contactStatus,
        ].some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );

      const matchesAdvanced = applyAdvancedFilters(
        item,
        filters,
        DCR_FILTER_RULES,
      );

      return matchesSearch && matchesAdvanced;
    });
  }, [dcrs, debouncedSearch, filters]);

  const buildCsvContent = (rows) => {
    if (!rows.length) return "";

    const headers = [
      "S.No",
      "Name",
      "Paid Amount",
      "Paid Date",
      "Paid Type",
      "Assistant Manager",
      "TL Name",
      "Manager",
      "Allocation",
      "Contact Status",
    ];

    const escapeCell = (value) => {
      const cell = value == null || value === "-" ? "" : String(value);
      return `"${cell.replace(/"/g, '""')}"`;
    };

    const rowsData = rows.map((item, index) => [
      index + 1,
      item.customer,
      item.paidAmount,
      item.paidDate,
      item.paidType,
      item.assistantManager,
      item.teamLeader,
      item.manager,
      item.campaignId,
      item.contactStatus,
    ]);

    return [
      headers.map(escapeCell).join(","),
      ...rowsData.map((row) => row.map(escapeCell).join(",")),
    ].join("\r\n");
  };

  const handleExport = () => {
    if (!filteredDCRs.length) {
      toast.info("No DCR records available to export.");
      return;
    }

    const csvContent = buildCsvContent(filteredDCRs);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "dcrs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const paginatedData = filteredDCRs.map((item, index) => ({
    ...item,
    sno: (pageNo - 1) * rowsPerPage + index + 1,
  }));

  const filterConfig = useMemo(() => buildDcrsFilterConfig(dcrs), [dcrs]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  return (
    <section className="dcrs-page-container">
      <PageHeader
        title="DCRs"
        subtitle="View, search and manage all Daily Call Report records"
        breadcrumbItems={[{ label: "Home" }, { label: "DCRs" }]}
        exportLabel="Export"
        onExport={handleExport}
      />

      <ListHeader
        searchValue={searchTerm}
        onSearchChange={(event) => {
          setSearchTerm(event.target.value);
        }}
        searchPlaceholder="Search..."
        onFiltersClick={(e) => setFilterAnchor(e.currentTarget)}
        filterLabel="Filters"
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
        wrapperClassName="dcrs-table-wrap"
        className="dcrs-table"
        columns={columns}
        data={paginatedData}
        loading={listLoading}
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

export default DCRsList;