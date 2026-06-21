import { useState } from "react";
import "./ReportForm.scss";

import Button     from "../../../components/Button/Button";
import Breadcrumbs from "../../../components/Breadcrumbs/Breadcrumbs";
import Dropdown   from "../../../components/Dropdown/Dropdown";

// ── Breadcrumb ────────────────────────────────────────────────────────────────
const BREADCRUMB_ITEMS = [
  { label: "Home",   link: "/" },
  { label: "Report", link: "/report" },
  { label: "Create" },
];

// ── Options ───────────────────────────────────────────────────────────────────
const REPORT_NAME_OPTIONS = [
  { value: "sales",     label: "Sales Report" },
  { value: "inventory", label: "Inventory Report" },
  { value: "hr",        label: "HR Report" },
];

const CATEGORY_OPTIONS = [
  { value: "finance",   label: "Finance" },
  { value: "ops",       label: "Operations" },
  { value: "marketing", label: "Marketing" },
];

const CHART_TYPE_OPTIONS = [
  { value: "bar",  label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie",  label: "Pie Chart" },
];

const GROUP_TYPE_OPTIONS = [
  { value: "daily",   label: "Daily" },
  { value: "weekly",  label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const USER_OPTIONS = [
  { value: "u1", label: "John Smith" },
  { value: "u2", label: "Sarah Lee" },
  { value: "u3", label: "Mike Johnson" },
];

const EMAIL_CHIPS = ["00011", "0029838", "0399283", "09834"];

// ── Section wrapper ───────────────────────────────────────────────────────────
const FormSection = ({ title, children }) => (
  <div className="ird-section">
    <div className="ird-section-header">
      <span className="ird-section-title">{title}</span>
    </div>
    <div className="ird-section-body">{children}</div>
  </div>
);

// ── Text / Textarea field ─────────────────────────────────────────────────────
const TextField = ({ label, id, value, onChange, placeholder, multiline = false, error }) => (
  <div className="ird-field">
    <label className="ird-label" htmlFor={id}>{label}</label>
    {multiline ? (
      <textarea
        id={id}
        className={`ird-input ird-textarea${error ? " ird-field-error" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={3}
      />
    ) : (
      <input
        id={id}
        type="text"
        className={`ird-input${error ? " ird-field-error" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    )}
    {error && <span className="ird-error-msg">{error}</span>}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const ReportForm = () => {
  const [form, setForm] = useState({
    reportName: "", category: "", chartType: "",
    description: "", groupType: "", columns: "",
    runtimeFilters: "", selectUser: "", teams: "", portals: "",
  });
  const [errors, setErrors] = useState({});

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));
  const setInput = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.reportName) errs.reportName = "Required";
    if (!form.category)   errs.category   = "Required";
    if (!form.chartType)  errs.chartType  = "Required";
    if (!form.groupType)  errs.groupType  = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    alert("Report saved!");
  };

  const handleSaveNew = () => {
    if (!validate()) return;
    setForm({
      reportName: "", category: "", chartType: "",
      description: "", groupType: "", columns: "",
      runtimeFilters: "", selectUser: "", teams: "", portals: "",
    });
    setErrors({});
    alert("Saved! Form reset.");
  };

  const handleCancel = () => {
    setForm({
      reportName: "", category: "", chartType: "",
      description: "", groupType: "", columns: "",
      runtimeFilters: "", selectUser: "", teams: "", portals: "",
    });
    setErrors({});
  };

  return (
    <div className="ird-page">
      <div className="ird-container">

        {/* ── Header ── */}
        <div className="ird-header">
          <div className="ird-header-left">
            <Breadcrumbs items={BREADCRUMB_ITEMS} />
            <h4 className="ird-page-title">Create Report</h4>
          </div>
          <div className="ird-header-actions">
            <Button variant="custom"   size="md" onClick={handleCancel}>Cancel</Button>
            <Button variant="tertiary" size="md" onClick={handleSaveNew}>Save &amp; New</Button>
            <Button variant="primary"  size="md" onClick={handleSave}>Save</Button>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="ird-form">

          {/* Section 1: Report Details */}
          <FormSection title="Report Details">
            <div className="ird-grid-3">
              <Dropdown
                label="Report Name"
                placeholder="Select report name"
                options={REPORT_NAME_OPTIONS}
                value={form.reportName}
                onChange={set("reportName")}
                error={errors.reportName}
              />
              <Dropdown
                label="Category"
                placeholder="Select category"
                options={CATEGORY_OPTIONS}
                value={form.category}
                onChange={set("category")}
                error={errors.category}
              />
              <Dropdown
                label="Chart Type"
                placeholder="Select chart type"
                options={CHART_TYPE_OPTIONS}
                value={form.chartType}
                onChange={set("chartType")}
                error={errors.chartType}
              />
            </div>
            <div className="ird-grid-1 ird-mt">
              <TextField
                label="Description" id="description"
                placeholder="Enter description..."
                multiline
                value={form.description}
                onChange={setInput("description")}
              />
            </div>
          </FormSection>

          {/* Section 2: Parameters */}
          <FormSection title="Parameters">
            <div className="ird-grid-3">
              <Dropdown
                label="Group Type"
                placeholder="Select group type"
                options={GROUP_TYPE_OPTIONS}
                value={form.groupType}
                onChange={set("groupType")}
                error={errors.groupType}
              />
              <TextField
                label="Columns" id="columns"
                placeholder="e.g. Name, Date, Amount"
                value={form.columns}
                onChange={setInput("columns")}
              />
              <TextField
                label="Runtime Filters" id="runtimeFilters"
                placeholder="e.g. Date range, Status"
                value={form.runtimeFilters}
                onChange={setInput("runtimeFilters")}
              />
            </div>
          </FormSection>

          {/* Section 3: Assign Users */}
          <FormSection title="Assign Users">
            <div className="ird-grid-3">
              <Dropdown
                label="Select User"
                placeholder="Select user"
                options={USER_OPTIONS}
                value={form.selectUser}
                onChange={set("selectUser")}
              />
              <TextField
                label="Teams" id="teams"
                placeholder="Enter team name"
                value={form.teams}
                onChange={setInput("teams")}
              />
              <TextField
                label="Portals" id="portals"
                placeholder="Enter portal name"
                value={form.portals}
                onChange={setInput("portals")}
              />
            </div>
            <div className="ird-mt">
              <label className="ird-label">Email Sending</label>
              <div className="ird-chips">
                {EMAIL_CHIPS.map((chip) => (
                  <span key={chip} className="ird-chip">{chip}</span>
                ))}
              </div>
            </div>
          </FormSection>

        </div>
      </div>
    </div>
  );
};

export default ReportForm;
