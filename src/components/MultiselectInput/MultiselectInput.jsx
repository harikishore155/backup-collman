import Form from "react-bootstrap/Form";
import { MenuItem, Select, Checkbox, ListItemText } from "@mui/material";
import { IoIosArrowDown } from "react-icons/io";
import "./MultiselectInput.scss";

const MultiselectInput = ({
  value = [],
  options = [],
  placeholder = "Select options",
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <Form.Group className={`multi-select-wrapper ${className}`}>
      <Select
        multiple
        size="small"
        value={value || []}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        fullWidth
        displayEmpty
        className="multi-select-input"
        IconComponent={IoIosArrowDown}
        MenuProps={{ classes: { paper: "multi-select-menu" } }}
        renderValue={(selected) => {
          if (!selected || selected.length === 0) {
            return (
              <span className="multi-select-placeholder">
                {placeholder}
              </span>
            );
          }

          return options
            .filter((opt) => selected.includes(opt.value))
            .map((opt) => opt.label)
            .join(", ");
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Checkbox
              checked={value?.includes(option.value)}
              size="small"
            />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
    </Form.Group>
  );
};

export default MultiselectInput;
