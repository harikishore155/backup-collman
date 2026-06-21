import { useMemo, useState } from "react";
import "./FilterableHeader.scss";
import {
    FiArrowDown,
    FiArrowUp,
    FiFilter,
    FiSearch,
    FiSliders,
    FiX,
} from "react-icons/fi";
import { Popover, CircularProgress } from "@mui/material";
import Button from "../Button/Button";
import useFetchFilters from "@/hooks/useFetchFilters";

const FilterableHeader = ({
    label,
    filterKey,
    filterEndpoint,
    options: staticOptions = [],
    onFilterChange,
    selectedValues = [],
    sortKey,
    sortConfig,
    onSort,
    filterable = true,
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedFilters, setSelectedFilters] = useState(selectedValues);
    const [optionSearch, setOptionSearch] = useState("");

    const { options: fetchedOptions, loading } = useFetchFilters(filterEndpoint);
    const options = filterEndpoint ? fetchedOptions : staticOptions;
    const sortDirection = sortConfig?.key === sortKey ? sortConfig.direction : null;
    const filteredOptions = useMemo(() => {
        const query = optionSearch.trim().toLowerCase();
        if (!query) return options;

        return options.filter((option) =>
            String(option.label ?? option.plan_name ?? option.value ?? option.plan_id ?? "")
                .toLowerCase()
                .includes(query)
        );
    }, [optionSearch, options]);

    const handleOpen = (e) => {
        setSelectedFilters(selectedValues);
        setAnchorEl(e.currentTarget);
    };
    const handleClose = () => {
        setSelectedFilters(selectedValues);
        setOptionSearch("");
        setAnchorEl(null);
    };

    const handleCheckboxChange = (planId) => {
        setSelectedFilters((prev) =>
            prev.includes(planId)
                ? prev.filter((id) => id !== planId)
                : [...prev, planId]
        );
    };

    const handleClear = () => {
        setSelectedFilters([]);
        onFilterChange(filterKey, []);
        setOptionSearch("");
        setAnchorEl(null);
    };

    const handleApply = () => {
        onFilterChange(filterKey, selectedFilters);
        setOptionSearch("");
        setAnchorEl(null);
    };

    return (
        <div className="filterable-header">
            <span className="label">{label}</span>
            {onSort && (
                <button
                    type="button"
                    className={`sort-trigger ${sortDirection ? "active" : ""}`}
                    onClick={() => onSort(sortKey)}
                    aria-label={`Sort ${label}${sortDirection ? ` ${sortDirection}` : ""}`}
                    title={
                        sortDirection === "asc"
                            ? "Sorted ascending"
                            : sortDirection === "desc"
                              ? "Sorted descending"
                              : `Sort ${label}`
                    }
                >
                    {sortDirection === "asc" ? (
                        <FiArrowUp />
                    ) : sortDirection === "desc" ? (
                        <FiArrowDown />
                    ) : (
                        <FiSliders />
                    )}
                </button>
            )}
            {filterable && (
                <button
                    type="button"
                    className={`filter-trigger ${selectedValues.length ? "active" : ""}`}
                    onClick={handleOpen}
                    aria-label={`Filter ${label}`}
                >
                    <FiFilter />
                    {selectedValues.length > 0 && (
                        <span className="filter-count">{selectedValues.length}</span>
                    )}
                </button>
            )}

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                PaperProps={{
                    sx: {
                        borderRadius: "10px",
                        overflow: "hidden",
                        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
                    },
                }}
            >
                <div className="filter-popover">
                    <div className="filter-popover-title">
                        <span>Filter by {label}</span>
                        <button type="button" onClick={handleClose} aria-label="Close filter">
                            <FiX />
                        </button>
                    </div>
                    <label className="filter-option-search">
                        <FiSearch />
                        <input
                            value={optionSearch}
                            onChange={(event) => setOptionSearch(event.target.value)}
                            placeholder="Search values"
                            autoFocus
                        />
                    </label>
                    {loading ? (
                        <div className="text-center py-2">
                            <CircularProgress size={24} />
                        </div>
                    ) : filteredOptions?.length > 0 ? (
                        <div className="checkbox-group">
                            {filteredOptions.map((opt) => (
                                <label
                                    key={opt.value || opt.plan_id}
                                    className="checkbox-label"
                                >
                                    <input
                                        type="checkbox"
                                        value={opt.value || opt.plan_id}
                                        checked={selectedFilters.includes(opt.value || opt.plan_id)}
                                        onChange={() => handleCheckboxChange(opt.value || opt.plan_id)}
                                    />
                                    <span className="checkbox-option"> {opt.label || opt.plan_name}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="no-options">No options available</div>
                    )}

                    <div className="filter-actions">
                        <Button variant="secondary" size="sm" onClick={handleClear} disabled={!selectedValues.length && !selectedFilters.length}>
                            Clear
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleApply}>
                            Apply
                        </Button>
                    </div>
                </div>
            </Popover>
        </div>
    );
};

export default FilterableHeader;
