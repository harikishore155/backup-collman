import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import SelectInput from "@/components/SelectInput/SelectInput";
import Button from "../../../components/Button/Button";
import UploadCanvas from "../../../components/UploadCanvas/UploadCanvas";
import axiosInstance from "@/utils/axiosInstance";
import CASE_UPLOAD_ENDPOINTS from "@/api/endpoints/caseuploadEndpoints";
import { fetchCampaignsApi } from "@/features/campaigns/campaignApi";
import {
  formatCampaignOptionLabel,
  readCampaignMongoId,
} from "@/features/targets/targetMappers";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import toast from "react-hot-toast";
import "./UploadPage.scss";
import { LuCloudUpload, LuFileText, LuSlidersHorizontal } from "react-icons/lu";
import { IoCloseCircleOutline } from "react-icons/io5";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

const ACCEPTED_MIME_TYPES =
  "text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const steps = ["Import & Properties", "Field Mapping", "Preview"];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const getCurrentMonthYear = () => {
  const now = new Date();
  return `${MONTH_SHORT[now.getMonth()]} ${now.getFullYear()}`;
};

const UploadPage = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // ── Campaign state ─────────────────────────────────────────────
  const [allCampaigns, setAllCampaigns] = useState([]);        // raw API rows
  const [campaignOptions, setCampaignOptions] = useState([]);  // filtered options for the dropdown
  const [campaign, setCampaign] = useState("");
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [entityType, setEntityType] = useState("Case Upload");

  // ── Filter / canvas state ──────────────────────────────────────
  const [showCanvas, setShowCanvas] = useState(false);
  const [filters, setFilters] = useState({
    bank: "",
    teamLeader: "",
    monthYear: getCurrentMonthYear(),
  });

  // ── Upload state ───────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Fetch campaigns ────────────────────────────────────────────
  const fetchCampaigns = async () => {
    setCampaignsLoading(true);

    try {
      const data = await fetchCampaignsApi();

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to load campaigns");
        setAllCampaigns([]);
        setCampaignOptions([]);
        return;
      }

      const { rows } = extractListPayload(data);
      setAllCampaigns(rows);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load campaigns";
      toast.error(typeof msg === "string" ? msg : "Failed to load campaigns");
    } finally {
      setCampaignsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // ── Compute filtered campaign options whenever raw data or filters change ──
  useEffect(() => {
    const { bank, teamLeader, monthYear } = filters;

    const filtered = allCampaigns.filter((c) => {
      if (bank) {
        const clientId = c.clientId?._id ?? c.clientId;
        if (String(clientId) !== String(bank)) return false;
      }
      if (teamLeader) {
        const tlId = c.teamLeaderId?._id ?? c.teamLeaderId;
        if (String(tlId) !== String(teamLeader)) return false;
      }
      if (monthYear) {
        const m = c.monthYear ?? c.month_year;
        if (m !== monthYear) return false;
      }
      return true;
    });

    const options = filtered
      .map((c) => {
        const value = readCampaignMongoId(c);
        if (!value) return null;
        return {
          label: formatCampaignOptionLabel(c),
          value,
        };
      })
      .filter(Boolean);

    setCampaignOptions(options);

    // reset selected campaign if it's no longer in the filtered list
    if (campaign && !options.find((o) => o.value === campaign)) {
      setCampaign("");
    }
  }, [allCampaigns, filters]);

  // ── Active filter count ────────────────────────────────────────
  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  // ── File validation ────────────────────────────────────────────
  const isValidFile = (f) => {
    if (!f) return false;
    const name = f.name.toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  };

  const handleFile = (f) => {
    if (isValidFile(f)) {
      setFile(f);
    } else if (f) {
      toast.error("Only CSV, XLSX and XLS files are supported");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Upload ─────────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!campaign) {
      toast.error("Please select a campaign");
      return;
    }

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axiosInstance.post(
        CASE_UPLOAD_ENDPOINTS.CREATE(campaign),
        formData,
        { headers: { "Content-Type": undefined } },
      );

      const data = res.data;
      if (data?.success) {
        toast.success(
          `Upload complete — ${data.uploaded ?? 0} uploaded, ${data.failed ?? 0} failed`,
        );

        const selectedCampaign = campaignOptions.find((c) => c.value === campaign);

        navigate("/imports/upload/form", {
          state: {
            uploadResult: data,
            campaignId: campaign,
            campaignLabel: selectedCampaign?.label ?? "",
          },
        });
      } else {
        toast.error(data?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);

      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Upload failed";

      toast.error(typeof msg === "string" ? msg : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="upload-page-container">
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
            onClick={() => navigate("/imports")}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            disabled={uploading || !campaign || !file}
          >
            {uploading ? "Uploading…" : "Continue"}
          </Button>
        </div>
      </div>

      {/* ── Stepper ── */}
      <div className="upload-stepper">
        <Box sx={{ width: "100%" }}>
          <Stepper activeStep={0} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </div>

      {/* ── What To Import ── */}
      <div className="upload-card">
        <div className="card-head">
          <p className="card-head-title">What To Import?</p>
        </div>

        <div className="card-body">
          <div className="fields-grid">
            <div className="field-col">
              <label className="field-label">Entity Type</label>
              <SelectInput
                value={entityType}
                options={[{ label: "Case Upload", value: "Case Upload" }]}
                placeholder="Select Entity Type"
                onChange={(val) => setEntityType(val)}
                searchable={false}
              />
            </div>

            <div className="field-col">
              <label className="field-label">Select Campaign</label>

              <div className="campaign-field-row">
                <SelectInput
                  value={campaign}
                  options={campaignOptions}
                  placeholder={
                    campaignsLoading ? "Loading campaigns..." : "Select Campaign"
                  }
                  onChange={(val) => setCampaign(val)}
                  disabled={campaignsLoading}
                />

                {/* ── Filter button ── */}
                <button
                  type="button"
                  className={`filter-icon-btn ${activeFilterCount > 0 ? "has-filters" : ""}`}
                  onClick={() => setShowCanvas(true)}
                  title="Filter campaigns"
                >
                  <LuSlidersHorizontal size={16} />
                  {activeFilterCount > 0 && (
                    <span className="filter-dot">{activeFilterCount}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Upload File ── */}
      <div className="upload-card">
        <div className="card-head">
          <p className="card-head-title">Upload your file</p>
        </div>

        <div className="card-body">
          <div
            className={`upload-zone ${dragOver ? "upload-zone-drag" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
            <span className="upload-zone-icon">
              <LuCloudUpload size={40} />
            </span>

            <p className="upload-zone-text">
              Upload CSV / Excel File &amp;{" "}
              <span className="upload-zone-link">Browse file</span>
            </p>

            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_MIME_TYPES}
              hidden
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {file && (
            <div className="file-pill">
              <span className="file-pill-icon">
                <LuFileText size={20} />
              </span>

              <div className="file-pill-info">
                <span className="file-pill-name">{file.name}</span>
                <small className="file-pill-meta">
                  {(file.size / 1024).toFixed(1)} KB
                </small>
              </div>

              <button
                className="file-pill-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                <IoCloseCircleOutline size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter Offcanvas ── */}
      <UploadCanvas
        show={showCanvas}
        onHide={() => setShowCanvas(false)}
        campaigns={allCampaigns}
        activeFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />
    </section>
  );
};

export default UploadPage;
