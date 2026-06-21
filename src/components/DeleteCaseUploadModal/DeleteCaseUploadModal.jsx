import { useEffect, useRef, useState } from "react";
import Modal from "react-bootstrap/Modal";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { IoCloseCircleOutline } from "react-icons/io5";
import { LuCloudUpload, LuFileText } from "react-icons/lu";
import Button from "@/components/Button/Button";
import SelectInput from "@/components/SelectInput/SelectInput";
import { replaceDeleteCaseUploadApi } from "@/features/caseUploads/caseUploadApi";
import { fetchCampaignsApi } from "@/features/campaigns/campaignApi";
import {
  formatCampaignOptionLabel,
  readCampaignMongoId,
} from "@/features/targets/targetMappers";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import "./DeleteCaseUploadModal.scss";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"];
const ACCEPTED_MIME_TYPES =
  "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const ACCOUNT_HEADERS = new Set(["accountno", "accountnumber", "accountid"]);

const getValidationMessage = (data, fallback) => {
  const validation = data?.errors ?? data?.validationErrors ?? data?.details;
  if (Array.isArray(validation) && validation.length) {
    return validation
      .map((item) => item?.message ?? item?.msg ?? String(item))
      .join(", ");
  }
  if (validation && typeof validation === "object") {
    return Object.values(validation)
      .flat()
      .map((item) => item?.message ?? item?.msg ?? String(item))
      .join(", ");
  }
  return data?.message ?? data?.detail ?? data?.error ?? fallback;
};

const getErrorMessage = (error, fallback) =>
  getValidationMessage(error?.response?.data, error?.message ?? fallback);

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const validateAccountColumn = async (file) => {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error("The Excel file does not contain a sheet");

  const rows = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    blankrows: false,
  });
  const headers = rows[0] ?? [];
  if (!headers.some((header) => ACCOUNT_HEADERS.has(normalizeHeader(header)))) {
    throw new Error(
      "Excel must contain an AccountNo, accountNumber, or accountId column",
    );
  }
};

const readResult = (data) => {
  const payload = data?.data && !Array.isArray(data.data) ? data.data : data;
  const unmatched =
    payload?.unmatchedAccountNumbers ??
    payload?.unmatched_account_numbers ??
    payload?.unmatchedAccounts ??
    [];

  return {
    deletedCount: Number(
      payload?.deletedCount ?? payload?.deleted_count ?? payload?.count ?? 0,
    ),
    matchedAccountCount: Number(
      payload?.matchedAccountCount ??
        payload?.matched_account_count ??
        payload?.matchedCount ??
        0,
    ),
    unmatchedAccountCount: Number(
      payload?.unmatchedAccountCount ??
        payload?.unmatched_account_count ??
        payload?.unmatchedCount ??
        0,
    ),
    unmatchedAccountNumbers: Array.isArray(unmatched)
      ? unmatched
      : unmatched == null || unmatched === ""
        ? []
        : [unmatched],
  };
};

