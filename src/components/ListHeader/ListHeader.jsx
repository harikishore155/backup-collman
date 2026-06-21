import { FiFilter } from "react-icons/fi";
import SearchInput from "../SearchInput/SearchInput";
import SelectInput from "../SelectInput/SelectInput";
import "./ListHeader.scss";
import Button from "../Button/Button";

const ListHeader = ({
    selectValue,
    selectOptions = [],
    selectPlaceholder = "All",
    onSelectChange,
    searchValue = "",
    onSearchChange,
    searchPlaceholder = "Search...",
    filterLabel = "Filters",
    className = "",
    onFiltersClick,
    activeFiltersCount = 0,
}) => {
    return (
        <div className={`list-header-container ${className}`}>
            <SelectInput
                value={selectValue}
                options={selectOptions}
                placeholder={selectPlaceholder}
                onChange={onSelectChange}
                className="list-header-select mb-0"
            />

            <SearchInput
                value={searchValue}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                className="w-75 list-header-search"
            />

            <div className="list-header-filter-btn position-relative d-inline-flex">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={onFiltersClick}
                    className="d-flex align-items-center gap-2"
                >
                    <FiFilter aria-hidden />
                    {filterLabel}
                </Button>
                {activeFiltersCount > 0 && (
                    <span className="filter-badge">
                        {activeFiltersCount}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ListHeader;

