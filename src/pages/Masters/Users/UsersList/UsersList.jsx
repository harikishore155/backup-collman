import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiMail, FiPhone } from "react-icons/fi";
import axiosInstance from "@/utils/axiosInstance";
import USER_ENDPOINTS from "@/api/endpoints/userEndpoints";
import { fetchUsersApi } from "@/features/users/userApi";
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
  buildUsersFilterConfig,
  USER_FILTER_RULES,
} from "@/config/listFilterConfigs";
import "./UsersList.scss";

const mapUserRow = (raw, index) => {
  const apiId = raw?._id ?? raw?.id ?? raw?.user_id ?? `row_${index}`;
  const displayId = raw?.UID ?? raw?.code ?? raw?.employee_code ?? raw?.emp_id ?? raw?.id ?? `row_${index}`;
  const name = raw?.name ?? raw?.full_name ?? raw?.username ?? "";
  const code = raw?.UID ?? raw?.code ?? raw?.employee_code ?? raw?.emp_id ?? "";
  const contactNumber = String(
    raw?.contactNumber ?? raw?.phone ?? raw?.mobile ?? raw?.phone_number ?? raw?.contact_phone ?? "",
  ).trim();
  const email = String(raw?.email ?? raw?.contact_email ?? "").trim();
  const designation = raw?.roleId?.name ?? raw?.designation ?? raw?.role_name ?? raw?.role ?? "";
  const branch = raw?.branch ?? raw?.branch_id ?? raw?.branchId ?? "";
  const createdAt = formatDisplayDate(
    raw?.created_at ?? raw?.createdAt ?? raw?.created_on,
  );
  const modifiedAt = formatDisplayDate(
    raw?.updated_at ?? raw?.modified_at ?? raw?.modifiedAt,
  );
  const status = toListStatus(raw?.status ?? raw?.is_active ?? raw?.active);

  return {
    _id: String(apiId),
    id: String(displayId),
    name,
    code,
    contactNumber: contactNumber || "—",
    email: email || "—",
    designation: designation || "—",
    branch: branch || "—",
    createdAt,
    modifiedAt,
    status,
  };
};

const renderUserChip = (value, modifier = "") => (
  <span className={`table-field-chip ${modifier}`.trim()}>
    {value == null || value === "" ? "—" : value}
  </span>
);


const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setListLoading(true);

      const data = await fetchUsersApi(
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
        toast.error(data?.message || data?.error || "Failed to load users");
        setUsers([]);
        setTotalUsers(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setUsers(rows.map(mapUserRow));
      setTotalUsers(total);
    } catch (error) {
      console.error("Failed to fetch users", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load users";
      toast.error(typeof msg === "string" ? msg : "Failed to load users");
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters]);

  const columns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "id",
      title: "User ID",
      render: (_, user) => renderUserChip(user.id, "emp-code"),
    },
    {
      key: "nameCode",
      title: "Name/Code",
      render: (_, user) => (
        <div className="users-name-cell">
          <strong>{user.name}</strong>
          {user.code ? (
            <span className="table-field-chip emp-code">{user.code}</span>
          ) : (
            "—"
          )}
        </div>
      ),
    },
    {
      key: "contact",
      title: "Contact",
      render: (_, user) => (
        <div className="users-contact-cell">
          <span className="contact-line">
            <FiPhone />
            {user.contactNumber}
          </span>
          <span className="contact-line contact-mail">
            <FiMail />
            {user.email}
          </span>
        </div>
      ),
    },
    {
      key: "designation",
      title: "Designation",
      render: (_, user) => renderUserChip(user.designation, "person"),
    },
    {
      key: "branch",
      title: "Branch",
      render: (_, user) => renderUserChip(user.branch, "branch"),
    },
    {
      key: "status",
      title: "Status",
      render: (_, user) => (
        <span className={`users-status-badge ${user.status.toLowerCase()}`}>
          {user.status}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (_, user) => (
        <MoreIcon
          onView={() => navigate(`view/${user._id}`)}
          onEdit={() => navigate(`edit/${user._id}`)}
          onDelete={() => handleDeleteClick(user._id)}
        />
      ),
    },
  ];

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesStatus = matchesStatusFilters(
        filterStatus,
        filters.status,
        user.status,
      );
      const matchesSearch =
        !normalizedSearch ||
        [
          user.id,
          user.name,
          user.code,
          user.email,
          user.contactNumber,
          user.designation,
          user.branch,
        ].some((value) => String(value).toLowerCase().includes(normalizedSearch));
      const matchesAdvanced = applyAdvancedFilters(
        user,
        filters,
        USER_FILTER_RULES,
      );

      return matchesStatus && matchesSearch && matchesAdvanced;
    });
  }, [users, filterStatus, searchTerm, filters]);

  const totalCount = totalUsers;
  const paginatedUsers = filteredUsers
    .map((user, index) => ({
      ...user,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const handleNavigate = () => {
    navigate("create");
  };

  const handleDeleteClick = (id) => {
    setSelectedUserId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await axiosInstance.delete(
        USER_ENDPOINTS.DELETE(selectedUserId),
      );

      if (response.data?.success) {
        toast.success(response.data?.message || "User deleted successfully");
        fetchUsers();
      } else {
        toast.error(response.data?.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedUserId(null);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  const filterConfig = useMemo(
    () => buildUsersFilterConfig(users),
    [users],
  );

  const activeFiltersCount = useMemo(() => getActiveFiltersCount(filters), [filters]);

  return (
    <section className="users-page-container">
      <PageHeader
        title="Users"
        subtitle="View, search and manage all Users records"
        createLabel="Create User"
        onCreate={handleNavigate}
      />

      <ListHeader
        className="users-list-header"
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
        wrapperClassName="users-table-wrap"
        className="users-table"
        columns={columns}
        data={paginatedUsers}
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

export default UsersList;
