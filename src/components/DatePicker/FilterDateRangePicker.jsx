import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import "./FilterDateRangePicker.scss";

const FilterDateRangePicker = ({ value, onChange, isRange }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="date-range">
                <DesktopDatePicker
                    value={value.from ? dayjs(value.from) : null}
                    onChange={(newValue) =>
                        onChange({ ...value, from: newValue ? newValue.format("YYYY-MM-DD") : "" })
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

                {isRange && (
                    <DesktopDatePicker
                        value={value.to ? dayjs(value.to) : null}
                        onChange={(newValue) =>
                            onChange({ ...value, to: newValue ? newValue.format("YYYY-MM-DD") : "" })
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
                )}
            </div>
        </LocalizationProvider>
    );
};

export default FilterDateRangePicker;
