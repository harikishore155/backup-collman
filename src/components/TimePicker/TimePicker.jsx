import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import "./TimePicker.scss";

const CustomTimePicker = ({ label = "", value, onChange }) => {
    return (
        <div className="filter-time-picker mb-2">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                    label={label}
                    value={value ? dayjs(value, "HH:mm") : null}
                    onChange={(newValue) =>
                        onChange(newValue ? newValue.format("HH:mm") : "")
                    }
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
                    }}
                />
            </LocalizationProvider>
        </div>
    );
};

export default CustomTimePicker;
