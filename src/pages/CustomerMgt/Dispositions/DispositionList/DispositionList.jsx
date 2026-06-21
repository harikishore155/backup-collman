// import { useCallback, useEffect, useMemo, useState } from "react";
// import toast from "react-hot-toast";
// import CustomPagination from "@/components/CustomPagination/CustomPagination";
// import DataTable from "@/components/DataTable/DataTable";
// import FilterBar from "@/components/FilterBar/FilterBar";
// import ListHeader from "@/components/ListHeader/ListHeader";
// import PageHeader from "@/components/PageHeader/PageHeader";
// import { fetchDispositionsApi } from "@/features/dispositions/dispositionApi";
// import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
// import {
//   applyAdvancedFilters,
//   buildUniqueSelectOptions,
// } from "@/utils/listFilterHelpers";
// import "./DispositionList.scss";

// const EMPTY_VALUE = "-";

// const readValue = (record, keys, fallback = EMPTY_VALUE) => {
//   for (const key of keys) {
//     const value = record?.[key];
//     if (value == null || value === "") continue;
//     if (typeof value === "object") {
//       return String(
//         value.name ??
//           value.fullName ??
//           value.full_name ??
//           value.code ??
//           value.campaignId ??
//           value.campaign_id ??
//           value._id ??
//           fallback,
//       );
//     }
//     return String(value);
//   }
//   return fallback;
// };

// const formatDate = (value) => {
//   if (!value || value === EMPTY_VALUE) return EMPTY_VALUE;
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return String(value);
//   return new Intl.DateTimeFormat("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   }).format(date);
// };

// const mapDispositionRow = (raw, index, type) => ({
//   _id: readValue(raw, ["_id", "id", "uuid"], `row_${index}`),
//   customerName: readValue(raw, [
//     "customerName",
//     "customer_name",
//     "name",
//     "customer",
//   ]),
//   accountNumber: readValue(raw, [
//     "accountNumber",
//     "account_number",
//     "accountNo",
//     "account_no",
//     "loanAccountNumber",
//   ]),
//   campaignId: readValue(raw, [
//     "campaignId",
//     "campaign_id",
//     "campaign",
//     "allocation",
//   ]),
//   product: readValue(raw, ["product", "productName", "product_name"]),
//   bucket: readValue(raw, ["bucket", "dpd", "bkt", "bucketName"]),
//   disposition: readValue(raw, [
//     "disposition",
//     "dispositionName",
//     "disposition_name",
//     "contactStatus",
//     "contact_status",
//   ]),
//   status: readValue(raw, ["status", "caseStatus", "case_status"]),
//   assignedTo: readValue(raw, [
//     "assignedTo",
//     "assigned_to",
//     "employee",
//     "employeeName",
//     "employee_name",
//     "user",
//   ]),
//   updatedAt: formatDate(
//     readValue(raw, [
//       "dispositionDate",
//       "disposition_date",
//       "updatedAt",
//       "updated_at",
//       "createdAt",
//       "created_at",
//     ]),
//   ),
//   type,
// });

// const selectFilter = (key, label, rows) => ({
//   key,
//   label,
//   type: "select",
//   multiple: true,
//   options: buildUniqueSelectOptions(rows, (row) => row[key]),
// });

// const FILTER_RULES = [
//   { key: "campaignId", getValue: (row) => row.campaignId },
//   { key: "product", getValue: (row) => row.product },
//   { key: "bucket", getValue: (row) => row.bucket },
//   { key: "disposition", getValue: (row) => row.disposition },
//   { key: "status", getValue: (row) => row.status },
//   { key: "assignedTo", getValue: (row) => row.assignedTo },
// ];

// const DispositionList = ({ type }) => {
//   const normalizedType = String(type).toUpperCase();
//   const title = `${normalizedType} Dispositions`;
//   const [rows, setRows] = useState([]);
//   const [listLoading, setListLoading] = useState(true);
//   const [pageNo, setPageNo] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterAnchor, setFilterAnchor] = useState(null);
//   const [filters, setFilters] = useState({});

//   const fetchRows = useCallback(async () => {
//     try {
//       setListLoading(true);
//       const data = await fetchDispositionsApi(normalizedType);

//       if (isApiFailure(data)) {
//         toast.error(data?.message || `Failed to load ${title}`);
//         setRows([]);
//         return;
//       }

//       const { rows: dispositionRows } = extractListPayload(data);
//       setRows(
//         dispositionRows.map((record, index) =>
//           mapDispositionRow(record, index, normalizedType),
//         ),
//       );
//     } catch (error) {
//       toast.error(
//         error?.response?.data?.message ||
//           error?.message ||
//           `Failed to load ${title}`,
//       );
//       setRows([]);
//     } finally {
//       setListLoading(false);
//     }
//   }, [normalizedType, title]);

