import { useState, useRef, useEffect } from "react";
import arrowIcon from "../../assets/icons/arrow-circle-down.svg";
import "./Dropdown.scss";

const Dropdown = ({
    value = "",
    options = [],
    placeholder = "Select an option",
    onChange,
    disabled = false,
    error = "",
    label = "",
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (!ref.current?.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = options.find((o) => String(o.value) === String(value));

    const controlClass = [
        "dropdown-control",
        error ? "dropdown-control-error" : "",
        disabled ? "dropdown-control-disabled" : "",
    ].filter(Boolean).join(" ");

    return (
        <div className="dropdown" ref={ref}>
            {label && <label className="dropdown-label">{label}</label>}

            <div
                className={controlClass}
                onClick={() => !disabled && setOpen((p) => !p)}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        !disabled && setOpen((p) => !p);
                    }
                    if (e.key === "Escape") setOpen(false);
                }}
            >
                <span className={selected ? "dropdown-value" : "dropdown-placeholder"}>
                    {selected ? selected.label : placeholder}
                </span>

                <div className="dropdown-icon-cell">
                    <img
                        src={arrowIcon}
                        alt=""
                        className={`dropdown-arrow ${open ? "dropdown-arrow-open" : ""}`}
                    />
                </div>
            </div>

            {error && <span className="dropdown-error">{error}</span>}

            {open && (
                <ul className="dropdown-menu">
                    {options.map((opt) => (
                        <li
                            key={opt.value}
                            className={`dropdown-option ${String(opt.value) === String(value) ? "dropdown-option-active" : ""}`}
                            onClick={() => { onChange?.(opt.value); setOpen(false); }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Dropdown;