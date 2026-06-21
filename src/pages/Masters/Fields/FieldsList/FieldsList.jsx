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
  matchesStatusFilters,
  normalizeListQueryFilters,
} from "@/utils/listFilterHelpers";
import {
  buildFieldsFilterConfig,
  FIELD_FILTER_RULES,
} from "@/config/listFilterConfigs";
import { deleteFieldApi, fetchFieldsApi } from "@/features/fields/fieldApi";
import "./FieldsList.scss";

const mapFieldRow = (raw, index) => {
  const apiId = raw?._id ?? raw?.id ?? raw?.field_id ?? raw?.uuid ?? `row_${index}`;
  const fieldName = raw?.fieldName ?? raw?.field_name ?? raw?.name ?? "";
  const inputs = Array.isArray(raw?.inputs) ? raw.inputs : [];
  const inputsDisplay = inputs.length ? inputs.join(", ") : "—";
  const createdAt = formatDisplayDate(
    raw?.created_at ?? raw?.createdAt ?? raw?.created_on,
  );
  const modifiedAt = formatDisplayDate(
    raw?.updated_at ?? raw?.updatedAt ?? raw?.modified_at ?? raw?.modifiedAt,
  );
  const status = toListStatus(raw?.status ?? raw?.is_active ?? raw?.active);

  return {
    _id: String(apiId),
    fieldName: fieldName ? String(fieldName) : "—",
    inputs,
    inputsDisplay,
    createdAt,
    modifiedAt,
    status,
  };
};

const FieldsList = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [totalFields, setTotalFields] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFields = async () => {
    try {
      setListLoading(true);

      const data = await fetchFieldsApi(
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
        toast.error(data?.message || data?.error || "Failed to load fields");
        setFields([]);
        setTotalFields(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setFields(rows.map(mapFieldRow));
      setTotalFields(total);
    } catch (error) {
      console.error("Failed to fetch fields", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load fields";
      toast.error(typeof msg === "string" ? msg : "Failed to load fields");
      setFields([]);
      setTotalFields(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters]);

  const columns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "fieldName",
      title: "Field name",
      dataIndex: "fieldName",
      render: (name) => <span className="field-name-text">{name}</span>,
    },
    {
      key: "inputs",
      title: "Inputs",
      dataIndex: "inputsDisplay",
      render: (text) => <span className="field-inputs-text">{text}</span>,
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <span className={`fields-status-badge ${status?.toLowerCase()}`}>
          {status}
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

  const filteredFields = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return fields.filter((item) => {
      const matchesStatus = matchesStatusFilters(
        filterStatus,
        filters.status,
        item.status,
      );
      const matchesSearch =
        !normalizedSearch ||
        [
          item.fieldName,
          item.inputsDisplay,
          ...(Array.isArray(item.inputs) ? item.inputs : []),
        ].some((value) => String(value).toLowerCase().includes(normalizedSearch));
      const matchesAdvanced = applyAdvancedFilters(
        item,
        filters,
        FIELD_FILTER_RULES,
      );

      return matchesStatus && matchesSearch && matchesAdvanced;
    });
  }, [fields, filterStatus, searchTerm, filters]);

  const totalCount = totalFields;
  const paginatedFields = filteredFields
    .map((item, index) => ({
      ...item,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const handleNavigate = () => {
    navigate("create");
  };

  const handleDeleteClick = (id) => {
    setSelectedFieldId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const data = await deleteFieldApi(selectedFieldId);

      if (data?.success) {
        toast.success(data?.message || "Field deleted successfully");
        fetchFields();
      } else {
        toast.error(data?.message || "Failed to delete field");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete field");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedFieldId(null);
    }
  };

  const filterConfig = useMemo(
    () => buildFieldsFilterConfig(fields),
    [fields],
  );

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  return (
    <section className="fields-page-container">
      <PageHeader
        title="Fields"
        subtitle="View, search and manage all Fields records"
        breadcrumbItems={[{ label: "Masters" }, { label: "Fields" }]}
        createLabel="Create Field"
        onCreate={handleNavigate}
      />

      <ListHeader
        className="fields-list-header"
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
        wrapperClassName="fields-table-wrap"
        className="fields-table"
        rowKey="_id"
        columns={columns}
        data={paginatedFields}
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

export default FieldsList;