//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     fetchRows();
//   }, [fetchRows]);

//   const filteredRows = useMemo(() => {
//     const search = searchTerm.trim().toLowerCase();
//     return rows.filter((row) => {
//       const matchesSearch =
//         !search ||
//         Object.values(row).some((value) =>
//           String(value).toLowerCase().includes(search),
//         );
//       return matchesSearch && applyAdvancedFilters(row, filters, FILTER_RULES);
//     });
//   }, [filters, rows, searchTerm]);

//   const filterConfig = useMemo(
//     () =>
//       FILTER_RULES.map(({ key }) =>
//         selectFilter(
//           key,
//           {
//             campaignId: "Campaign",
//             product: "Product",
//             bucket: "Bucket",
//             disposition: "Disposition",
//             status: "Status",
//             assignedTo: "Assigned To",
//           }[key],
//           rows,
//         ),
//       ).filter((filter) => filter.options.length > 0),
//     [rows],
//   );

//   const columns = [
//     { key: "sno", title: "S.No", dataIndex: "sno" },
//     { key: "customerName", title: "Customer Name", dataIndex: "customerName" },
//     { key: "accountNumber", title: "Account No", dataIndex: "accountNumber" },
//     { key: "campaignId", title: "Campaign ID", dataIndex: "campaignId" },
//     { key: "product", title: "Product", dataIndex: "product" },
//     { key: "bucket", title: "Bucket", dataIndex: "bucket" },
//     {
//       key: "disposition",
//       title: "Disposition",
//       render: (_, row) => (
//         <span className="disposition-badge">{row.disposition}</span>
//       ),
//     },
//     { key: "status", title: "Status", dataIndex: "status" },
//     { key: "assignedTo", title: "Assigned To", dataIndex: "assignedTo" },
//     { key: "updatedAt", title: "Disposition Date", dataIndex: "updatedAt" },
//   ];

//   const paginatedRows = filteredRows
//     .slice((pageNo - 1) * rowsPerPage, pageNo * rowsPerPage)
//     .map((row, index) => ({
//       ...row,
//       sno: (pageNo - 1) * rowsPerPage + index + 1,
//     }));

//   const handleExport = () => {
//     if (!filteredRows.length) {
//       toast.info(
//         `No ${normalizedType} disposition records available to export.`,
//       );
//       return;
//     }

//     const headers = columns
//       .filter((column) => column.key !== "sno")
//       .map((column) => column.title);
//     const keys = columns
//       .filter((column) => column.key !== "sno")
//       .map((column) => column.key);
//     const escapeCell = (value) =>
//       `"${String(value === EMPTY_VALUE ? "" : (value ?? "")).replace(/"/g, '""')}"`;
//     const csv = [
//       ["S.No", ...headers].map(escapeCell).join(","),
//       ...filteredRows.map((row, index) =>
//         [index + 1, ...keys.map((key) => row[key])].map(escapeCell).join(","),
//       ),
//     ].join("\r\n");

//     const url = URL.createObjectURL(
//       new Blob([csv], { type: "text/csv;charset=utf-8;" }),
//     );
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `${normalizedType.toLowerCase()}-dispositions.csv`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <section className="disposition-page-container">
//       <PageHeader
//         title={title}
//         subtitle={`View, search and export all ${normalizedType} disposition records`}
//         breadcrumbItems={[{ label: "Home" }, { label: title }]}
//         exportLabel="Export"
//         onExport={handleExport}
//       />

//       <ListHeader
//         searchValue={searchTerm}
//         onSearchChange={(event) => {
//           setSearchTerm(event.target.value);
//           setPageNo(1);
//         }}
//         searchPlaceholder="Search..."
//         showSearchButton={true}
//         onSearch={() => setPageNo(1)}
//         onFiltersClick={(event) => setFilterAnchor(event.currentTarget)}
//         filterLabel="Filters"
//       />

//       <FilterBar
//         anchorEl={filterAnchor}
//         onClose={() => setFilterAnchor(null)}
//         config={filterConfig}
//         filters={filters}
//         onApply={(newFilters) => {
//           setFilters(newFilters);
//           setPageNo(1);
//         }}
//         showButton={false}
//       />

//       <DataTable
//         rowKey="_id"
//         wrapperClassName="disposition-table-wrap"
//         className="disposition-table"
//         columns={columns}
//         data={paginatedRows}
//         loading={listLoading}
//       />

