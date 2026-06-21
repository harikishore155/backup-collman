import { GoSortAsc, GoSortDesc } from "react-icons/go";
import "./SortableHeader.scss";

const SortableHeader = ({ label, sortKey, sortConfig, onSort, sortable = false }) => {
    const isActive = sortConfig.key === sortKey;
    const direction = isActive ? sortConfig.direction : null;

    return (
        <div
            className={`sortable-header ${sortable ? "clickable" : "disabled"}`}
            onClick={() => sortable && onSort(sortKey)}
        >
            {label}
            {sortable && (
                <span>
                    {direction === "asc" && <GoSortAsc className="sort-icon active" />}
                    {direction === "desc" && <GoSortDesc className="sort-icon active" />}
                    {!direction && <GoSortDesc className="sort-icon default" />}
                </span>
            )}
        </div>
    );
};

export default SortableHeader;
