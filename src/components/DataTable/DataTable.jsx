import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import NoRecords from "@/components/NoRecords/NoRecords";
import PreLoader from "@/components/PreLoader/PreLoader";
import "./DataTable.scss";

const DataTable = ({
    columns,
    data,
    rowKey = "id",
    className = "",
    wrapperClassName = "",
    emptyMessage = "No records found",
    noRecordsVariant = "empty",
    loading = false,
    showScrollControls = false,
}) => {
    const scrollRef = useRef(null);
    const [scrollState, setScrollState] = useState({
        overflow: false,
        canScrollLeft: false,
        canScrollRight: false,
    });

    const updateScrollState = useCallback(() => {
        const element = scrollRef.current;
        if (!element) return;

        const maxScrollLeft = element.scrollWidth - element.clientWidth;
        const nextState = {
            overflow: maxScrollLeft > 2,
            canScrollLeft: element.scrollLeft > 2,
            canScrollRight: element.scrollLeft < maxScrollLeft - 2,
        };
        setScrollState((current) =>
            current.overflow === nextState.overflow &&
            current.canScrollLeft === nextState.canScrollLeft &&
            current.canScrollRight === nextState.canScrollRight
                ? current
                : nextState
        );
    }, []);

    useEffect(() => {
        updateScrollState();
        const element = scrollRef.current;
        if (!element) return undefined;

        const resizeObserver = new ResizeObserver(updateScrollState);
        resizeObserver.observe(element);
        const table = element.querySelector("table");
        if (table) resizeObserver.observe(table);

        return () => resizeObserver.disconnect();
    }, [data.length, loading, updateScrollState]);

    const scrollTable = (direction) => {
        scrollRef.current?.scrollBy({
            left: direction * Math.max(scrollRef.current.clientWidth * 0.7, 320),
            behavior: "smooth",
        });
    };

    return (
        <div className={`data-table-shell ${showScrollControls && scrollState.overflow ? "has-scroll-toolbar" : ""} ${scrollState.canScrollLeft ? "has-left-overflow" : ""} ${scrollState.canScrollRight ? "has-right-overflow" : ""}`.trim()}>
            {showScrollControls && scrollState.overflow && (
                <div className="table-scroll-toolbar" aria-label="Horizontal table navigation">
                    <span>View more columns</span>
                    <div className="table-scroll-controls">
                        <button
                            type="button"
                            onClick={() => scrollTable(-1)}
                            disabled={!scrollState.canScrollLeft}
                            aria-label="Scroll table left"
                        >
                            <FiArrowLeft />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollTable(1)}
                            disabled={!scrollState.canScrollRight}
                            aria-label="Scroll table right"
                        >
                            <FiArrowRight />
                        </button>
                    </div>
                </div>
            )}
            <div
                ref={scrollRef}
                className={`data-table-wrap ${wrapperClassName}`.trim()}
                onScroll={updateScrollState}
            >
                {loading ? (
                    <PreLoader />
                ) : data.length === 0 ? (
                    <NoRecords variant={noRecordsVariant} message={emptyMessage} />
                ) : (
                    <table className={`data-table ${className}`.trim()}>
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th key={column.key || column.dataIndex || column.title}>
                                        {column.title}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr key={row[rowKey] ?? rowIndex}>
                                    {columns.map((column) => {
                                        const value = column.dataIndex ? row[column.dataIndex] : undefined;
                                        return (
                                            <td key={column.key || column.dataIndex || column.title}>
                                                {column.render ? column.render(value, row) : value}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DataTable;
