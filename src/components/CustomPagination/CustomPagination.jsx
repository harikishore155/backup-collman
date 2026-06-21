import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import "./CustomPagination.scss";

const CustomPagination = ({
    pageNo,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions = [10, 20, 50, 100],
    shape = "rounded",
    variant = "outlined",
}) => {
    const totalPages = Math.ceil(totalCount / rowsPerPage) || 1;

    if (totalCount === 0) return null;

    const handleChangePage = (_, value) => {
        onPageChange(value);
    };

    return (
        <Stack
            spacing={2}
            direction="row"
            sx={{
                alignItems: "center",
                justifyContent: "space-between",
                mt: 2,
            }}
            className="pagination-container"
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }} className="rows-selector">
                <p className="rows-tag">Rows per page:</p>
                <Select
                    size="small"
                    value={rowsPerPage}
                    onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                    className="rows-per-page-select"
                >
                    {rowsPerPageOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            <Pagination
                count={totalPages}
                page={pageNo}
                onChange={handleChangePage}
                shape={shape}
                variant={variant}
                className="pagination-count"
            />
        </Stack>
    )
}

export default CustomPagination;
