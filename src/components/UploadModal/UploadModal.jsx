import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "@/components/Button/Button";
import SelectInput from "@/components/SelectInput/SelectInput";
import { LuUpload, LuFile, LuX, LuLoader } from "react-icons/lu";
import "./UploadModal.scss";
import axiosInstance from "@/utils/axiosInstance";
import INCENTIVE_ENDPOINTS from "@/api/endpoints/incentiveEndpoints";
import CAMPAIGN_ENDPOINTS from "@/api/endpoints/campaignEndpoints";
import { filterActiveCampaigns } from "@/features/campaigns/campaignApi";
import toast from "react-hot-toast";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const ACCEPTED_MIME_TYPES =
  "text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const UploadModal = ({ show, onHide, onSuccess }) => {
  const [campaign, setCampaign] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [campaignOptions, setCampaignOptions] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  const uploadRef = useRef(null);

  // ── Fetch campaigns whenever modal opens ──────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await axiosInstance.get(CAMPAIGN_ENDPOINTS.LIST, {
        params: { status: "active" },
      });
      const data = res.data;

      // API returns { status, results, total, data: [...] }
      const list = filterActiveCampaigns(data?.data ?? []);
      const options = list.map((c) => ({
        value: c.campaignId,
        label: c.campaignId,
      }));
      setCampaignOptions(options);
    } catch (error) {
      console.error("Fetch campaigns error:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) fetchCampaigns();
  }, [show,fetchCampaigns]);

  // ── File helpers ──────────────────────────────────────────────────────────
  const isValidFile = (f) => {
    if (!f) return false;
    const name = f.name.toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  };

  const handleFileSelect = (selected) => {
    if (!selected) return;
    if (!isValidFile(selected)) {
      toast.error("Only CSV, XLSX and XLS files are supported");
      return;
    }
    setFile(selected);
  };

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!campaign) {
      toast.error("Please select a campaign");
      return;
    }
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("campaign", campaign);

      const res = await axiosInstance.post(
        INCENTIVE_ENDPOINTS.UPLOAD_INVENTIVE,
        formData,
        { headers: { "Content-Type": undefined } }
      );

      const data = res.data;

      if (data?.success) {
        toast.success(
          `Upload successful — ${data.uploaded ?? 0} uploaded, ${data.failed ?? 0} failed`
        );
        onSuccess?.();
        handleCancel();
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

  const handleCancel = () => {
    setCampaign("");
    setFile(null);
    setDragging(false);
    onHide();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      show={show}
      onHide={handleCancel}
      centered
      className="upload-modal"
      backdropClassName="upload-modal-backdrop"
       enforceFocus={false} 
    >
      <Modal.Header closeButton>
        <Modal.Title>Upload Slab</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Campaign Select */}
        <div className="form-field">
          <label className="field-label">Campaign</label>

          {campaignsLoading ? (
            <div className="campaigns-loading">
              <LuLoader className="loading-icon spin" />
              <span>Loading campaigns…</span>
            </div>
          ) : (
            <SelectInput
              value={campaign}
              options={campaignOptions}
              placeholder="Select Campaign"
              onChange={setCampaign}
              disabled={campaignsLoading || uploading}
            />
          )}
        </div>

        {/* File Upload Field */}
        <div className="form-field">
          <label className="field-label">File</label>

          <input
            ref={uploadRef}
            type="file"
            accept={ACCEPTED_MIME_TYPES}
            style={{ display: "none" }}
            onChange={handleInputChange}
          />

          {file ? (
            <div className="file-selected">
              <LuFile className="file-icon" />
              <span className="file-name" title={file.name}>
                {file.name}
              </span>
              <button
                className="file-remove"
                onClick={() => setFile(null)}
                disabled={uploading}
                aria-label="Remove file"
              >
                <LuX />
              </button>
            </div>
          ) : (
            <div
              className={`file-dropzone ${dragging ? "dragging" : ""}`}
              onClick={() => uploadRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <LuUpload className="dropzone-icon" />
              <p className="dropzone-primary">
                Click to upload or drag &amp; drop
              </p>
              <p className="dropzone-secondary">CSV, XLSX or XLS</p>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleCancel}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleUpload}
          disabled={uploading || campaignsLoading}
        >
          <LuUpload />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UploadModal;
