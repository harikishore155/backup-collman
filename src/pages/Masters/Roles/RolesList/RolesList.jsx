import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
  buildRolesFilterConfig,
  ROLE_FILTER_RULES,
} from "@/config/listFilterConfigs";
import { fetchRolesApi, deleteRoleApi } from "@/features/roles/roleApi";
import { getRoleApiId, getRoleDisplayId, getRoleRowKeyValue } from "@/features/roles/roleDisplay";
import "./RolesList.scss";

const mapRoleRow = (raw, index) => {
  const apiId = getRoleApiId(raw, index);
  const displayId = getRoleDisplayId(raw) || `row_${index}`;
  const name = raw?.name ?? raw?.role_name ?? "";
  const description = raw?.description ?? raw?.role_description ?? "";
  const createdAt = formatDisplayDate(raw?.created_at ?? raw?.createdAt ?? raw?.created_on);
  const updatedAt = formatDisplayDate(raw?.updated_at ?? raw?.modified_at ?? raw?.updatedAt);
  const status = toListStatus(raw?.status ?? raw?.is_active ?? raw?.active);

  const roleId = getRoleRowKeyValue(raw, index);

  return {
    _id: apiId,
    id: String(displayId),
    roleId,
    name,
    description,
    createdAt,
    updatedAt,
    status,
  };
};

const RolesList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [totalRoles, setTotalRoles] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      setListLoading(true);
      const data = await fetchRolesApi(
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
        toast.error(data?.message || data?.error || "Failed to load roles");
        setRoles([]);
        setTotalRoles(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setRoles(rows.map(mapRoleRow));
      setTotalRoles(total);
    } catch (error) {
      console.error("Failed to fetch roles", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load roles";
      toast.error(typeof msg === "string" ? msg : "Failed to load roles");
      setRoles([]);
      setTotalRoles(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters]);

  const handleDeleteClick = (id) => {
    setSelectedRoleId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const data = await deleteRoleApi(selectedRoleId);

      if (data?.success) {
        toast.success(data?.message || "Role deleted successfully");
        fetchRoles();
      } else {
        toast.error(data?.message || "Failed to delete role");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete role");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedRoleId(null);
    }
  };

  const filterConfig = useMemo(
    () => buildRolesFilterConfig(roles),
    [roles],
  );

  const activeFiltersCount = useMemo(() => getActiveFiltersCount(filters), [filters]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  const columns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "id",
      title: "Role ID",
      render: (_, role) => (
        <span className="table-field-chip role">{role.id}</span>
      ),
    },
    {
      key: "name",
      title: "Name",
      render: (_, role) => (
        <span className="table-field-chip role-name">{role.name}</span>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (_, role) => (
        <span className="table-field-chip role-description">{role.description || "—"}</span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_, role) => (
        <span className={`roles-status-badge ${role.status.toLowerCase()}`}>
          {role.status}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (_, role) => (
        <MoreIcon
          onView={() => navigate(`view/${role._id}`)}
          onEdit={() => navigate(`edit/${role._id}`)}
          onDelete={() => handleDeleteClick(role._id)}
        />
      ),
    },
  ];

  const filteredRoles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return roles.filter((role) => {
      const matchesStatus = matchesStatusFilters(
        filterStatus,
        filters.status,
        role.status,
      );
      const matchesSearch =
        !normalizedSearch ||
        [role.roleId, role.id, role.name, role.description]
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      const matchesAdvanced = applyAdvancedFilters(
        role,
        filters,
        ROLE_FILTER_RULES,
      );

      return matchesStatus && matchesSearch && matchesAdvanced;
    });
  }, [roles, filterStatus, searchTerm, filters]);

  const totalCount = totalRoles;
  const paginatedRoles = filteredRoles
    .map((role, index) => ({
      ...role,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  return (
    <section className="roles-page-container">
      <PageHeader
        title="Roles"
        subtitle="View, search and manage all Role records"
        breadcrumbItems={[{ label: "Masters" }, { label: "Roles" }]}
        createLabel="Create Role"
        onCreate={() => navigate("create")}
      />

      <ListHeader
        className="roles-list-header"
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
        wrapperClassName="roles-table-wrap"
        className="roles-table"
        columns={columns}
        data={paginatedRoles}
        loading={listLoading}
        rowKey="roleId"
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

export default RolesList;
