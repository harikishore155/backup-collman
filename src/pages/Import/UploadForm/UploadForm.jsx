import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import toast from "react-hot-toast";
import Button from "../../../components/Button/Button";
import { fetchFieldsApi } from "@/features/fields/fieldApi";
import { pickCsvColumns } from "@/features/caseUploads/caseUploadMappers";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import { buildListQueryParams } from "@/utils/listFilterHelpers";
import "../UploadPage/UploadPage.scss";
import "./UploadForm.scss";

const UPLOAD_STEPS = ["Import & Properties", "Field Mapping", "Preview"];
const ACTIVE_STEP = 1;

const mapFieldRow = (raw, index) => {
  const id = raw?._id ?? raw?.id ?? raw?.field_id ?? `field_${index}`;
  const fieldName = raw?.fieldName ?? raw?.field_name ?? raw?.name ?? "";

  return {
    id: String(id),
    fieldName: fieldName ? String(fieldName) : "—",
  };
};

const UploadForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadResult = location.state?.uploadResult;
  const campaignId = location.state?.campaignId;

  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [columnMappings, setColumnMappings] = useState({});

  const csvColumnOptions = useMemo(() => {
    const columns = pickCsvColumns(uploadResult, campaignId);
    return [{ label: "Select column", value: "" }, ...columns];
  }, [uploadResult, campaignId]);

  useEffect(() => {
    if (!uploadResult) {
      toast.error("Upload a file first to map fields");
      navigate("/imports/upload", { replace: true });
    }
  }, [uploadResult, navigate]);

  useEffect(() => {
    const fetchFields = async () => {
      setFieldsLoading(true);

      try {
        const data = await fetchFieldsApi(
          buildListQueryParams({ filterStatus: "Active" }),
        );

        if (isApiFailure(data)) {
          toast.error(data?.message || data?.error || "Failed to load fields");
          setFields([]);
          return;
        }

        const { rows } = extractListPayload(data);
        setFields(rows.map(mapFieldRow));
      } catch (error) {
        console.error("Failed to fetch fields:", error);
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.detail ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load fields";
        toast.error(typeof msg === "string" ? msg : "Failed to load fields");
        setFields([]);
      } finally {
        setFieldsLoading(false);
      }
    };

    fetchFields();
  }, []);

  const handleMappingChange = (fieldId, csvColumn) => {
    setColumnMappings((prev) => ({
      ...prev,
      [fieldId]: csvColumn,
    }));
  };

  const handlePreview = () => {
    navigate("/customer-mgt/customers", {
      state: {
        ...location.state,
        columnMappings,
      },
    });
  };

  if (!uploadResult) {
    return null;
  }

  return (
    <section className="upload-page-container uf-page">
      <div className="upload-header-container">
        <div className="upload-header">
          <h4 className="upload-title">Upload</h4>
          <p className="upload-subtitle">
            Bring records into the CRM from a CSV file.
          </p>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate("/imports/upload")}
          >
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={handlePreview}>
            Preview
          </Button>
        </div>
      </div>

      <div className="upload-stepper">
        <Box sx={{ width: "100%" }}>
          <Stepper activeStep={ACTIVE_STEP} alternativeLabel>
            {UPLOAD_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </div>

      <div className="uf-card">
        <div className="uf-card-head">
          <p className="uf-card-title">Map column to field</p>
        </div>

        <div className="uf-table-wrap">
          <div className="uf-table-head">
            <span className="uf-col-label uf-col-sno">S.No</span>
            <span className="uf-col-label">Fields</span>
            <span className="uf-col-label">CSV Column</span>
          </div>

          <div className="uf-table-body">
            {fieldsLoading ? (
              <div className="uf-table-row uf-table-row-last">
                <span className="uf-row-sno uf-row-muted">—</span>
                <span className="uf-row-field uf-row-muted">
                  Loading fields…
                </span>
                <span className="uf-row-muted">—</span>
              </div>
            ) : fields.length === 0 ? (
              <div className="uf-table-row uf-table-row-last">
                <span className="uf-row-sno uf-row-muted">—</span>
                <span className="uf-row-field uf-row-muted">
                  No fields found
                </span>
                <span className="uf-row-muted">—</span>
              </div>
            ) : (
              fields.map((row, index) => (
                <div
                  key={row.id}
                  className={`uf-table-row ${index === fields.length - 1 ? "uf-table-row-last" : ""}`}
                >
                  <span className="uf-row-sno">{index + 1}</span>
                  <span className="uf-row-field">{row.fieldName}</span>

                  <span>View</span>
                  {/* <div className="uf-row-dropdown">
                    <Dropdown
                      value={columnMappings[row.id] ?? ""}
                      options={csvColumnOptions}
                      placeholder={
                        csvColumnOptions.length > 1
                          ? "Select column"
                          : "No columns in upload"
                      }
                      onChange={(val) => handleMappingChange(row.id, val)}
                      disabled={
                        fieldsLoading || csvColumnOptions.length <= 1
                      }
                    />
                  </div> */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UploadForm;
