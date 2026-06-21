import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { LuSlidersHorizontal, LuX } from "react-icons/lu";
import FilterPopup from "@/components/FilterBar/FilterPopup";
import FilterDatePicker from "@/components/DatePicker/FilterDatePicker";
import Button from "@/components/Button/Button";
import { normalizeRole } from "@/constants/permissions";
import { ROLES } from "@/constants/roles";
import "./FilterBar.scss";

const HIERARCHY_FILTERS = {
  [ROLES.ADMIN]: ["managerId", "teamLeaderId", "telecallerId"],
  [ROLES.SUB_ADMIN]: ["managerId", "teamLeaderId", "telecallerId"],
  [ROLES.MD]: ["managerId", "teamLeaderId", "telecallerId"],
  [ROLES.UNIT_HEAD]: ["managerId", "teamLeaderId", "telecallerId"],
  [ROLES.MANAGER]: ["teamLeaderId", "telecallerId"],
  [ROLES.ASSISTANT_MANAGER]: ["teamLeaderId", "telecallerId"],
  [ROLES.TEAM_LEADER]: ["telecallerId"],
  [ROLES.TELE_CALLER]: [],
};

const emptyFilters = () => ({
  clientId: "",
  campaignId: "",
  month: new Date().toISOString().slice(0, 7),
  fromDate: "",
  toDate: "",
  productId: "",
  type: "",
  managerId: "",
  teamLeaderId: "",
  telecallerId: "",
});

const SearchSelect = ({ label, name, value, options, onChange }) => (
  <FilterPopup
    type="select"
    label={label}
    value={value || ""}
    options={options}
    placeholder={`All ${label}s`}
    onChange={(nextValue) => onChange(name, nextValue)}
    idPrefix={`dashboard-${name}`}
  />
);

export default function FilterBar({
  filters,
  onApply,
  onReset,
  options,
  userRole,
  loading,
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const visibleHierarchy = HIERARCHY_FILTERS[normalizeRole(userRole)] || [];
  const activeCount = useMemo(
    () => Object.entries(filters).filter(([key, value]) => key !== "month" && Boolean(value)).length,
    [filters],
  );

  useEffect(() => {
    setDraft(filters);
  }, [filters, open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleChange = (name, value) => {
    setDraft((current) => {
      let nextValue = value;
      if (name === "month" && value && value.length > 7) {
        nextValue = value.slice(0, 7);
      }
      const next = { ...current, [name]: nextValue };
      if (name === "clientId") next.campaignId = "";
      return next;
    });
  };

  const hierarchyField = (name, label, values) =>
    visibleHierarchy.includes(name) ? (
      <SearchSelect label={label} name={name} value={draft[name]} options={values} onChange={handleChange} />
    ) : null;

  const modal = open ? (
    <div
      className="dashboard-filter-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
    >
      <form
        className="dashboard-filter-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-filter-title"
        onSubmit={(event) => {
          event.preventDefault();
          onApply(draft);
          setOpen(false);
        }}
      >
        <div className="dashboard-filter-modal-header">
          <div>
            <h2 id="dashboard-filter-title">Dashboard Filters</h2>
            <p>Refine dashboard data using one or more filters.</p>
          </div>
          <Button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="dashboard-filter-close-btn" variant="custom">
            <LuX size={20} />
          </Button>
        </div>

        <div className="dashboard-filter-grid">
          <SearchSelect label="Client" name="clientId" value={draft.clientId} options={options.clients} onChange={handleChange} />
          <SearchSelect label="Campaign" name="campaignId" value={draft.campaignId} options={options.campaigns} onChange={handleChange} />
          <div className="dashboard-filter-field">
            <span>Month</span>
            <FilterDatePicker
              className="dashboard-filter-date"
              views={["year", "month"]}
              openTo="month"
              value={draft.month || ""}
              onChange={(val) => handleChange("month", val)}
            />
          </div>
          <div className="dashboard-filter-field">
            <span>From date</span>
            <FilterDatePicker
              className="dashboard-filter-date"
              value={draft.fromDate || ""}
              maxDate={draft.toDate || undefined}
              onChange={(val) => handleChange("fromDate", val)}
            />
          </div>
          <div className="dashboard-filter-field">
            <span>To date</span>
            <FilterDatePicker
              className="dashboard-filter-date"
              value={draft.toDate || ""}
              minDate={draft.fromDate || undefined}
              onChange={(val) => handleChange("toDate", val)}
            />
          </div>
          <SearchSelect label="Product" name="productId" value={draft.productId} options={options.products} onChange={handleChange} />
          <SearchSelect label="Type" name="type" value={draft.type} options={[{ label: "BKT", value: "BKT" }, { label: "REC", value: "REC" }]} onChange={handleChange} />
          {hierarchyField("managerId", "Manager", options.managers)}
          {hierarchyField("teamLeaderId", "Team Leader", options.teamLeaders)}
          {hierarchyField("telecallerId", "Telecaller", options.telecallers)}
        </div>

        <div className="dashboard-filter-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const reset = emptyFilters();
              setDraft(reset);
              onReset(reset);
              setOpen(false);
            }}
            disabled={loading}
          >
            Reset
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            Apply
          </Button>
        </div>
      </form>
    </div>
  ) : null;

  return (
    <>
      <div className="dashboard-filter-trigger-row">
        <Button type="button" className="dashboard-filter-trigger" onClick={() => setOpen(true)} variant="primary">
          <LuSlidersHorizontal size={16} />
          Filters
          {activeCount > 0 && <span>{activeCount}</span>}
        </Button>
      </div>
      {modal && createPortal(modal, document.body)}
    </>
  );
}
