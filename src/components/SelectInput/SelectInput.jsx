import { useState, useRef, useCallback, useMemo } from "react";
import Form from "react-bootstrap/Form";
import { MenuItem, Select, Chip, Box, InputAdornment, TextField } from "@mui/material";
import * as ReactWindow from "react-window";
const { FixedSizeList } = ReactWindow;
import { IoChevronDownCircleOutline } from "react-icons/io5";
import { LuSearch } from "react-icons/lu";
import "./SelectInput.scss";

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 8;
const VIRTUALIZE_THRESHOLD = 100;

// ─── Debounce hook ────────────────────────────────────────────────────────────
const useDebounce = (delay = 250) => {
    const [debounced, setDebounced] = useState("");
    const timer = useRef(null);

    const update = useCallback((val) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setDebounced(val), delay);
    }, [delay]);

    return [debounced, update];
};

// ─── Virtualized list ─────────────────────────────────────────────────────────
const VirtualizedMenuList = ({ options, onSelect, selectedValue, multiple }) => {
    const listHeight = Math.min(options.length, VISIBLE_ROWS) * ITEM_HEIGHT;

    const Row = ({ index, style }) => {
        const option = options[index];
        const isSelected = multiple
            ? Array.isArray(selectedValue) && selectedValue.includes(option.value)
            : String(selectedValue) === String(option.value);

        return (
            <MenuItem
                key={option.value}
                value={option.value}
                selected={isSelected}
                style={style}
                className="virtualized-menu-item"
                onClick={() => onSelect(option.value)}
            >
                {option.label}
            </MenuItem>
        );
    };

    return (
        <FixedSizeList
            height={listHeight}
            itemCount={options.length}
            itemSize={ITEM_HEIGHT}
            width="100%"
            overscanCount={5}
        >
            {Row}
        </FixedSizeList>
    );
};

// ─── SelectInput ──────────────────────────────────────────────────────────────
const SelectInput = ({
    value,
    options = [],
    placeholder = "Select an option",
    onChange,
    disabled = false,
    className = "",
    multiple = false,
    searchable = true,
}) => {
    const [rawSearch, setRawSearch] = useState("");
    const [debouncedSearch, updateDebounced] = useDebounce(250);
    const searchRef = useRef(null);
    const shouldVirtualize = options.length > VIRTUALIZE_THRESHOLD;

    const handleClose = useCallback(() => {
        setRawSearch("");
        updateDebounced("");
    }, [updateDebounced]);

    const handleOpen = useCallback(() => {
        setTimeout(() => searchRef.current?.focus(), 50);
    }, []);

    const handleSearchChange = useCallback((e) => {
        const val = e.target.value;
        setRawSearch(val);
        updateDebounced(val);
    }, [updateDebounced]);

    const handleVirtualSelect = useCallback((optionValue) => {
        if (!multiple) {
            onChange?.(optionValue);
            return;
        }
        const current = Array.isArray(value) ? value : [];
        const next = current.includes(optionValue)
            ? current.filter((v) => v !== optionValue)
            : [...current, optionValue];
        onChange?.(next);
    }, [multiple, value, onChange]);

    const filteredOptions = useMemo(() => {
        if (!searchable || !debouncedSearch.trim()) return options;
        const lower = debouncedSearch.toLowerCase();
        return options.filter((opt) =>
            String(opt.label).toLowerCase().includes(lower)
        );
    }, [options, debouncedSearch, searchable]);

    const renderValue = useCallback((selected) => {
        if (!multiple) {
            if (!selected || selected === "") {
                return <span className="placeholder-text">{placeholder}</span>;
            }
            const found = options.find(
                (opt) => String(opt.value) === String(selected)
            );
            return found?.label || selected;
        }

        if (!selected || selected.length === 0) {
            return <span className="placeholder-text">{placeholder}</span>;
        }

        return (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((val) => {
                    const label = options.find(
                        (o) => String(o.value) === String(val)
                    )?.label;
                    return <Chip key={val} label={label} size="small" />;
                })}
            </Box>
        );
    }, [multiple, options, placeholder]);

    return (
        <Form.Group className={`select-input-wrapper ${className}`}>
            <Select
                size="small"
                multiple={multiple}
                value={value || (multiple ? [] : "")}
                onChange={(e) => !shouldVirtualize && onChange?.(e.target.value)}
                disabled={disabled}
                fullWidth
                displayEmpty
                className="select-type-input"
                IconComponent={IoChevronDownCircleOutline}
                MenuProps={{
                    classes: { paper: "select-type-menu" },
                    disableAutoFocusItem: true,
                      autoFocus: false, 
                    TransitionProps: { timeout: 150 },
                    PaperProps: {
                        style: {
                            maxHeight: ITEM_HEIGHT * VISIBLE_ROWS + (searchable ? 60 : 0) + 16,
                        },
                    },
                }}
                onOpen={handleOpen}
                onClose={handleClose}
                renderValue={renderValue}
            >
           {searchable && (
    <div
        className="select-search-box"
        onKeyDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()} // ← ADD THIS
        onClick={(e) => e.stopPropagation()}      // ← ADD THIS
    >
        <TextField
            inputRef={searchRef}
            size="small"
            fullWidth
            placeholder="Search..."
            value={rawSearch}
            onChange={handleSearchChange}
            autoComplete="off"
            onKeyDown={(e) => e.stopPropagation()} 
             onMouseDown={(e) => e.stopPropagation()}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <LuSearch size={15} className="select-search-icon" />
                    </InputAdornment>
                ),
            }}
        />
    </div>
)}

                {filteredOptions.length === 0 ? (
                    <div className="select-no-results">No results found</div>
                ) : shouldVirtualize ? (
                    <div className="select-virtual-list-wrapper">
                        <VirtualizedMenuList
                            options={filteredOptions}
                            onSelect={handleVirtualSelect}
                            selectedValue={value}
                            multiple={multiple}
                        />
                    </div>
                ) : (
                    filteredOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))
                )}
            </Select>
        </Form.Group>
    );
};

export default SelectInput;

