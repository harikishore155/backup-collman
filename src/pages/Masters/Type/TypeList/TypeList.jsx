import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteTypeApi, fetchTypesApi } from "@/features/types/typeApi";
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
  buildTypesFilterConfig,
  TYPE_FILTER_RULES,
} from "@/config/listFilterConfigs";
import "./TypeList.scss";

/** `??` keeps `""`; API often sends empty typeId — skip those and fall through. */
const firstNonEmpty = (...values) => {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s !== "") return v;
  }
  return undefined;
};

const mapTypeRow = (raw, index) => {
  const apiId = raw?._id ?? raw?.id ?? raw?.type_id ?? raw?.uuid ?? `row_${index}`;
  const displayId =
    firstNonEmpty(
      raw?.typeId,
      raw?.type_id,
      raw?.type_code,
      raw?.typeCode,
      raw?.code,
      raw?.name,
      raw?.type_name,
      raw?.typeName,
      raw?.id,
    ) ?? apiId;
  const name = raw?.name ?? raw?.typeName ?? "";
  const allocationCreationDeadline = formatDisplayDate(
    raw?.allocationCreationDeadline ??
      raw?.deadline_date ??
      raw?.deadlineDate ??
      raw?.deadline,
  );
  const description = raw?.description ?? raw?.type_description ?? "";
  const createdAt = formatDisplayDate(
    raw?.created_at ?? raw?.createdAt ?? raw?.created_on,
  );
  const modifiedAt = formatDisplayDate(
    raw?.updated_at ?? raw?.modified_at ?? raw?.modifiedAt,
  );
  const status = toListStatus(raw?.status ?? raw?.is_active ?? raw?.active);

  return {
    _id: String(apiId),
    typeId: String(displayId),
    name,
    allocationCreationDeadline,
    description,
    createdAt,
    modifiedAt,
    status,
  };
};

const TypeList = () => {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [totalTypes, setTotalTypes] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTypes = async () => {
    try {
      setListLoading(true);

      const data = await fetchTypesApi(
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
        toast.error(data?.message || data?.error || "Failed to load types");
        setTypes([]);
        setTotalTypes(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setTypes(rows.map(mapTypeRow));
      setTotalTypes(total);
    } catch (error) {
      console.error("Failed to fetch types", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load types";
      toast.error(typeof msg === "string" ? msg : "Failed to load types");
      setTypes([]);
      setTotalTypes(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters]);

  const columns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "typeId",
      title: "Type ID",
      render: (_, type) => (
        <span className="table-field-chip type-id">{type.typeId}</span>
      ),
    },
    {
      key: "name",
      title: "Name",
      render: (_, type) => (
        <span className={`table-field-chip type-name ${(type.name || "").toLowerCase()}`}>
          {type.name}
        </span>
      ),
    },
    {
      key: "allocationCreationDeadline",
      title: "Deadline Date",
      render: (_, type) => (
        <span className="table-field-chip date">
          {type.allocationCreationDeadline || "—"}
        </span>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (_, type) => (
        <span className="table-field-chip type-description">
          {type.description || "—"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_, type) => (
        <span className={`type-status-badge ${type.status.toLowerCase()}`}>
          {type.status}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (_, type) => (
        <MoreIcon
          onView={() => navigate(`view/${type._id}`, { state: { type } })}
          onEdit={() => navigate(`edit/${type._id}`, { state: { type } })}
          onDelete={() => handleDeleteClick(type._id)}
        />
      ),
    },
  ];

  const filteredTypes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return types.filter((type) => {
      const matchesStatus = matchesStatusFilters(
        filterStatus,
        filters.status,
        type.status,
      );
      const matchesSearch =
        !normalizedSearch ||
        [
          type.typeId,
          type.name,
          type.description,
          type.allocationCreationDeadline,
        ].some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );
      const matchesAdvanced = applyAdvancedFilters(
        type,
        filters,
        TYPE_FILTER_RULES,
      );

      return matchesStatus && matchesSearch && matchesAdvanced;
    });
  }, [types, filterStatus, searchTerm, filters]);

  const totalCount = totalTypes;
  const paginatedTypes = filteredTypes
    .map((type, index) => ({
      ...type,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const filterConfig = useMemo(
    () => buildTypesFilterConfig(types),
    [types],
  );

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  const handleNavigate = () => {
    navigate("create");
  };

  const handleDeleteClick = (id) => {
    setSelectedTypeId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const data = await deleteTypeApi(selectedTypeId);

      if (data?.success) {
        toast.success(data?.message || "Type deleted successfully");
        fetchTypes();
      } else {
        toast.error(data?.message || "Failed to delete type");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete type");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedTypeId(null);
    }
  };

  return (
    <section className="type-page-container">
      <PageHeader
        title="Type"
        subtitle="View, search and manage all Role records"
        breadcrumbItems={[{ label: "Masters" }, { label: "Type" }]}
        createLabel="Create Type"
        onCreate={handleNavigate}
      />

      <ListHeader
        className="type-list-header"
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
        rowKey="_id"
        wrapperClassName="type-table-wrap"
        className="type-table"
        columns={columns}
        data={paginatedTypes}
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

export default TypeList;

