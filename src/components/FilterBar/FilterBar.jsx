import { useState, useEffect } from "react";
import { MdFilterList } from "react-icons/md";
import { LuX } from "react-icons/lu";
import Button from "../Button/Button";
import FilterPopup from "./FilterPopup";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import "./FilterPopup.scss";

const FilterBar = ({
  config = [],
  filters = {},
  updateFilter,
  onApply,
  anchorEl: externalAnchorEl,
  onClose: externalOnClose,
  showButton = true,
}) => {
  const [internalAnchorEl, setInternalAnchorEl] = useState(null);
  const [tempFilters, setTempFilters] = useState(filters);

  const anchorEl = externalAnchorEl || internalAnchorEl;
  const handleClose = externalOnClose || (() => setInternalAnchorEl(null));
  const isOpen = Boolean(anchorEl);

  useEffect(() => {
    if (anchorEl) {
      setTempFilters(filters || {});
    }
  }, [anchorEl, filters]);

  // Add/remove body blur class when popover opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("filter-popover-open");
    } else {
      document.body.classList.remove("filter-popover-open");
    }
    return () => document.body.classList.remove("filter-popover-open");
  }, [isOpen]);

  const handleClick = (e) => {
    setTempFilters(filters);
    setInternalAnchorEl(e.currentTarget);
  };

  const handleTempFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setTempFilters({});
    updateFilter?.({});
    onApply?.({});
  };

  const handleApply = () => {
    updateFilter?.(tempFilters);
    onApply?.(tempFilters);
    handleClose();
  };

  const activeFiltersCount = Object.keys(filters || {}).reduce((count, key) => {
    const val = filters[key];
    if (val != null && val !== "" && (!Array.isArray(val) || val.length > 0)) {
      return count + 1;
    }
    return count;
  }, 0);

  return (
    <div className="filter-bar">
      {showButton && !externalAnchorEl && (
        <div className="position-relative d-inline-flex">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleClick}
            className="d-flex align-items-center gap-2"
          >
            <span>Filter</span>
            <MdFilterList />
          </Button>
          {activeFiltersCount > 0 && (
            <span className="filter-badge">{activeFiltersCount}</span>
          )}
        </div>
      )}

      {/* Backdrop blur overlay */}
      {isOpen && (
        <div className="filter-backdrop" onClick={handleClose} />
      )}

      <Popover
        className="filter-popover-container"
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        marginThreshold={16}
        disableEnforceFocus
        disableAutoFocus
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            className: "filter-popover-paper",
            style: {
              width: "min(640px, calc(100vw - 32px))",
              minWidth: "min(640px, calc(100vw - 32px))",
              maxWidth: "min(640px, calc(100vw - 32px))",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 120px)",
            },
          },
        }}
      >
        {/* ── Fixed header ── */}
        <div className="filter-popover-header">
          <h5 className="filter-popover-title">Filters</h5>
          <button
            className="filter-popover-close"
            onClick={handleClose}
            aria-label="Close filters"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <Box className="filter-popover-content">
          {config.map((filter) => (
            <FilterPopup
              key={filter.key}
              type={filter.type}
              label={filter.label}
              value={
                filter.multiple
                  ? Array.isArray(tempFilters[filter.key])
                    ? tempFilters[filter.key]
                    : []
                  : (tempFilters[filter.key] ?? "")
              }
              options={filter.options || []}
              placeholder={filter.placeholder}
              filterEndpoint={filter.filterEndpoint}
              multiple={Boolean(filter.multiple)}
              idPrefix={filter.key}
              onChange={(value) => handleTempFilterChange(filter.key, value)}
            />
          ))}
        </Box>

        {/* ── Fixed footer ── */}
        <Box className="filter-popover-actions">
          <Button variant="secondary" size="md" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="primary" size="md" onClick={handleApply}>
            Apply
          </Button>
        </Box>
      </Popover>
    </div>
  );
};

export default FilterBar;