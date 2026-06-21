import { useMemo, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Button from "@/components/Button/Button";
import SelectInput from "@/components/SelectInput/SelectInput";
import { LuSlidersHorizontal, LuX, LuRotateCcw } from "react-icons/lu";
import "./UploadCanvas.scss";


const UploadCanvas = ({ show, onHide, campaigns = [], onApply, activeFilters = {} }) => {
  const [bank, setBank] = useState(activeFilters.bank ?? "");
  const [teamLeader, setTeamLeader] = useState(activeFilters.teamLeader ?? "");
  const [monthYear, setMonthYear] = useState(activeFilters.monthYear ?? "");

  /* ── Derive unique option lists from campaign data ── */

  const bankOptions = useMemo(() => {
    const seen = new Map();
    campaigns.forEach((c) => {
      const id = c.clientId?._id ?? c.clientId;
      const name = c.clientId?.bankName ?? c.clientId?.name ?? c.clientId;
      if (id && name && !seen.has(id)) seen.set(id, name);
    });
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [campaigns]);

  const teamLeaderOptions = useMemo(() => {
    const seen = new Map();
    campaigns.forEach((c) => {
      const ref = c.teamLeaderId;
      const id = ref?._id ?? ref;
      const name = ref?.name ?? ref?.full_name ?? ref?.username ?? ref;
      if (id && name && !seen.has(id)) seen.set(id, name);
    });
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [campaigns]);

  const monthYearOptions = useMemo(() => {
    const seen = new Set();
    campaigns.forEach((c) => {
      const m = c.monthYear ?? c.month_year;
      if (m) seen.add(m);
    });
    return Array.from(seen).map((m) => ({ value: m, label: m }));
  }, [campaigns]);

  const activeCount = [bank, teamLeader, monthYear].filter(Boolean).length;

  const handleApply = () => {
    onApply?.({ bank, teamLeader, monthYear });
    onHide();
  };

  const handleReset = () => {
    setBank("");
    setTeamLeader("");
    setMonthYear("");
    onApply?.({ bank: "", teamLeader: "", monthYear: "" });
  };

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="upload-canvas"
    >
      {/* ── Header ── */}
      <Offcanvas.Header className="upload-canvas-header">
        <div className="canvas-title-row">
          <span className="canvas-icon">
            <LuSlidersHorizontal size={18} />
          </span>
          <Offcanvas.Title className="canvas-title">
            Filter Campaigns
          </Offcanvas.Title>
          {activeCount > 0 && (
            <span className="active-badge">{activeCount}</span>
          )}
        </div>
        <button className="canvas-close" onClick={onHide} aria-label="Close">
          <LuX size={18} />
        </button>
      </Offcanvas.Header>

      {/* ── Body ── */}
      <Offcanvas.Body className="upload-canvas-body">
        <div className="canvas-fields">

          <div className="canvas-field-group">
            <label className="canvas-label">Bank / Client</label>
            <SelectInput
              value={bank}
              options={bankOptions}
              placeholder="All Banks"
              onChange={setBank}
            />
          </div>

          <div className="canvas-field-group">
            <label className="canvas-label">Team Leader</label>
            <SelectInput
              value={teamLeader}
              options={teamLeaderOptions}
              placeholder="All Team Leaders"
              onChange={setTeamLeader}
            />
          </div>

          <div className="canvas-field-group">
            <label className="canvas-label">Month / Year</label>
            <SelectInput
              value={monthYear}
              options={monthYearOptions}
              placeholder="All Months"
              onChange={setMonthYear}
            />
          </div>

        </div>
      </Offcanvas.Body>

      {/* ── Footer ── */}
      <div className="upload-canvas-footer">
        <Button
          variant="secondary"
          size="lg"
          onClick={handleReset}
          disabled={activeCount === 0}
          className="canvas-reset-btn"
        >
          <LuRotateCcw size={14} />
          Reset
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={handleApply}
          className="canvas-apply-btn"
        >
          Apply Filters
        </Button>
      </div>
    </Offcanvas>
  );
};

export default UploadCanvas;