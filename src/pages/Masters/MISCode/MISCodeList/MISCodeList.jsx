import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";
import MIS_CODE_ENDPOINTS from "@/api/endpoints/misCodeEndpoints";
import { fetchMisCodesApi } from "@/features/misCodes/misCodeApi";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import DeleteModal from "@/components/DeleteModal/DeleteModal";
import FilterBar from "@/components/FilterBar/FilterBar";
import {
  formatClientRef,
  formatDisplayDate,
  toListStatus,
} from "@/utils/formatters";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import {
  applyAdvancedFilters,
  buildListQueryParams,
  getActiveFiltersCount,
  matchesStatusFilters,
  normalizeListQueryFilters,
} from "@/utils/listFilterHelpers";
import {
  buildMisCodeFilterConfig,
  MIS_CODE_FILTER_RULES,
} from "@/config/listFilterConfigs";
import "./MISCodeList.scss";

const mapMISCodeRow = (raw, index) => {
  const _id =
    raw?._id ?? raw?.id ?? raw?.uuid ?? `row_${index}`;
  const misIdLabel =
    raw?.misId ?? raw?.mis_id ?? raw?._id ?? raw?.id ?? `row_${index}`;
  const misCode = raw?.misCode ?? raw?.code ?? raw?.mis_code ?? "";
  const clientRef = raw?.clientId ?? raw?.client_id;
  const clientId =
    clientRef != null && typeof clientRef === "object"
      ? String(clientRef._id ?? clientRef.id ?? "")
      : clientRef != null
        ? String(clientRef)
        : "";
  const bankName = formatClientRef(clientRef);
  const createdAt = formatDisplayDate(
    raw?.created_at ?? raw?.createdAt ?? raw?.created_on,
  );
  const modifiedAt = formatDisplayDate(
    raw?.updated_at ?? raw?.modified_at ?? raw?.modifiedAt,
  );
  const status = toListStatus(raw?.status ?? raw?.is_active ?? raw?.active);

  return {
    _id: String(_id),
    misId: String(misIdLabel),
    misCode: String(misCode),
    bankName,
    clientId,
    createdAt,
    modifiedAt,
    status,
  };
};

const MISCodeList = () => {
  const navigate = useNavigate();
  const [misCodes, setMisCodes] = useState([]);
  const [totalMisCodes, setTotalMisCodes] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMISCodes = async () => {
    try {
      setListLoading(true);

      const data = await fetchMisCodesApi(
        {
          ...buildListQueryParams({
            filterStatus,
            searchTerm,
            pageNo,
            rowsPerPage,
            withPagination: true,
          }),
          ...normalizeListQueryFilters(filters),
        },
      );

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to load MIS codes");
        setMisCodes([]);
        setTotalMisCodes(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setMisCodes(rows.map(mapMISCodeRow));
      setTotalMisCodes(total);
    } catch (error) {
      console.error("Failed to fetch MIS codes", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load MIS codes";
      toast.error(typeof msg === "string" ? msg : "Failed to load MIS codes");
      setMisCodes([]);
      setTotalMisCodes(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMISCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters]);

  const columns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "misId",
      title: "MIS ID",
      render: (_, item) => (
        <span className="table-field-chip mis-id">{item.misId}</span>
      ),
    },
    {
      key: "misCode",
      title: "MIS Code",
      render: (_, item) => (
        <span className="table-field-chip mis-code">{item.misCode}</span>
      ),
    },
    {
      key: "bankName",
      title: "Client Name",
      render: (_, item) => (
        <span className="table-field-chip client">{item.bankName || "—"}</span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_, item) => (
        <span className={`mis-status-badge ${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (_, item) => (
        <MoreIcon
          onView={() => navigate(`view/${item._id}`)}
          onEdit={() => navigate(`edit/${item._id}`)}
          onDelete={() => handleDeleteClick(item._id)}
        />
      ),
    },
  ];

  const filteredMISCodes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return misCodes.filter((item) => {
      // Header filters
      const matchesSearch =
        !normalizedSearch ||
        [item._id, item.misId, item.misCode, item.bankName].some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );

      const matchesStatusCombined = matchesStatusFilters(
        filterStatus,
        filters.status,
        item.status,
      );
      const matchesAdvanced = applyAdvancedFilters(
        item,
        filters,
        MIS_CODE_FILTER_RULES,
      );

      return matchesStatusCombined && matchesSearch && matchesAdvanced;
    });
  }, [misCodes, filterStatus, searchTerm, filters]);

  const totalCount = totalMisCodes;
  const paginatedMISCodes = filteredMISCodes
    .map((item, index) => ({
      ...item,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const handleNavigate = () => {
    navigate("create");
  };

  const handleDeleteClick = (id) => {
    setSelectedItemId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await axiosInstance.delete(
        MIS_CODE_ENDPOINTS.DELETE(selectedItemId),
      );

      if (response.data?.success) {
        toast.success(response.data?.message || "MIS Code deleted successfully");
        fetchMISCodes();
      } else {
        toast.error(response.data?.message || "Failed to delete MIS Code");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete MIS Code");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedItemId(null);
    }
  };

  const filterConfig = useMemo(
    () => buildMisCodeFilterConfig(misCodes),
    [misCodes],
  );

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  const activeFiltersCount = useMemo(() => getActiveFiltersCount(filters), [filters]);

  return (
    <section className="mis-page-container">
      <PageHeader
        title="MIS Code"
        subtitle="View, search and manage all MIS records"
        breadcrumbItems={[{ label: "Masters" }, { label: "MIS Code" }]}
        createLabel="Create MIS Code"
        onCreate={handleNavigate}
      />

      <ListHeader
        className="mis-list-header"
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
        onSearch={() => setPageNo(1)}
        onFiltersClick={(e) => setFilterAnchor(e.currentTarget)}
        filterLabel="Filters"
        showSearchButton={true}
        activeFiltersCount={activeFiltersCount}
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
        wrapperClassName="mis-table-wrap"
        className="mis-table"
        rowKey="_id"
        columns={columns}
        data={paginatedMISCodes}
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

export default MISCodeList;

