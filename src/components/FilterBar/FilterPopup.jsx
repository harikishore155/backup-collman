import { useState, useRef, useEffect } from "react";
import useFetchFilters from "@/hooks/useFetchFilters";
import { LuChevronDown, LuSearch, LuX } from "react-icons/lu";
import "./FilterPopup.scss";

const FilterPopup = ({
  type,
  label,
  value,
  options = [],
  placeholder,
  onChange,
  filterEndpoint,
  multiple = false,
  idPrefix = "filter",
}) => {
  const { options: fetchedOptions, loading } = useFetchFilters(filterEndpoint);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  const finalOptions = filterEndpoint
    ? fetchedOptions.map((opt, index) => {
        const val =
          opt._id ??
          opt.id ??
          opt.plan_id ??
          opt.value ??
          opt.code ??
          `row_${index}`;
        const lbl =
          opt.bankName ??
          opt.bank_name ??
          opt.client_name ??
          opt.clientName ??
          opt.productName ??
          opt.product_name ??
          opt.plan_name ??
          opt.name ??
          opt.label ??
          opt.code ??
          String(val);
        return { value: String(val), label: String(lbl) };
      })
    : options;

  const filteredOptions = search.trim()
    ? finalOptions.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : finalOptions;

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const selectedSet = new Set(
    multiple
      ? (Array.isArray(value) ? value : value ? [value] : []).map(String)
      : [],
  );

  const isChecked = (optValue) => {
    const s = String(optValue);
    if (multiple) return selectedSet.has(s);
    return value !== undefined && value !== null && String(value) === s;
  };

  const handleToggle = (optValue) => {
    const s = String(optValue);
    if (multiple) {
      const next = new Set(selectedSet);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      onChange([...next]);
      return;
    }
    onChange(String(value) === s ? "" : optValue);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : "");
  };

  const selectedCount = multiple ? selectedSet.size : value ? 1 : 0;

  const getTriggerLabel = () => {
    if (selectedCount === 0) return placeholder || `Select ${label}`;
    if (!multiple) {
      const found = finalOptions.find((o) => String(o.value) === String(value));
      return found?.label || String(value);
    }
    if (selectedCount === 1) {
      const first = [...selectedSet][0];
      const found = finalOptions.find((o) => String(o.value) === first);
      return found?.label || first;
    }
    return `${selectedCount} selected`;
  };

  return (
    <div
      className="filter-item"
      ref={type === "select" ? containerRef : undefined}
    >
      {label && (
        <p className="filter-item-heading" id={`${idPrefix}-heading`}>
          {label}
        </p>
      )}

      {type === "text" && (
        <input
          type="text"
          placeholder={placeholder || `Enter ${label}`}
          className="filter-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {type === "select" && (
        <div className={`fp-select ${open ? "fp-select--open" : ""}`}>
          {/* Trigger */}
          <button
            type="button"
            className={`fp-trigger ${selectedCount > 0 ? "fp-trigger--active" : ""}`}
            onClick={() => {
              setOpen((prev) => !prev);
              setSearch("");
            }}
            disabled={loading}
          >
            <span className="fp-trigger__label">
              {loading ? "Loading..." : getTriggerLabel()}
            </span>
            <span className="fp-trigger__icons">
              {selectedCount > 0 && (
                <span className="fp-badge">{selectedCount}</span>
              )}
              {selectedCount > 0 && (
                <LuX
                  className="fp-clear-icon"
                  size={13}
                  onClick={handleClear}
                />
              )}
              <LuChevronDown
                className={`fp-chevron ${open ? "fp-chevron--up" : ""}`}
                size={15}
              />
            </span>
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="fp-dropdown">
              {/* Search */}

              <div className="fp-search">
                <LuSearch size={13} className="fp-search__icon" />

                <input
                  autoFocus
                  type="text"
                  className="fp-search__input"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />

                {search && (
                  <LuX
                    size={12}
                    className="fp-search__clear"
                    onClick={() => setSearch("")}
                  />
                )}
              </div>

              {/* Options list */}
              <div className="fp-options">
                {filteredOptions.length === 0 ? (
                  <div className="fp-options__empty">No results found</div>
                ) : (
                  filteredOptions.map((option) => {
                    const checked = isChecked(option.value);
                    return (
                      <label
                        key={String(option.value)}
                        className={`fp-option ${checked ? "fp-option--checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="fp-option__checkbox"
                          checked={checked}
                          onChange={() => handleToggle(option.value)}
                        />
                        <span className="fp-option__box">
                          {checked && (
                            <svg viewBox="0 0 10 8" fill="none">
                              <path
                                d="M1 4l3 3 5-6"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="fp-option__label">{option.label}</span>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Footer: select all / clear */}
              {multiple && finalOptions.length > 1 && (
                <div className="fp-dropdown__footer">
                  <button
                    type="button"
                    className="fp-footer-btn"
                    onClick={() =>
                      onChange(filteredOptions.map((o) => String(o.value)))
                    }
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="fp-footer-btn fp-footer-btn--danger"
                    onClick={() => onChange([])}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPopup;
