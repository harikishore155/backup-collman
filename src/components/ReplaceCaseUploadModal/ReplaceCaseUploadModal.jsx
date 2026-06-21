import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "react-bootstrap/Modal";
import toast from "react-hot-toast";
import { LuUpload, LuFile, LuX, LuLoader } from "react-icons/lu";
import Button from "@/components/Button/Button";
import SelectInput from "@/components/SelectInput/SelectInput";
import { replaceCaseUploadApi } from "@/features/caseUploads/caseUploadApi";
import { fetchCampaignsApi } from "@/features/campaigns/campaignApi";
import {
  formatCampaignOptionLabel,
  readCampaignMongoId,
} from "@/features/targets/targetMappers";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import "./ReplaceCaseUploadModal.scss";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const ACCEPTED_MIME_TYPES =
  "text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const ReplaceCaseUploadModal = ({
  show,
  onClose,
  initialCampaignId = "",
  onSuccess,
}) => {
  const fileRef = useRef(null);
  const [campaignId, setCampaignId] = useState("");
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch campaigns whenever modal opens ──────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const data = await fetchCampaignsApi();
      if (isApiFailure(data)) {
        toast.error(data?.message || "Failed to load campaigns");
        setCampaignOptions([]);
        return;
      }
      const { rows } = extractListPayload(data);
      setCampaignOptions(
        rows
          .map((campaign) => {
            const value = readCampaignMongoId(campaign);
            if (!value) return null;
            return {
              value: String(value),
              label: formatCampaignOptionLabel(campaign),
            };
          })
          .filter(Boolean),
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load campaigns"));
      setCampaignOptions([]);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    setCampaignId(initialCampaignId ? String(initialCampaignId) : "");
    setFile(null);
    setDragging(false);
    fetchCampaigns();
  }, [show, initialCampaignId, fetchCampaigns]);

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

  // ── Cancel — reset all state then close ───────────────────────────────────
  const handleCancel = () => {
    setCampaignId("");
    setFile(null);
    setDragging(false);
    onClose();
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!campaignId) {
      toast.error("Please select a campaign");
      return;
    }
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setSubmitting(true);
    try {
      const data = await replaceCaseUploadApi(campaignId, file);
      // Close immediately regardless of success or failure
      onClose();
      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Replace upload failed");
        return;
      }
      toast.success(data?.message || "Cases replaced successfully");
      onSuccess?.(data);
    } catch (error) {
      onClose();
      toast.error(getErrorMessage(error, "Replace upload failed"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      show={show}
      onHide={submitting ? undefined : handleCancel}
      centered
      className="replace-case-upload-modal"
      backdropClassName="replace-case-upload-backdrop"
      backdrop={submitting ? "static" : true}
      enforceFocus={false}
    >
      <Modal.Header closeButton={!submitting}>
        <Modal.Title>Replace Uploaded Cases</Modal.Title>
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
              value={campaignId}
              options={campaignOptions}
              placeholder="Select Campaign"
              onChange={setCampaignId}
              disabled={campaignsLoading || submitting}
            />
          )}
        </div>

        {/* File Upload Field */}
        <div className="form-field">
          <label className="field-label">File</label>

          <input
            ref={fileRef}
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
                disabled={submitting}
                aria-label="Remove file"
              >
                <LuX />
              </button>
            </div>
          ) : (
            <div
              className={`file-dropzone ${dragging ? "dragging" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <LuUpload className="dropzone-icon" />
              <p className="dropzone-primary">Click to upload or drag &amp; drop</p>
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
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting || campaignsLoading}
        >
          <LuUpload />
          {submitting ? "Replacing..." : "Replace Upload"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReplaceCaseUploadModal;
