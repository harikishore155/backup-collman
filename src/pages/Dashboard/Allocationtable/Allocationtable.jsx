import "./Allocationtable.scss";

const parseAmount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null || value === "") return 0;
  const n = Number(String(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const formatAmount = (value) => `₹${value.toLocaleString("en-IN")}`;

const formatCell = (value, asAmount = false) => {
  if (value == null || value === "") return "—";
  if (asAmount) {
    return typeof value === "number" ? formatAmount(value) : value;
  }
  return value;
};

export default function AllocationTable({ rows = [], onRowClick }) {
  const dataRows = rows.filter((row) => !row.isTotal);

  const totals = dataRows.reduce(
    (acc, row) => ({
      count: acc.count + (Number(row.count) || 0),
      posOrTos: acc.posOrTos + parseAmount(row.posOrTos),
      totalPaid: acc.totalPaid + parseAmount(row.totalPaid),
    }),
    { count: 0, posOrTos: 0, totalPaid: 0 },
  );

  return (
    <div className="allocation-card-container">
      <span className="allocation-title">Allocation Report</span>
      <div className="inner-table-box">
        <div className="allocation-scroll">
          <table className="allocation-table">
            <thead>
              <tr>
                <th></th>
                <th>Count</th>
                <th>POS or TOS</th>
                <th>Total Paid Amount</th>
              </tr>
            </thead>
            <tbody>
              {dataRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>No data</td>
                </tr>
              ) : dataRows.map((row) => (
                <tr key={row.id ?? row.name} onClick={() => onRowClick?.(row)} className={onRowClick ? "clickable-row" : ""}>
                  <td>
                    <span className="alloc-link">{row.name}</span>
                  </td>
                  <td>{formatCell(row.count)}</td>
                  <td>{formatCell(row.posOrTos, true)}</td>
                  <td>{formatCell(row.totalPaid, true)}</td>
                </tr>
              ))}
              {dataRows.length > 0 && (
                <tr className="total-row">
                  <td>
                    <span className="alloc-link">Total</span>
                  </td>
                  <td>{totals.count}</td>
                  <td>{formatAmount(totals.posOrTos)}</td>
                  <td>{formatAmount(totals.totalPaid)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
