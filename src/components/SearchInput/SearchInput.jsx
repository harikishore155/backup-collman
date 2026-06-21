import { useRef, useEffect } from "react";
import { IoSearch, IoClose } from "react-icons/io5";
import "./SearchInput.scss";


const SearchInput = ({
  value = "",
  onChange,
  onDebouncedChange,
  debounceMs = 300,
  placeholder = "Search",
  className = "",
  style,
  inputProps = {},
}) => {
  const timerRef = useRef(null);

  const handleChange = (e) => {
    // 1. Always fire onChange immediately — keeps the controlled input snappy
    onChange?.(e);

    // 2. Debounce the API-triggering callback
    if (onDebouncedChange) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onDebouncedChange(e.target.value);
      }, debounceMs);
    }
  };

  const handleClear = () => {
    clearTimeout(timerRef.current);
    onChange?.({ target: { value: "" } });
    // Fire immediately on clear — no reason to wait
    onDebouncedChange?.("");
  };

  // Clean up timer when the component unmounts
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className={`search-wrapper ${className}`} style={style}>
      <IoSearch className="search-icon" aria-hidden="true" />
      <input
        type="search"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        aria-label={placeholder}
        autoComplete="off"
        spellCheck={false}
        {...inputProps}
      />
      {value && (
        <button
          className="search-clear"
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
          tabIndex={0}
        >
          <IoClose />
        </button>
      )}
    </div>
  );
};

export default SearchInput;