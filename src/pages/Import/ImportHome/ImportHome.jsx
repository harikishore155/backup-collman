import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuClipboardList, LuFolderOpen, LuRotateCcw } from "react-icons/lu";
import { FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";
import { BsThreeDotsVertical } from "react-icons/bs";
import toast from "react-hot-toast";
import {
  fetchCaseUploadCampaignsApi,
  revertCaseUploadApi,
} from "@/features/caseUploads/caseUploadApi";
import { mapImportHomeRow } from "@/features/caseUploads/caseUploadMappers";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import DeleteModal from "@/components/DeleteModal/DeleteModal";
import FilterBar from "@/components/FilterBar/FilterBar";
import Button from "@/components/Button/Button";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import {
  applyAdvancedFilters,
  buildListQueryParams,
  buildUniqueSelectOptions,
  normalizeListQueryFilters,
} from "@/utils/listFilterHelpers";
import "./ImportHome.scss";

const IMPORT_FILTER_RULES = [
  { key: "entityType", getValue: (r) => r.entityType },
  { key: "campaignId", getValue: (r) => r.campaignId },
];

const renderImportChip = (value, modifier = "") => {
  const displayVal = value == null || value === "" || value === "-" ? "—" : value;
  return (
    <span className={`table-field-chip ${modifier}`.trim()}>
      {displayVal}
    </span>
  );
};

const DETAIL_SKIP_KEYS = new Set([
  "_id",
  "id",
  "__v",
  "uploadBatchId",
  "upload_batch_id",
  "campaignObjectId",
  "campaign_object_id",
  "__campaignId",
  "__campaignObjectId",
  "__collType",
  "__caseId",
]);

const CASE_FILTER_RULES = [
  { key: "campaignId", getValue: (row) => row.__campaignObjectId },
  { key: "collType", getValue: (row) => row.__collType },
];

const readCaseFilterValue = (row, keys, fallback = "") => {
  for (const key of keys) {
    const value = row?.[key];
    if (value == null || value === "") continue;
    if (typeof value === "object") {
      return String(value._id ?? value.id ?? value.code ?? value.name ?? fallback);
    }
    return String(value);
  }
  return fallback;
};

const readCaseObjectId = (row) => {
  const value =
    row?._id ?? row?.caseObjectId ?? row?.case_object_id ?? row?.id ?? "";
  return value == null || value === "" ? "" : String(value);
};

const formatDetailTitle = (key) =>
  String(key)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDetailValue = (value) => {
  if (value == null || value === "") return "-";
  if (value instanceof Date) return value.toLocaleDateString("en-GB");
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (typeof value === "object") {
    return (
      value.name ||
      value.fullName ||
      value.email ||
      value.mobile ||
      value.phone ||
      value._id ||
      JSON.stringify(value)
    );
  }
  return String(value);
};

const mapCaseDetailRows = (rows, selectedImport) =>
  rows.map((row, index) => {
    const caseObjectId = readCaseObjectId(row);
    return {
      ...row,
      _id: caseObjectId || `case_${index}`,
      __caseId: caseObjectId,
      __campaignId: readCaseFilterValue(
        row,
        ["campaignId", "campaign_id", "campaign"],
        selectedImport?.campaignId ?? "",
      ),
      __campaignObjectId: readCaseFilterValue(
        row,
        ["campaignObjectId", "campaign_object_id", "campaign"],
        selectedImport?.campaignObjectId ?? "",
      ),
      __collType: readCaseFilterValue(row, [
        "collType",
        "coll_type",
        "collectionType",
        "collection_type",
        "type",
      ]),
      uploadedBy: selectedImport?.uploadedBy ?? "-",
    };
  });

const buildExportRows = (rows) => {
  if (!rows.length) return [];

  const keys = [];
  rows.forEach((row) => {
    if (!row || typeof row !== "object") return;
    Object.keys(row).forEach((key) => {
      if (
        !DETAIL_SKIP_KEYS.has(key) &&
        !key.startsWith("__") &&
        !keys.includes(key)
      ) {
        keys.push(key);
      }
    });
  });

  return rows.map((row, index) => {
    const exportRow = { "S.No": index + 1 };
    keys.forEach((key) => {
      exportRow[formatDetailTitle(key)] = formatDetailValue(row[key]);
    });
    return exportRow;
  });
};

const writeExcelFile = (exportRows, sheetName, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  const colWidths = Object.keys(exportRows[0]).map((key) => ({
    wch:
      Math.max(
        key.length,
        ...exportRows.map((row) => String(row[key] ?? "").length),
      ) + 2,
  }));
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
};

const buildDetailColumns = (rows) => {
  const keys = [];
  rows.forEach((row) => {
    if (!row || typeof row !== "object") return;
    Object.keys(row).forEach((key) => {
      if (!DETAIL_SKIP_KEYS.has(key) && !keys.includes(key)) keys.push(key);
    });
  });

  return [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    ...keys.slice(0, 10).map((key) => ({
      key,
      title: formatDetailTitle(key),
      render: (_, row) => formatDetailValue(row[key]),
    })),
  ];
};

const ActionMenu = ({ onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="import-action-menu" ref={ref}>
      <button
        className="action-trigger"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <BsThreeDotsVertical size={16} />
      </button>
      {open && (
        <ul className="action-list">
          <li
            className="action-item danger"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <LuRotateCcw size={14} />
            Revert Import
          </li>
        </ul>
      )}
    </div>
  );
};

const ImportHome = () => {
  const navigate = useNavigate();
  const [imports, setImports] = useState([]);
  const [totalImports, setTotalImports] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});
  const [selectedImport, setSelectedImport] = useState(null);
  const [caseFilters, setCaseFilters] = useState({});

  const [detailTab, setDetailTab] = useState("uploaded");
  const [detailLoading, setDetailLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchImports = async () => {
    try {
      setListLoading(true);

      const data = await fetchCaseUploadCampaignsApi({
        ...buildListQueryParams({
          filterStatus,
          searchTerm,
          pageNo,
          rowsPerPage,
          withPagination: true,
        }),
        ...normalizeListQueryFilters(filters),
      });

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to load imports");
        setImports([]);
        setTotalImports(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setImports(rows.map(mapImportHomeRow));
      setTotalImports(total);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load imports";
      toast.error(typeof msg === "string" ? msg : "Failed to load imports");
      setImports([]);
      setTotalImports(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchImports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters]);

  const handleDeleteClick = (row) => {
    setSelectedImportId(row.campaignObjectId || row._id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const data = await revertCaseUploadApi(selectedImportId);

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to revert import");
        return;
      }

      setImports((prev) =>
        prev.filter(
          (r) => (r.campaignObjectId || r._id) !== selectedImportId,
        ),
      );
      if (
        (selectedImport?.campaignObjectId || selectedImport?._id) ===
        selectedImportId
      ) {
        setSelectedImport(null);
      }
      toast.success(data?.message || "Import reverted successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to revert import");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedImportId(null);
    }
  };

  const handleEntityClick = async (row) => {
    const campaignObjectId = row.campaignObjectId || row._id;

    setSelectedImport(row);
    setCaseFilters({});
    setDetailTab(row.uploadedData.length ? "uploaded" : "error");
    setPageNo(1);

    if (!campaignObjectId) return;

    try {
      setDetailLoading(true);
      const data = await fetchCaseUploadCampaignsApi({
        campainId: campaignObjectId,
      });

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to load import data");
        return;
      }

      const { rows } = extractListPayload(data);
      const detailRaw =
        rows.find(
          (item) =>
            String(
              item?.campaignObjectId ??
              item?.campaign_object_id ??
              item?.campaign?._id ??
              item?.campaign?.id ??
              item?.campaignId ??
              item?.campaign_id,
            ) === String(campaignObjectId),
        ) ??
        rows[0] ??
        (data?.data && !Array.isArray(data.data) ? data.data : null) ??
        data;
      const detailRow = mapImportHomeRow(detailRaw);

      setSelectedImport({
        ...row,
        ...detailRow,
        entityType: detailRow.entityType || row.entityType,
        campaignId: detailRow.campaignId || row.campaignId,
        campaignObjectId:
          detailRow.campaignObjectId || row.campaignObjectId || campaignObjectId,
      });
      setDetailTab(detailRow.uploadedData.length ? "uploaded" : "error");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load import data";
      toast.error(typeof msg === "string" ? msg : "Failed to load import data");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "entityType",
      title: "Entity Type",
      render: (_, row) => (
        <div className="import-file-item">
          <span className="import-file-icon">
            <LuFolderOpen size={18} color="#37b7d1" />
          </span>
          <button
            className="import-file-name import-file-link"
            type="button"
            onClick={() => handleEntityClick(row)}
          >
            {row.entityType}
          </button>
        </div>
      ),
    },
    {
      key: "campaignId",
      title: "Campaign ID",
      render: (_, row) => renderImportChip(row.campaignId, "campaign"),
    },
    {
      key: "uploadedCount",
      title: "Uploaded",
      render: (_, row) => renderImportChip(row.uploadedCount, "success"),
    },
    {
      key: "notUploadedCount",
      title: "Not Uploaded",
      render: (_, row) => renderImportChip(row.notUploadedCount, "danger"),
    },
    {
      key: "uploadedAt",
      title: "Uploaded At",
      render: (_, row) => renderImportChip(row.uploadedAt, "date"),
    },
    {
      key: "uploadedBy",
      title: "Uploaded By",
      render: (_, row) => renderImportChip(row.uploadedBy, "person"),
    },
    {
      key: "actions",
      title: "",
      render: (_, row) => (
        <ActionMenu onDelete={() => handleDeleteClick(row)} />
      ),
    },
  ];
  const filterConfig = useMemo(() => {
    const entityOptions = buildUniqueSelectOptions(imports, (r) => r.entityType);
    const campaignOptions = buildUniqueSelectOptions(imports, (r) => r.campaignId);
    const config = [];
    if (entityOptions.length > 0) {
      config.push({ key: "entityType", label: "Entity Type", type: "select", multiple: true, options: entityOptions });
    }
    if (campaignOptions.length > 0) {
      config.push({ key: "campaignId", label: "Campaign ID", type: "select", multiple: true, options: campaignOptions });
    }
    return config;
  }, [imports]);

  const filteredImports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return imports.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        [row.entityType, row.campaignId, row.uploadedAt, row.uploadedBy].some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );
      const matchesAdvanced = applyAdvancedFilters(row, filters, IMPORT_FILTER_RULES);

      return matchesSearch && matchesAdvanced;
    });
  }, [imports, searchTerm, filters]);

  const totalCount = totalImports;
  const paginatedImports = filteredImports
    .map((row, index) => ({
      ...row,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  const detailRows = useMemo(() => {
    const rows =
      detailTab === "uploaded"
        ? selectedImport?.uploadedData ?? []
        : selectedImport?.errorData ?? [];

    return mapCaseDetailRows(rows, selectedImport);
  }, [detailTab, selectedImport]);

  const uploadedRowsForExport = useMemo(() => {
    const rows = mapCaseDetailRows(
      selectedImport?.uploadedData ?? [],
      selectedImport,
    );
    return rows.filter((row) =>
      applyAdvancedFilters(row, caseFilters, CASE_FILTER_RULES),
    );
  }, [caseFilters, selectedImport]);

  const errorRowsForExport = useMemo(
    () => mapCaseDetailRows(selectedImport?.errorData ?? [], selectedImport),
    [selectedImport],
  );

  const handleExportUploaded = () => {
    if (!uploadedRowsForExport.length) {
      toast.error("No uploaded records available to export.");
      return;
    }

    const exportRows = buildExportRows(uploadedRowsForExport);
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const campaignLabel = selectedImport?.campaignId || "import";
    writeExcelFile(
      exportRows,
      "Uploaded Data",
      `import_uploaded_${campaignLabel}_${timestamp}.xlsx`,
    );
    toast.success(`Exported ${uploadedRowsForExport.length} uploaded records`);
  };

  const handleExportError = () => {
    if (!errorRowsForExport.length) {
      toast.error("No error records available to export.");
      return;
    }

    const exportRows = buildExportRows(errorRowsForExport);
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const campaignLabel = selectedImport?.campaignId || "import";
    writeExcelFile(
      exportRows,
      "Error Data",
      `import_errors_${campaignLabel}_${timestamp}.xlsx`,
    );
    toast.success(`Exported ${errorRowsForExport.length} error records`);
  };

  const filteredDetailRows = useMemo(
    () =>
      detailRows.filter((row) =>
        applyAdvancedFilters(row, caseFilters, CASE_FILTER_RULES),
      ),
    [caseFilters, detailRows],
  );

  const paginatedDetailRows = filteredDetailRows
    .slice((pageNo - 1) * rowsPerPage, pageNo * rowsPerPage)
    .map((row, index) => ({
      ...row,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const detailColumns = useMemo(() => buildDetailColumns(detailRows), [detailRows]);

  if (selectedImport) {
    return (
      <section className="import-page-container">
        <div className="import-detail-header">
          <div className="import-detail-title">
            <Button
              variant="custom"
              size="md"
              className="import-back-btn"
              onClick={() => {
                setSelectedImport(null);
                setCaseFilters({});
                setPageNo(1);
              }}
            >
              <LuArrowLeft aria-hidden="true" />
              Back
            </Button>
            <div>
              <h5>{selectedImport.entityType}</h5>
              <p>Uploaded and error data details</p>
            </div>
          </div>

          <div className="import-detail-actions">
            <div className="import-detail-stats">
              <span className="detail-pill success">
                Uploaded: {selectedImport.uploadedCount}
              </span>
              <span className="detail-pill danger">
                Not Uploaded: {selectedImport.notUploadedCount}
              </span>
              <span className="detail-pill">
                Uploaded At: {selectedImport.uploadedAt}
              </span>
              <span className="detail-pill">
                Upload By: {selectedImport.uploadedBy}
              </span>
            </div>

            <div className="import-detail-export-actions">
              <Button
                variant="custom"
                size="lg"
                onClick={handleExportUploaded}
                className="d-flex align-items-center gap-1"
              >
                <FiDownload aria-hidden="true" />
                Export Uploaded
              </Button>
              <Button
                variant="custom"
                size="lg"
                onClick={handleExportError}
                className="d-flex align-items-center gap-1"
              >
                <FiDownload aria-hidden="true" />
                Export Errors
              </Button>
            </div>
          </div>
        </div>

        <div className="import-detail-tabs">
          <button
            type="button"
            className={detailTab === "uploaded" ? "active" : ""}
            onClick={() => {
              setDetailTab("uploaded");
              setPageNo(1);
            }}
          >
            Uploaded Data
          </button>
          <button
            type="button"
            className={detailTab === "error" ? "active" : ""}
            onClick={() => {
              setDetailTab("error");
              setPageNo(1);
            }}
          >
            Error Data
          </button>
        </div>

        <DataTable
          rowKey="id"
          wrapperClassName="import-table-wrap"
          className="import-table"
          columns={detailColumns}
          data={paginatedDetailRows}
          loading={detailLoading}
          emptyMessage={
            detailTab === "uploaded"
              ? "No uploaded data found"
              : "No error data found"
          }
        />

        <CustomPagination
          pageNo={pageNo}
          rowsPerPage={rowsPerPage}
          totalCount={detailRows.length}
          onPageChange={setPageNo}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPageNo(1);
          }}
        />

        <DeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleConfirmDelete}
          loading={deleteLoading}
          title="Are you sure you want to revert this import?"
          actionLabel="Revert"
          loadingLabel="Reverting..."
        />

      </section>
    );
  }

  return (
    <section className="import-page-container">
      <div className="import-page-top">
        <PageHeader
          title="Imports"
          subtitle="Build, group, and share insights from your CRM data."
          createLabel="Upload Doc"
          onCreate={() => navigate("/imports/upload")}
        />
        <Button
          variant="custom"
          size="lg"
          className="import-view-audit-btn d-flex align-items-center gap-1"
          onClick={() => navigate("/imports/audit")}
        >
          <LuClipboardList aria-hidden="true" />
          View Audit
        </Button>
      </div>

      <ListHeader
        className="import-list-header"
        selectValue={filterStatus}
        selectOptions={[
          { value: "All", label: "All" },

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
        showSearchButton={true}
        onFiltersClick={(e) => setFilterAnchor(e.currentTarget)}
        filterLabel="Filters"
      />

      {/* <FilterBar
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        config={filterConfig}
        filters={filters}
        onApply={handleApplyFilters}
        showButton={false}
      /> */}


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
        columns={columns}
        data={paginatedImports}
        loading={listLoading}
      />

      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleConfirmDelete}
        loading={deleteLoading}
        title="Are you sure you want to revert this import?"
        actionLabel="Revert"
        loadingLabel="Reverting..."
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

export default ImportHome;



