import { useEffect, useMemo, useState } from "react";
import SearchInput from "@/components/SearchInput/SearchInput";
import Button from "@/components/Button/Button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { pickRows } from "../dashboardHelpers";
import Skeleton from "@mui/material/Skeleton";
import TableSkeleton from "@/components/TableSkeleton/TableSkeleton";
import "./DashboardWidgets.scss";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export function TrendCard({ title, data, loading, dataKey = "amount" }) {
  const rows = pickRows(data).map((row) => ({
    ...row,
    label: row.label ?? row.date ?? row.month ?? row.period ?? "-",
    amount: Number(row[dataKey] ?? row.collectionAmount ?? row.amount ?? row.value ?? 0),
  }));
  return (
    <section className="dashboard-widget">
      <h2>{title}</h2>
      <div className="dashboard-chart">
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={280} animation="wave" sx={{ borderRadius: "8px" }} />
        ) : rows.length === 0 ? (
          <div className="dashboard-state">No Data Available</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => money(value)} width={90} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => money(value)} />
              <Line type="monotone" dataKey="amount" stroke="#0060a9" strokeWidth={2} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export function TargetAchievementCard({ data, loading }) {
  const rows = pickRows(data).map((row) => ({
    ...row,
    label: row.label ?? row.campaignName ?? row.name ?? row.month ?? "-",
    target: Number(row.targetAmount ?? row.target ?? 0),
    achieved: Number(row.achievedAmount ?? row.collectionAmount ?? row.achievement ?? 0),
  }));
  return (
    <section className="dashboard-widget">
      <h2>Target vs Achievement</h2>
      <div className="dashboard-chart">
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={280} animation="wave" sx={{ borderRadius: "8px" }} />
        ) : rows.length === 0 ? (
          <div className="dashboard-state">No Data Available</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => money(value)} width={90} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => money(value)} />
              <Legend />
              <Bar dataKey="target" fill="#94a3b8" />
              <Bar dataKey="achieved" fill="#0060a9" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

const valueFor = (row, column) => row?.[column.key] ?? "-";

