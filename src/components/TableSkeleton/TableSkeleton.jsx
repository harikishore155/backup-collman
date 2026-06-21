import Skeleton from "@mui/material/Skeleton";
import "./TableSkeleton.scss";

const TableSkeleton = ({ rows = 10, columns = 5 }) => {
    return (
        <>
            {[...Array(rows)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                    {[...Array(columns)].map((_, colIndex) => (
                        <td key={colIndex} className="table-skeleton-cell"  >
                            <Skeleton
                                variant="text"
                                width="100%"
                                height={40}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

export default TableSkeleton;
