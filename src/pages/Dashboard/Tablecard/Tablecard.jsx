import "./Tablecard.scss";

export default function TableCard({ title, rows = [], onRowClick }) {
  return (
    <div className="table-card">
      <div className="table-card-header">
        <span className="table-card-title">{title}</span>
      </div>
      <div className="inner-table-box">
        <table className="mini-table">
          <thead>
            <tr>
              <th></th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ textAlign: "center" }}>No data</td>
              </tr>
            ) : rows.map((row, i) => (
              <tr
                key={i}
                className={`${row.isTotal ? "total-row" : ""}${onRowClick ? " clickable-row" : ""}`}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(event) => event.key === "Enter" && onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
              >
                <td>{row.label}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