export function PerformanceTable({ title, rows, columns, loading, onDrilldown }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: columns[0].key, order: "asc" });
  const [page, setPage] = useState(1);
  const limit = 10;
  const processed = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...pickRows(rows)]
      .filter((row) => !query || Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query)))
      .sort((a, b) => {
        const left = valueFor(a, sort.key);
        const right = valueFor(b, sort.key);
        const result = typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
        return sort.order === "asc" ? result : -result;
      });
  }, [rows, search, sort]);
  const pages = Math.max(1, Math.ceil(processed.length / limit));
  const visible = processed.slice((page - 1) * limit, page * limit);

  return (
    <section className="dashboard-widget dashboard-table-widget">
      <div className="dashboard-widget-heading">
        <h2>{title}</h2>
        <div className="dashboard-widget-search">
          <span className="sr-only">Search {title}</span>
          <SearchInput
            value={search}
            placeholder="Search..."
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
        </div>
      </div>
      <div className="dashboard-table-scroll">
        <table>
          <thead><tr>{columns.map((column) => (
            <th key={column.key}>
              <Button type="button" variant="custom" onClick={() => setSort((current) => ({ key: column.key, order: current.key === column.key && current.order === "asc" ? "desc" : "asc" }))}>
                {column.label}{sort.key === column.key ? (sort.order === "asc" ? " ↑" : " ↓") : ""}
              </Button>
            </th>
          ))}{onDrilldown && <th>Action</th>}</tr></thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={5} columns={columns.length + (onDrilldown ? 1 : 0)} />
            ) : visible.length === 0 ? (
              <tr><td colSpan={columns.length + 1}>No Data Available</td></tr>
            ) : visible.map((row, index) => (
              <tr key={row.id ?? row._id ?? index}>
                {columns.map((column) => <td key={column.key}>{column.format === "currency" ? money(valueFor(row, column)) : valueFor(row, column)}</td>)}
                {onDrilldown && <td><Button type="button" variant="custom" className="dashboard-link-btn" onClick={() => onDrilldown(row)}>View</Button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dashboard-pagination">
        <Button type="button" variant="custom" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <span>Page {page} of {pages}</span>
        <Button type="button" variant="custom" size="sm" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div>
    </section>
  );
}

export function AlertsCard({ alerts, loading, error, onDrilldown }) {
  const rows = pickRows(alerts);
  return (
    <section className="dashboard-widget dashboard-alerts">
      <h2>Alerts</h2>
      {loading ? (
        <div style={{ display: "grid", gap: "8px" }}>
          <Skeleton variant="rectangular" height={56} sx={{ borderRadius: "6px" }} animation="wave" />
          <Skeleton variant="rectangular" height={56} sx={{ borderRadius: "6px" }} animation="wave" />
          <Skeleton variant="rectangular" height={56} sx={{ borderRadius: "6px" }} animation="wave" />
        </div>
      ) : error ? <div className="dashboard-error">{error}</div> : rows.length === 0 ? <div className="dashboard-state">No Data Available</div> : (
        <ul>{rows.map((alert, index) => (
          <li key={alert.id ?? alert._id ?? index}>
            <div>{alert.title ?? alert.type ?? "Alert"}<span>{alert.message ?? alert.description ?? alert.label ?? ""}</span></div>
            {(alert.type === "OVERDUE_PTP" || String(alert.title ?? "").toLowerCase().includes("overdue")) && (
              <Button type="button" variant="custom" className="dashboard-link-btn" onClick={() => onDrilldown("PTP")}>View</Button>
            )}
          </li>
        ))}</ul>
      )}
    </section>
  );
}

export function DrilldownPanel({ state, onClose, onQueryChange, campaigns = [] }) {
  if (!state.open) return null;
  const [localSearch, setLocalSearch] = useState(state.query.search);

  useEffect(() => {
    setLocalSearch(state.query.search);
  }, [state.query.search]);

  const rows = pickRows(state.data);
  const total = Number(state.data?.total ?? state.data?.totalCount ?? rows.length);
  const pages = Math.max(1, Math.ceil(total / state.query.limit));
  const sortableFields = new Set(["name", "customerName", "campaignName", "telecallerName", "amount", "collectionAmount", "status", "createdAt", "date"]);

  const processedRows = useMemo(() => {
    return rows.map((row) => {
      let campaignName = "";
      if (row.campaignName) {
        campaignName = String(row.campaignName);
      } else if (row.campaignId && typeof row.campaignId === "object") {
        campaignName = String(
          row.campaignId.campaignName ??
          row.campaignId.campaign_name ??
          row.campaignId.name ??
          row.campaignId.title ??
          row.campaignId.code ??
          ""
        );
      } else if (row.campaign && typeof row.campaign === "object") {
        campaignName = String(
          row.campaign.campaignName ??
          row.campaign.campaign_name ??
          row.campaign.name ??
          row.campaign.title ??
          ""
        );
      }

      if (!campaignName) {
        const cid = row.campaignId && typeof row.campaignId === "object"
          ? (row.campaignId._id ?? row.campaignId.id)
          : row.campaignId;
        if (cid) {
          const found = campaigns.find((c) => String(c.value) === String(cid));
          if (found) campaignName = found.label;
        }
      }

      return {
        ...row,
        campaignName: campaignName || "-",
      };
    });
  }, [rows, campaigns]);

  const keys = useMemo(() => {
    if (!processedRows.length) return [];
    const rawKeys = Object.keys(processedRows[0]).filter(
      (key) => key !== "_id" && key !== "campaignId" && typeof processedRows[0][key] !== "object"
    );
    const hasCampaignName = rawKeys.includes("campaignName");
    const otherKeys = rawKeys.filter((key) => key !== "campaignName");
    const orderedKeys = hasCampaignName ? ["campaignName", ...otherKeys] : otherKeys;
    return orderedKeys.slice(0, 8);
  }, [processedRows]);

  return (
    <div className="dashboard-drilldown-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dashboard-drilldown" role="dialog" aria-modal="true" aria-label="Dashboard drilldown">
        <div className="dashboard-widget-heading">
          <h2>{state.level} Drilldown: {state.metric}</h2>
          <Button type="button" className="dashboard-secondary-btn" onClick={onClose} variant="tertiary" size="md">Back</Button>
        </div>
        <div className="dashboard-drilldown-search-box">
          <span>Search</span>
          <SearchInput
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onDebouncedChange={(val) => onQueryChange({ search: val, page: 1 })}
            placeholder="Search..."
          />
        </div>
        {state.loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "10px 0" }}>
            <Skeleton variant="rectangular" height={40} sx={{ borderRadius: "6px" }} animation="wave" />
            <Skeleton variant="rectangular" height={32} sx={{ borderRadius: "6px" }} animation="wave" />
            <Skeleton variant="rectangular" height={32} sx={{ borderRadius: "6px" }} animation="wave" />
            <Skeleton variant="rectangular" height={32} sx={{ borderRadius: "6px" }} animation="wave" />
            <Skeleton variant="rectangular" height={32} sx={{ borderRadius: "6px" }} animation="wave" />
          </div>
        ) : state.error ? <div className="dashboard-error">{state.error}</div> : processedRows.length === 0 ? <div className="dashboard-state">No Data Available</div> : (
          <div className="dashboard-table-scroll"><table><thead><tr>{keys.map((key) => <th key={key}>{sortableFields.has(key) ? <Button type="button" variant="custom" onClick={() => onQueryChange({ sortBy: key, sortOrder: state.query.sortBy === key && state.query.sortOrder === "asc" ? "desc" : "asc", page: 1 })}>{key}{state.query.sortBy === key ? (state.query.sortOrder === "asc" ? " ↑" : " ↓") : ""}</Button> : key}</th>)}</tr></thead><tbody>{processedRows.map((row, index) => <tr key={row.id ?? row._id ?? index}>{keys.map((key) => <td key={key}>{String(row[key] ?? "-")}</td>)}</tr>)}</tbody></table></div>
        )}
        <div className="dashboard-pagination">
          <Button type="button" variant="custom" size="sm" disabled={state.query.page <= 1} onClick={() => onQueryChange({ page: state.query.page - 1 })}>Previous</Button>
          <span>Page {state.query.page} of {pages}</span>
          <Button type="button" variant="custom" size="sm" disabled={state.query.page >= pages} onClick={() => onQueryChange({ page: state.query.page + 1 })}>Next</Button>
        </div>
      </section>
    </div>
  );
}
