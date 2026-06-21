import { useState } from "react";
import RoleTabs from "../../../components/RoleTabs/RoleTabs";
import { CircularProgress } from "@mui/material";
import "./ManagerReport.scss";

const TABS = [
  { label: "BKT", value: "bkt" },
  { label: "REC", value: "rec" },
];

// ─── Column definitions ───────────────────────────────────────────────────────
const BKT_COLS = [
  "Count",
  "Total POS",
  "Collection",
  "Res Target%",
  "NRRB Target%",
  "Paid Count",
  "RES%",
  "NR RB%",
  "RES TO GO%",
  "NR RB To Go%",
  "PTP%",
  "Projection%",
  "CE%",
];

const REC_PORTFOLIO_COLS = [
  "Count",
  "Total POS",
  "Collection",
  "CE%",
  "Paid Count",
  "Target Value",
  "To Go Value",
  "Total PTP Value",
  "Projection Value",
  "NR RB To Go%",
  "PTP%",
  "Projection%",
  "CE%",
];

const REC_COMMON_COLS = [
  "Count",
  "Total POS",
  "Collection",
  "Res Target%",
  "NRRB Target%",
  "Paid Count",
  "RES%",
  "NR RB%",
  "RES TO GO%",
  "NR RB To Go%",
  "PTP%",
  "Projection%",
  "CE%",
];

// ─── Single section table ─────────────────────────────────────────────────────
function SectionTable({ label, cols, rows }) {
  return (
    <table className="mgr-table">
      <thead>
        <tr>
          <th className="col-label">{label}</th>
          {cols.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={cols.length + 1} style={{ textAlign: "center" }}>No data</td>
          </tr>
        ) : rows.map((row, i) => (
          <tr key={i}>
            <td className="col-label">{row?.name || ""}</td>
            {cols.map((col) => {
              const key = col.toLowerCase().replace(/%/g, "").replace(/\s+/g, "_");
              const value = row ? row[key] ?? row[col] ?? "" : "";
              return <td key={col}>{value}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ManagerReport({ data, loading }) {
  const [activeTab, setActiveTab] = useState("bkt");

  // Map sections based on active tab and dynamic data
  const getSections = () => {
    if (activeTab === "bkt") {
      return [
        { label: "Portfolio Name", cols: BKT_COLS, rows: data?.bkt?.portfolio ?? [] },
        { label: "AM Name", cols: BKT_COLS, rows: data?.bkt?.am ?? [] },
        { label: "TL Name", cols: BKT_COLS, rows: data?.bkt?.tl ?? [] },
      ];
    } else {
      return [
        { label: "Portfolio Name", cols: REC_PORTFOLIO_COLS, rows: data?.rec?.portfolio ?? [] },
        { label: "AM Name", cols: REC_COMMON_COLS, rows: data?.rec?.am ?? [] },
        { label: "TL Name", cols: REC_COMMON_COLS, rows: data?.rec?.tl ?? [] },
      ];
    }
  };

  const sections = getSections();

  return (
    <div className="mgr-report-card">
      <div className="mgr-report-header">
        <h2 className="mgr-report-title">Manager Report</h2>
      </div>

      <RoleTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mgr-report-body" style={{ minHeight: 250, position: "relative" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 250 }}>
            <CircularProgress size={40} />
          </div>
        ) : (
          sections.map((section, i) => (
            <div key={`${activeTab}-${i}`} className="mgr-scroll-wrapper">
              <SectionTable
                label={section.label}
                cols={section.cols}
                rows={section.rows}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