const DeleteCaseUploadModal = ({
  show,
  onClose,
  initialCampaignId = "",
  onSuccess,
}) => {
  const fileRef = useRef(null);
  const [campaignId, setCampaignId] = useState("");
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState("select");
  const [result, setResult] = useState(null);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCampaignId(initialCampaignId ? String(initialCampaignId) : "");
    setFile(null);
    setDragOver(false);
    setStep("select");
    setResult(null);

    const loadCampaigns = async () => {
      try {
        setCampaignsLoading(true);
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
    };

    loadCampaigns();
  }, [initialCampaignId, show]);

  const handleFile = (nextFile) => {
    if (!nextFile) return;
    const valid = ACCEPTED_EXTENSIONS.some((extension) =>
      nextFile.name.toLowerCase().endsWith(extension),
    );
    if (!valid) {
      toast.error("Only XLSX and XLS files are supported");
      return;
    }
    setFile(nextFile);
  };

  const handleReview = async () => {
    if (!campaignId) {
      toast.error("Please select a campaign");
      return;
    }
    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }

    try {
      setValidating(true);
      await validateAccountColumn(file);
      setStep("confirm");
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid Excel file"));
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const data = await replaceDeleteCaseUploadApi(campaignId, file);
      if (isApiFailure(data)) {
        toast.error(getValidationMessage(data, "Delete upload failed"));
        return;
      }

      const nextResult = readResult(data);
      setResult(nextResult);
      setStep("result");
      toast.success(data?.message || "Matching cases deleted successfully");
      await onSuccess?.(nextResult);
    } catch (error) {
      toast.error(getErrorMessage(error, "Delete upload failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCampaignLabel =
    campaignOptions.find((option) => option.value === campaignId)?.label ??
    campaignId;

  return (
    <Modal
      show={show}
      onHide={submitting ? undefined : onClose}
      centered
      className="delete-case-upload-modal"
      backdropClassName="delete-case-upload-backdrop"
      contentClassName="modal-zoom"
      backdrop={submitting ? "static" : true}
      enforceFocus={false}
    >
      <Modal.Header closeButton={!submitting}>
        <Modal.Title>Delete Uploaded Cases</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {step === "select" && (
          <>
            <p className="delete-upload-description">
              Upload an Excel file containing account numbers. Matching cases
              from the selected campaign will be permanently deleted.
            </p>

            <div className="delete-upload-field">
              <label>Select Campaign</label>
              <SelectInput
                value={campaignId}
                options={campaignOptions}
                placeholder={
                  campaignsLoading ? "Loading campaigns..." : "Select Campaign"
                }
                onChange={setCampaignId}
                disabled={campaignsLoading || validating}
                className="mb-0"
              />
            </div>

            <div className="delete-upload-field">
              <label>Upload Excel File</label>
              <div
                className={`delete-upload-zone${dragOver ? " is-dragging" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    fileRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                  handleFile(event.dataTransfer.files[0]);
                }}
              >
                <LuCloudUpload aria-hidden />
                <span>
                  Upload Excel File &amp; <strong>Browse file</strong>
                </span>
                <small>
                  Required column: AccountNo, accountNumber, or accountId
                </small>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED_MIME_TYPES}
                  hidden
                  disabled={validating}
                  onChange={(event) => handleFile(event.target.files[0])}
                />
              </div>
            </div>

            {file && (
              <div className="delete-file-pill">
                <LuFileText aria-hidden />
                <div>
                  <strong>{file.name}</strong>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  type="button"
                  aria-label="Remove selected file"
                  disabled={validating}
                  onClick={() => {
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  <IoCloseCircleOutline aria-hidden />
                </button>
              </div>
            )}
          </>
        )}

        {step === "confirm" && (
          <div className="delete-upload-confirmation">
            <div className="delete-upload-warning">
              This permanently deletes every case in the selected campaign whose
              account number appears in the Excel file. This cannot be undone.
            </div>
            <dl>
              <div>
                <dt>Campaign</dt>
                <dd>{selectedCampaignLabel}</dd>
              </div>
              <div>
                <dt>Excel File</dt>
                <dd>{file?.name}</dd>
              </div>
            </dl>
          </div>
        )}

        {step === "result" && result && (
          <div className="delete-upload-result">
            <div className="delete-upload-success">
              Matching uploaded cases were deleted successfully.
            </div>
            <div className="delete-upload-stats">
              <div>
                <span>Deleted</span>
                <strong>{result.deletedCount}</strong>
              </div>
              <div>
                <span>Matched Accounts</span>
                <strong>{result.matchedAccountCount}</strong>
              </div>
              <div>
                <span>Unmatched Accounts</span>
                <strong>{result.unmatchedAccountCount}</strong>
              </div>
            </div>
            <div className="delete-upload-unmatched">
              <h6>Unmatched Account Numbers</h6>
              {result.unmatchedAccountNumbers.length ? (
                <div>
                  {result.unmatchedAccountNumbers.map((account) => (
                    <span key={String(account)}>{String(account)}</span>
                  ))}
                </div>
              ) : (
                <p>All account numbers matched.</p>
              )}
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {step === "select" && (
          <>
            <Button variant="secondary" size="md" onClick={onClose} disabled={validating}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleReview}
              disabled={validating || campaignsLoading || !campaignId || !file}
            >
              {validating ? "Validating..." : "Review Delete"}
            </Button>
          </>
        )}
        {step === "confirm" && (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setStep("select")}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Confirm Delete Upload"}
            </Button>
          </>
        )}
        {step === "result" && (
          <Button variant="primary" size="md" onClick={onClose}>
            Done
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteCaseUploadModal;