//       <CustomPagination
//         pageNo={pageNo}
//         rowsPerPage={rowsPerPage}
//         totalCount={filteredRows.length}
//         onPageChange={setPageNo}
//         onRowsPerPageChange={(value) => {
//           setRowsPerPage(value);
//           setPageNo(1);
//         }}
//       />
//     </section>
//   );
// };

// export default DispositionList;



import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import DataTable from "@/components/DataTable/DataTable";
import FilterBar from "@/components/FilterBar/FilterBar";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import { fetchDispositionsApi } from "@/features/dispositions/dispositionApi";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import {
  applyAdvancedFilters,
  buildListQueryParams,
  buildUniqueSelectOptions,
  normalizeListQueryFilters,
} from "@/utils/listFilterHelpers";
import "./DispositionList.scss";

const EMPTY_VALUE = "-";

const readValue = (record, keys, fallback = EMPTY_VALUE) => {
  for (const key of keys) {
    const value = record?.[key];
    if (value == null || value === "") continue;
    if (typeof value === "object") {
      return String(
        value.name ??
          value.fullName ??
          value.full_name ??
          value.code ??
          value.campaignId ??
          value.campaign_id ??
          value._id ??
          fallback,
      );
    }
    return String(value);
  }
  return fallback;
};

const formatDate = (value) => {
  if (!value || value === EMPTY_VALUE) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatCurrency = (value) => {
  if (value == null || value === "" || value === EMPTY_VALUE) return EMPTY_VALUE;
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

const mapDispositionRow = (raw, index, type) => ({
  _id: readValue(raw, ["_id", "id", "uuid"], `row_${index}`),

  customerName: readValue(raw, ["customerName", "customer_name", "name", "customer"]),
  accountNumber: readValue(raw, ["accountNumber", "account_number", "accountNo", "account_no", "loanAccountNumber"]),
  campaignId: readValue(raw, ["campaignId", "campaign_id", "campaign", "allocation"]),
  product: readValue(raw, ["product", "productName", "product_name"]),
  bucket: readValue(raw, ["bucket", "dpd", "bkt", "bucketName"]),
  disposition: readValue(raw, ["disposition", "dispositionName", "disposition_name", "contactStatus", "contact_status"]),
  status: readValue(raw, ["status", "caseStatus", "case_status", "contactStatus", "contact_status"]),
  assignedTo: readValue(raw, ["assignedTo", "assigned_to", "employee", "employeeName", "employee_name", "user"]),
  updatedAt: formatDate(readValue(raw, ["dispositionDate", "disposition_date", "updatedAt", "updated_at"])),

  // ── this was missing ──────────────────────────────────────────
  contactStatus: raw?.contactStatus ?? raw?.contact_status ?? null,

  paidAmount: raw?.paidAmount != null && raw.paidAmount !== "" ? formatCurrency(raw.paidAmount) : EMPTY_VALUE,
  paidDate: formatDate(readValue(raw, ["paidDate", "paid_date"])),
  ptpAmount: raw?.ptpAmount != null && raw.ptpAmount !== "" ? formatCurrency(raw.ptpAmount) : EMPTY_VALUE,
  ptpDate: formatDate(readValue(raw, ["ptpDate", "ptp_date"])),
  paidType: readValue(raw, ["paidType", "paid_type", "paymentType", "payment_type"]),
  allocation: readValue(raw, ["allocation", "allocationId", "allocation_id", "campaignId", "campaign_id"]),
  createdAt: formatDate(readValue(raw, ["createdAt", "created_at"])),

  type,
});
const selectFilter = (key, label, rows) => ({
  key,
  label,
  type: "select",
  multiple: true,
  options: buildUniqueSelectOptions(rows, (row) => row[key]),
});

const FILTER_RULES = [
  { key: "disposition", getValue: (row) => row.disposition },
  { key: "status",      getValue: (row) => row.status      },
  { key: "paidType",    getValue: (row) => row.paidType    },
  { key: "allocation",  getValue: (row) => row.allocation  },
];

const FILTER_LABELS = {
  disposition: "Disposition",
  status:      "Status",
  paidType:    "Paid Type",
  allocation:  "Allocation",
};

const DispositionList = ({ type }) => {
  const [contactFilter, setContactFilter] = useState("ALL");
  const normalizedType = String(type).toUpperCase();
  const title = `${normalizedType} Dispositions`;
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});

  const fetchRows = useCallback(async () => {
    try {
      setListLoading(true);
      const data = await fetchDispositionsApi(normalizedType, {
        ...buildListQueryParams({
          searchTerm,
          pageNo,
          rowsPerPage,
          withPagination: true,
        }),
        ...(contactFilter !== "ALL" ? { contactStatus: contactFilter } : {}),
        ...normalizeListQueryFilters(filters),
      });

      if (isApiFailure(data)) {
        toast.error(data?.message || `Failed to load ${title}`);
        setRows([]);
        setTotalRows(0);
        return;
      }

      const { rows: dispositionRows, total } = extractListPayload(data);
      setRows(
        dispositionRows.map((record, index) =>
          mapDispositionRow(record, index, normalizedType),
        ),
      );
      setTotalRows(total);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to load ${title}`,
      );
      setRows([]);
      setTotalRows(0);
    } finally {
      setListLoading(false);
    }
  }, [contactFilter, filters, normalizedType, pageNo, rowsPerPage, searchTerm, title]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRows();
  }, [fetchRows]);

const filteredRows = useMemo(() => {
  const search = searchTerm.trim().toLowerCase();
  return rows.filter((row) => {
    const matchesSearch =
      !search ||
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(search),
      );

    const matchesContact =
      contactFilter === "ALL" ||
      (contactFilter === "Contacted"
        ? row.contactStatus === "Contacted"
        : row.contactStatus !== "Contacted");

    return matchesSearch && matchesContact && applyAdvancedFilters(row, filters, FILTER_RULES);
  });
}, [filters, rows, searchTerm, contactFilter]);

  const filterConfig = useMemo(
    () =>
      FILTER_RULES.map(({ key }) =>
        selectFilter(key, FILTER_LABELS[key], rows),
      ).filter((filter) => filter.options.length > 0),
    [rows],
  );

const columns = [
  { key: "sno",          title: "S.No",         dataIndex: "sno"          },
  { key: "customerName", title: "Customer Name", dataIndex: "customerName" },
  { key: "status",       title: "Status",        dataIndex: "status"       },
  { key: "paidAmount",   title: "Paid Amount",   dataIndex: "paidAmount"   },
  { key: "paidDate",     title: "Paid Date",     dataIndex: "paidDate"     },
  { key: "ptpAmount",    title: "PTP Amount",    dataIndex: "ptpAmount"    },
  { key: "ptpDate",      title: "PTP Date",      dataIndex: "ptpDate"      },
  { key: "paidType",     title: "Paid Type",     dataIndex: "paidType"     },
  { key: "allocation",   title: "Allocation",    dataIndex: "allocation"   },
  { key: "createdAt",    title: "Created At",    dataIndex: "createdAt"    },
];
  const paginatedRows = filteredRows
    .map((row, index) => ({
      ...row,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const handleExport = () => {
    if (!filteredRows.length) {
      toast.info(
        `No ${normalizedType} disposition records available to export.`,
      );
      return;
    }

    const exportColumns = columns.filter((col) => col.key !== "sno");
    const headers  = exportColumns.map((col) => col.title);
    const keys     = exportColumns.map((col) => col.key);

    const escapeCell = (value) =>
      `"${String(value === EMPTY_VALUE ? "" : (value ?? "")).replace(/"/g, '""')}"`;

    const csv = [
      ["S.No", ...headers].map(escapeCell).join(","),
      ...filteredRows.map((row, index) =>
        [index + 1, ...keys.map((key) => row[key])].map(escapeCell).join(","),
      ),
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${normalizedType.toLowerCase()}-dispositions.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="disposition-page-container">
      <PageHeader
        title={title}
        subtitle={`View, search and export all ${normalizedType} disposition records`}
        breadcrumbItems={[{ label: "Home" }, { label: title }]}
        exportLabel="Export"
        onExport={handleExport}
      />

<ListHeader
  searchValue={searchTerm}
  onSearchChange={(event) => {
    setSearchTerm(event.target.value);
    setPageNo(1);
  }}
  searchPlaceholder="Search..."
  showSearchButton={true}
  onSearch={() => setPageNo(1)}
  onFiltersClick={(event) => setFilterAnchor(event.currentTarget)}
  filterLabel="Filters"
  selectValue={contactFilter}
  onSelectChange={(value) => {
    setContactFilter(value);
    setPageNo(1);
  }}
  selectOptions={[
    { label: "All",          value: "ALL"         },
    { label: "Contacted",    value: "Contacted"   },
    { label: "Uncontacted",  value: "Uncontacted" },
  ]}
/>

      <FilterBar
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        config={filterConfig}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setPageNo(1);
        }}
        showButton={false}
      />

      <DataTable
        rowKey="_id"
        wrapperClassName="disposition-table-wrap"
        className="disposition-table"
        columns={columns}
        data={paginatedRows}
        loading={listLoading}
      />

      <CustomPagination
        pageNo={pageNo}
        rowsPerPage={rowsPerPage}
        totalCount={totalRows}
        onPageChange={setPageNo}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPageNo(1);
        }}
      />
    </section>
  );
};

export default DispositionList;
