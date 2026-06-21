import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CircularProgress } from "@mui/material";
import "./MtdDispoChart.scss";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="dispo-tooltip">
        <span className="dispo-tooltip-label">{label}</span>
        <span className="dispo-tooltip-value">{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

export default function MtdDispoChart({ data, loading, onBarClick }) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="mtd-dispo-card" style={{ position: "relative" }}>
      <div className="mtd-dispo-header">
        <span className="mtd-dispo-title">MTD Dispo</span>
      </div>

      <div className="mtd-dispo-body">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 380 }}>
            <CircularProgress size={40} />
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 380 }}>
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                horizontal={false}
                stroke="#D9D9D9"
                strokeWidth={0.8}
              />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748B" }}
              />
              <YAxis
                type="category"
                dataKey="disposition"
                width={115}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748B" }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,96,169,0.06)" }}
              />
              <Bar dataKey="count" fill="#0060A9" radius={[0, 2, 2, 0]} onClick={(entry) => onBarClick?.(entry)} cursor={onBarClick ? "pointer" : "default"} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
