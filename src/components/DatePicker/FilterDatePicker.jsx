import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "./FilterDatePicker.scss";

const FilterDatePicker = ({
  label,
  value,
  onChange,
  className = "",
  disabled = false,
  minDate,
  maxDate,
  ...rest
}) => {
  return (
    <div className={`filter-date-picker ${className}`}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label={label}
          disabled={disabled}
          value={value ? dayjs(value) : null}
          onChange={(newValue) =>
            onChange(newValue ? newValue.format("YYYY-MM-DD") : "")
          }
          minDate={minDate ? dayjs(minDate) : undefined}
          maxDate={maxDate ? dayjs(maxDate) : undefined}
          slotProps={{
            textField: {
              fullWidth: true,
              size: "small",
              variant: "standard",
              className: "custom-date-picker",
              InputProps: {
                disableUnderline: true,
              },
            },
            popper: {
              sx: {
                zIndex: 1500,
              },
            },
          }}
          {...rest}
        />
      </LocalizationProvider>
    </div>
  );
};

export default FilterDatePicker;
