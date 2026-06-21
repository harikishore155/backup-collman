import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Dropdown from "../Dropdown/Dropdown";
import Button from "../Button/Button";
import gridIcon from "../../assets/icons/grid-icon.svg";
import checkBoxIcon from "../../assets/icons/check-box.svg";
import "./CreateReportModal.scss";

const CreateReportModal = ({
  show = false,
  onClose,
  onSubmit,
  entityTypeOptions = [],
}) => {
  const [entityType, setEntityType] = useState("");
  const [reportType, setReportType] = useState("grid");
  const [errors,     setErrors]     = useState({});

  // ── Lock body scroll when open ──
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [show]);

  // ── Close on Escape ──
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") handleClose(); };
    if (show) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [show]);

  const handleSubmit = () => {
    const errs = {};
    if (!entityType) errs.entityType = "Please select an entity type.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit?.({ entityType, reportType });
    handleClose();
  };

  const handleClose = () => {
    setEntityType("");
    setReportType("grid");
    setErrors({});
    onClose?.();
  };

  if (!show) return null;

  return createPortal(
    <div className="crm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="crm-modal-box" role="dialog" aria-modal="true" aria-labelledby="crm-modal-title">

        {/* ── Header ── */}
        <div className="crm-header">
          <h2 className="crm-title" id="crm-modal-title">Create Report</h2>
          <button className="crm-close-btn" onClick={handleClose} aria-label="Close">
            &#x2715;
          </button>
        </div>

        {/* ── Body ── */}
        <div className="crm-body">

          {/* Entity Type */}
          <div className="crm-field">
            <Dropdown
              label="Entity Type"
              placeholder="Select entity type"
              options={entityTypeOptions}
              value={entityType}
              onChange={(v) => {
                setEntityType(v);
                if (errors.entityType) setErrors({});
              }}
              error={errors.entityType}
            />
          </div>

          {/* Report Type Cards */}
          <div className="crm-report-type-section">
            <p className="crm-section-label">CHOOSE A REPORT TYPE</p>

            <div className="crm-report-type-grid">

              {/* Grid Report */}
              <button
                type="button"
                className={`crm-report-card ${reportType === "grid" ? "crm-report-card-active" : ""}`}
                onClick={() => setReportType("grid")}
                aria-pressed={reportType === "grid"}
              >
                <img src={gridIcon} alt="" className="crm-report-icon" aria-hidden="true" />
                <span className="crm-report-card-title">Grid Report</span>
                <span className="crm-report-card-desc">
                  Group by one or two columns &amp; see summations displayed as a chart
                </span>
              </button>

              {/* List Report */}
              <button
                type="button"
                className={`crm-report-card ${reportType === "list" ? "crm-report-card-active" : ""}`}
                onClick={() => setReportType("list")}
                aria-pressed={reportType === "list"}
              >
                <img src={checkBoxIcon} alt="" className="crm-report-icon" aria-hidden="true" />
                <span className="crm-report-card-title">List Report</span>
                <span className="crm-report-card-desc">
                  Simple list of records which meet filter criteria
                </span>
              </button>

            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="crm-footer">
          <Button variant="custom" size="md" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={handleSubmit}>Create</Button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CreateReportModal;