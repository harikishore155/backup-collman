import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";
import CLIENT_ENDPOINTS from "@/api/endpoints/clientEndpoints";
import { fetchClientsApi } from "@/features/clients/clientApi";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import DeleteModal from "@/components/DeleteModal/DeleteModal";
import FilterBar from "@/components/FilterBar/FilterBar";
import { formatDisplayDate, toListStatus } from "@/utils/formatters";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import {
  applyAdvancedFilters,
  buildListQueryParams,
  getActiveFiltersCount,
  matchesStatusFilters,
  normalizeListQueryFilters,
} from "@/utils/listFilterHelpers";
import {
  buildClientsFilterConfig,
  CLIENT_FILTER_RULES,
} from "@/config/listFilterConfigs";
import "./ClientsList.scss";

const mapClientRow = (raw, index) => {
  const apiId =
    raw?._id ?? raw?.id ?? raw?.client_id ?? raw?.uuid ?? `row_${index}`;
  const displayId =
    raw?.code ??
    raw?.client_code ??
    raw?.bank_code ??
    raw?.id ??
    `row_${index}`;
  const bankName = raw?.bankName ?? raw?.bank_name ?? raw?.client_name ?? "";
  const code = raw?.code ?? raw?.client_code ?? raw?.bank_code ?? "";
  const createdAt = formatDisplayDate(
    raw?.created_at ?? raw?.createdAt ?? raw?.created_on,
  );
  const updatedAt = formatDisplayDate(
    raw?.updated_at ?? raw?.modified_at ?? raw?.updatedAt,
  );
  const status = toListStatus(raw?.status ?? raw?.is_active ?? raw?.active);

  return {
    _id: String(apiId),
    id: String(displayId),
    bankName,
    code,
    createdAt,
    updatedAt,
    status,
  };
};

const ClientsList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [totalClients, setTotalClients] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchClients = async () => {
    try {
      setListLoading(true);

      const data = await fetchClientsApi(
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
        toast.error(data?.message || data?.error || "Failed to load clients");
        setClients([]);
        setTotalClients(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setClients(rows.map(mapClientRow));
      setTotalClients(total);
    } catch (error) {
      console.error("Failed to fetch clients", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load clients";
      toast.error(typeof msg === "string" ? msg : "Failed to load clients");
      setClients([]);
      setTotalClients(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters]);

  // const columns = [
  //   { key: "sno", title: "S.No", dataIndex: "sno" },
  //   { key: "id", title: "Client ID", dataIndex: "id" },
  //   {
  //     key: "nameCode",
  //     title: "Name/Code",
  //     render: (_, client) => (
  //       <div className="clients-name-cell">
  //         <strong>{client.bankName}</strong>
  //         <span className="clients-code">{client.code}</span>
  //       </div>
  //     ),
  //   },
  //   { key: "createdAt", title: "Created at", dataIndex: "createdAt" },
  //   { key: "updatedAt", title: "Updated at", dataIndex: "updatedAt" },
  //   {
  //     key: "status",
  //     title: "Status",
  //     render: (_, client) => (
  //       <span className={`clients-status-badge ${client.status.toLowerCase()}`}>
  //         {client.status}
  //       </span>
  //     ),
  //   },
  //   {
  //     key: "actions",
  //     title: "",
  //     render: (_, client) => (
  //       <MoreIcon
  //         onView={() => navigate(`view/${client._id}`)}
  //         onEdit={() => navigate(`edit/${client._id}`)}
  //         onDelete={() => handleDeleteClick(client._id)}
  //       />
  //     ),
  //   },
  // ];

  const columns = [
  { key: "sno", title: "S.No", dataIndex: "sno" },
  {
    key: "id",
    title: "Client ID",
    render: (_, client) => (
      <span className="table-field-chip client">{client.id}</span>
    ),
  },
  {
    key: "nameCode",
    title: "Name/Code",
    render: (_, client) => (
      <div className="">
   
        <span className="table-field-chip bank">
              {client.bankName} {client.code}
        </span>
      </div>
    ),
  },
  {
    key: "createdAt",
    title: "Created at",
    render: (_, client) => (
      <span className="table-field-chip date">{client.createdAt}</span>
    ),
  },
  {
    key: "updatedAt",
    title: "Updated at",
    render: (_, client) => (
      <span className="table-field-chip date">{client.updatedAt}</span>
    ),
  },
  {
    key: "status",
    title: "Status",
    render: (_, client) => (
      <span className={`clients-status-badge ${client.status.toLowerCase()}`}>
        {client.status}
      </span>
    ),
  },
  {
    key: "actions",
    title: "",
    render: (_, client) => (
      <MoreIcon
        onView={() => navigate(`view/${client._id}`)}
        onEdit={() => navigate(`edit/${client._id}`)}
        onDelete={() => handleDeleteClick(client._id)}
      />
    ),
  },
];
  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus = matchesStatusFilters(
        filterStatus,
        filters.status,
        client.status,
      );
      const matchesSearch =
        !normalizedSearch ||
        [client.id, client.bankName, client.code].some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );
      const matchesAdvanced = applyAdvancedFilters(
        client,
        filters,
        CLIENT_FILTER_RULES,
      );

      return matchesStatus && matchesSearch && matchesAdvanced;
    });
  }, [clients, filterStatus, searchTerm, filters]);

  const totalCount = totalClients;
  const paginatedClients = filteredClients
    .map((client, index) => ({
      ...client,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const handleNavigate = () => {
    navigate("create");
  };

  const handleDeleteClick = (id) => {
    setSelectedClientId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await axiosInstance.delete(
        CLIENT_ENDPOINTS.DELETE(selectedClientId),
      );

      if (response.data?.success) {
        toast.success(response.data?.message || "Client deleted successfully");
        fetchClients();
      } else {
        toast.error(response.data?.message || "Failed to delete client");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete client");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedClientId(null);
    }
  };

  const filterConfig = useMemo(
    () => buildClientsFilterConfig(clients),
    [clients],
  );

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  const activeFiltersCount = useMemo(() => getActiveFiltersCount(filters), [filters]);

  return (
    <section className="clients-page-container">
      <PageHeader
        title="Clients"
        subtitle="View, search and manage all Client records"
        breadcrumbItems={[{ label: "Masters" }, { label: "Clients" }]}
        createLabel="Create Client"
        onCreate={handleNavigate}
      />

      <ListHeader
        className="clients-list-header"
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
        wrapperClassName="clients-table-wrap"
        className="clients-table"
        columns={columns}
        data={paginatedClients}
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

export default ClientsList;
