import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import DataTable from "@/components/DataTable/DataTable";
import ListHeader from "@/components/ListHeader/ListHeader";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import PreLoader from "@/components/PreLoader/PreLoader";
import {
  formatTargetCurrency,
  mapTargetStatusRows,
  sumTargetStatusField,
} from "@/features/targets/targetMappers";

const StatusTab = () => {
  const { target, loading } = useOutletContext() ?? {};
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("All");

  const statusRows = useMemo(() => mapTargetStatusRows(target), [target]);

  const filterOptions = useMemo(() => {
    const names = [
      ...new Set(
        statusRows.map((row) => row.teleCaller).filter((n) => n && n !== "—"),
      ),
    ];
    return [
      { value: "All", label: "All" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [statusRows]);

  const columns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    { key: "date", title: "Date", dataIndex: "date" },
    {
      key: "teleCaller",
      title: "Tele caller",
      render: (_, record) => (
        <div className="tele-caller-cell">
          <span>{record.teleCaller}</span>
          <span className="emp-code">{record.empCode}</span>
        </div>
      ),
    },
    { key: "achievedCollection", title: "TGT2", dataIndex: "tgt2Display" },
    { key: "paidCases", title: "Paid Cases", dataIndex: "paidCases" },
  ];

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return statusRows.filter((item) => {
      const matchesFilter =
        filterBy === "All" ||
        item.teleCaller.toLowerCase() === filterBy.toLowerCase();

      if (!normalizedSearch) {
        return matchesFilter;
      }

      const matchesSearch = [
        item.date,
        item.teleCaller,
        item.empCode,
        item.tgt1Display,
        item.tgt2Display,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [statusRows, searchTerm, filterBy]);

  const paginatedRows = useMemo(() => {
    return filteredRows
      .slice((pageNo - 1) * rowsPerPage, pageNo * rowsPerPage)
      .map((item, index) => ({
        ...item,
        sno: (pageNo - 1) * rowsPerPage + index + 1,
      }));
  }, [filteredRows, pageNo, rowsPerPage]);

  const sumTgt1 = sumTargetStatusField(statusRows, "tgt1");
  const sumTgt2 = sumTargetStatusField(statusRows, "tgt2");

  if (loading && !target) {
    return <PreLoader />;
  }

  return (
    <div className="status-tab-content">
      <div className="target-summary-cards">
        <div className="summary-card summary-card-primary">
          Sum of TGT1: {formatTargetCurrency(sumTgt1)}
        </div>
        <div className="summary-card summary-card-success">
          Sum of TGT2: {formatTargetCurrency(sumTgt2)}
        </div>
      </div>

      <ListHeader
        searchValue={searchTerm}
        onSearchChange={(event) => {
          setSearchTerm(event.target.value);
          setPageNo(1);
        }}
        selectValue={filterBy}
        selectOptions={filterOptions}
        onSelectChange={(value) => {
          setFilterBy(value);
          setPageNo(1);
        }}
        searchPlaceholder="Search..."
      />

      <DataTable
        columns={columns}
        data={paginatedRows}
        className="target-status-table"
        emptyMessage={
          target ? "No status rows for this goal sheet." : "No target loaded."
        }
      />

      <CustomPagination
        pageNo={pageNo}
        rowsPerPage={rowsPerPage}
        totalCount={filteredRows.length}
        onPageChange={setPageNo}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPageNo(1);
        }}
      />
    </div>
  );
};

export default StatusTab;
