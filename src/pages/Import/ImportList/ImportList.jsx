import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiPhone } from "react-icons/fi";
import toast from "react-hot-toast";
import { fetchCaseUploadCampaignsApi } from "@/features/caseUploads/caseUploadApi";
import {
  mapImportPreviewRow,
  pickPreviewMeta,
  pickPreviewRows,
} from "@/features/caseUploads/caseUploadMappers";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import Button from "@/components/Button/Button";
import { isApiFailure } from "@/utils/apiHelpers";
import { buildListQueryParams } from "@/utils/listFilterHelpers";
import "./ImportList.scss";

const STEPPER_STEPS = [
  { label: "Import & Properties" },
  { label: "Field Mapping" },
  { label: "Preview" },
];

const columns = [
  { key: "sno", title: "S.No", dataIndex: "sno" },
  { key: "campaignCode", title: "Campaign", dataIndex: "campaignCode" },
  {
    key: "lastUploadedAt",
    title: "Last Uploaded At",
    dataIndex: "lastUploadedAt",
  },
  {
    key: "customer",
    title: "Customer",
    render: (_, row) => (
      <div className="name-cell">
        <strong>{row.customerName}</strong>
        {row.customerCode ? (
          <span className="name-code">{row.customerCode}</span>
        ) : null}
      </div>
    ),
  },
  {
    key: "contact",
    title: "Contact",
    render: (_, row) => (
      <>
        <span className="contact-line">
          <FiPhone />
          {row.phone}
        </span>
        <span className="contact-line contact-mail">
          <FiMail />
          {row.email}
        </span>
      </>
    ),
  },
  { key: "product", title: "Product", dataIndex: "product" },
  {
    key: "outstandingAmt",
    title: "Outstanding amt",
    dataIndex: "outstandingAmt",
  },
  {
    key: "status",
    title: "Status",
    render: (_, row) => {
      const statusClass = String(row.status ?? "")
        .toLowerCase()
        .replace(/\s+/g, "-");
      return (
        <span className={`status-badge ${statusClass}`}>{row.status}</span>
      );
    },
  },
];

const ImportList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadResult = location.state?.uploadResult;
  const campaignId = location.state?.campaignId;
  const campaignLabel = location.state?.campaignLabel ?? "";

  const [imports, setImports] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [previewMeta, setPreviewMeta] = useState({ totalRows: 0, totalColumns: 0 });
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const activeStep = 3;

  const fetchImports = async () => {
    try {
      setListLoading(true);

      if (uploadResult) {
        const rows = pickPreviewRows(uploadResult, campaignId);
        setImports(rows.map((row, index) => mapImportPreviewRow(row, index, campaignLabel)));
        setPreviewMeta(pickPreviewMeta(uploadResult, rows.length));
        return;
      }

      const data = await fetchCaseUploadCampaignsApi({
        ...buildListQueryParams({
          pageNo,
          rowsPerPage,
          withPagination: true,
        }),
        ...(campaignId ? { campaign_id: campaignId } : {}),
      });

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to load import preview");
        setImports([]);
        setPreviewMeta({ totalRows: 0, totalColumns: 0 });
        return;
      }

      const rows = pickPreviewRows(data, campaignId);
      setImports(rows.map((row, index) => mapImportPreviewRow(row, index, campaignLabel)));
      setPreviewMeta(pickPreviewMeta(data, rows.length));
    } catch (error) {
      console.error("Failed to fetch import preview", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load import preview";
      toast.error(typeof msg === "string" ? msg : "Failed to load import preview");
      setImports([]);
      setPreviewMeta({ totalRows: 0, totalColumns: 0 });
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchImports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadResult, campaignId, campaignLabel, pageNo, rowsPerPage]);

  const totalCount = previewMeta.totalRows || imports.length;
  const visibleImports = uploadResult
    ? imports.slice((pageNo - 1) * rowsPerPage, pageNo * rowsPerPage)
    : imports;
  const paginatedImports = useMemo(
    () =>
      visibleImports.map((item, index) => ({
        ...item,
        sno: (pageNo - 1) * rowsPerPage + index + 1,
      })),
    [visibleImports, pageNo, rowsPerPage],
  );

  const { totalRows, totalColumns } = previewMeta;

  return (
    <section className="import-list">
      <div className="import-header">
        <h4 className="import-title">Upload</h4>
        <p className="import-subtitle">
          Bring records into the CRM from a CSV file.
        </p>
      </div>

      <div className="import-stepper">
        <div className="stepper-steps">
          {STEPPER_STEPS.map((step, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === activeStep;
            const isDone = stepNum < activeStep;
            return (
              <div key={step.label} className="stepper-item">
                {i > 0 && <span className="stepper-arrow">›</span>}
                <div
                  className={[
                    "step",
                    isActive && "step-active",
                    isDone && "step-done",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="step-num">{stepNum}</span>
                  <span className="step-label">{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="stepper-meta">
          <span className="row-pill">Total Rows: {totalRows || totalCount}</span>
          <span className="column-pill">
            Total Column: {totalColumns || "—"}
          </span>
          <Button
            variant="custom"
            size="md"
            onClick={() => navigate("/imports/upload/form", { state: location.state })}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate("/imports")}
          >
            Import Now
          </Button>
        </div>
      </div>

      <div className="import-card">
        <div className="import-card-head">
          <span className="map-label">Map column to field</span>
        </div>

        <DataTable
          wrapperClassName="import-table-wrap"
          columns={columns}
          data={paginatedImports}
          loading={listLoading}
        />

        <div className="import-pagination">
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
        </div>
      </div>
    </section>
  );
};

export default ImportList;
