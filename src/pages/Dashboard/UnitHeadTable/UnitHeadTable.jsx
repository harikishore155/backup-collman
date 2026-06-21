import { useState } from "react";
import RoleTabs from "../../../components/RoleTabs/RoleTabs";
import { CircularProgress } from "@mui/material";
import "./UnitHeadTable.scss";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];

const TABS = [
  { label: "BKT", value: "bkt" },
  { label: "REC", value: "rec" },
];

// ─── Table ────────────────────────────────────────────────────────────────────
function UnitTable({ rows }) {
  return (
    <div className="unit-table-scroll">
      <table className="unit-table">
        <thead>
          {/* Group header */}
          <tr className="unit-thead-group">
            <th className="col-state" rowSpan={2}>STATE</th>
            <th colSpan={MONTHS.length}>POS</th>
            <th colSpan={MONTHS.length}>RES%</th>
            <th colSpan={MONTHS.length}>NR+RB%</th>
          </tr>
          {/* Month sub-header */}
          <tr className="unit-thead-months">
            {[...Array(3)].flatMap((_, g) =>
              MONTHS.map((m) => <th key={`${g}-${m}`}>{m}</th>)
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={19} style={{ textAlign: "center" }}>No data</td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i}>
              <td className="col-state">{row.state}</td>
              {row.pos.map((v, j)   => <td key={`p${j}`}>{v}</td>)}
              {row.res.map((v, j)   => <td key={`r${j}`}>{v}</td>)}
              {row.nrRb.map((v, j)  => <td key={`n${j}`}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UnitHeadTable({ data, loading }) {
  const [activeTab, setActiveTab] = useState("bkt");

  const currentBktRows = Array.isArray(data?.bkt) ? data.bkt : [];
  const currentRecRows = Array.isArray(data?.rec) ? data.rec : [];

  return (
    <div className="unit-head-card">
      <div className="unit-head-header">
        <h2 className="unit-head-title">Unit Head</h2>
      </div>
      <RoleTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      <div className="unit-head-body" style={{ minHeight: 200, position: "relative" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <CircularProgress size={40} />
          </div>
        ) : activeTab === "bkt" ? (
          <UnitTable rows={currentBktRows} />
        ) : (
          <UnitTable rows={currentRecRows} />
        )}
      </div>
    </div>
  );
}
