

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { FiDownload } from "react-icons/fi";
import AllocationTable from "../Allocationtable/Allocationtable";
import StatCard from "../Statcard/Statcard";
import TableCard from "../Tablecard/Tablecard";
import MtdDispoChart from "../MtdDispoChart/MtdDispoChart";
import FilterBar from "../FilterBar/FilterBar";
import Button from "@/components/Button/Button";
import {
  DrilldownPanel,
  PerformanceTable,
  TargetAchievementCard,
  TrendCard,
} from "../DashboardWidgets/DashboardWidgets";
import { pickRows } from "../dashboardHelpers";
import {
  fetchCampaignSummaryApi,
  fetchCollectionTrendApi,
  fetchDashboardAlertsApi,
  fetchDashboardDrilldownApi,
  fetchDashboardKpisApi,
  fetchMisDistributionApi,
  fetchPtpTrackingApi,
  fetchStatusDistributionApi,
  fetchTargetVsAchievementApi,
  fetchTelecallerPerformanceApi,
} from "@/features/dashboard/dashboardApi";
import { fetchClientsApi } from "@/features/clients/clientApi";
import { fetchCampaignsApi } from "@/features/campaigns/campaignApi";
import { fetchProductsApi } from "@/features/products/productApi";
import { fetchUsersApi } from "@/features/users/userApi";
import { extractListPayload } from "@/utils/apiHelpers";
import { normalizeRole } from "@/constants/permissions";
import { ROLES } from "@/constants/roles";
import "./DashboardLayout.scss";

const currentMonth = () => new Date().toISOString().slice(0, 7);
const defaultFilters = () => ({
  clientId: "", campaignId: "", month: currentMonth(), fromDate: "", toDate: "",
  productId: "", type: "", managerId: "", teamLeaderId: "", telecallerId: "",
});
const FILTER_LABELS = {
  clientId: "Client",
  campaignId: "Campaign",
  month: "Month",
  fromDate: "From Date",
  toDate: "To Date",
  productId: "Product",
  type: "Type",
  managerId: "Manager",
  teamLeaderId: "Team Leader",
  telecallerId: "Telecaller",
};
const cleanParams = (params) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== "" && value != null));
const unwrap = (response) => response?.data ?? response;
const idOf = (row) => row?._id ?? row?.id ?? row?.value ?? "";
const scalarLabel = (value) => {
  if (value == null || value === "" || typeof value === "object") return "";
  return String(value).trim();
};
const firstLabel = (...values) => values.map(scalarLabel).find(Boolean);
const isMongoObjectId = (value) => /^[a-f\d]{24}$$/i.test(scalarLabel(value));
const clientLabel = (row) => firstLabel(row?.bankName, row?.bank_name, row?.clientName, row?.client_name, row?.name, row?.code, row?.client_code);
const campaignLabel = (row) => {
  const candidates = [
    row?.campaignName, row?.campaign_name, row?.title, row?.portfolioName,
    row?.portfolio_name, row?.name, row?.campaignCode, row?.campaign_code,
    row?.campaignId, row?.campaign_id, row?.code,
  ].map(scalarLabel).filter((value) => value && !isMongoObjectId(value));
  if (candidates.length) return candidates[0];

  const descriptor = [
    firstLabel(row?.type, row?.campaignType, row?.campaign_type),
    firstLabel(row?.productName, row?.product_name, row?.product?.name, row?.productId?.name),
    firstLabel(row?.monthYear, row?.month_year),
  ].filter(Boolean).join(" - ");
  return descriptor || "Campaign";
};
const productLabel = (row) => firstLabel(row?.productName, row?.product_name, row?.name, row?.code);
const userLabel = (row) => firstLabel(row?.name, row?.fullName, row?.employeeName, row?.employeeId, row?.email);
const optionRows = (payload, getLabel) => extractListPayload(payload).rows.map((row) => {
  const value = idOf(row);
  const label = getLabel(row);
  return value && label ? { value: String(value), label: String(label) } : null;
}).filter(Boolean);
const userRoleName = (user) => user?.roleId?.name ?? user?.role?.name ?? user?.roleName ?? user?.role ?? "";
const roleKey = (user) => normalizeRole(userRoleName(user));
const userOptionsByRole = (rows, roles) => rows.filter((row) => roles.includes(normalizeRole(userRoleName(row)))).map((row) => ({ value: String(idOf(row)), label: String(userLabel(row) ?? idOf(row)) }));
const errorStatus = (error) => error?.response?.status;
const errorMessage = (error) => errorStatus(error) === 403 ? "You do not have permission to view this dashboard data." : error?.response?.data?.message ?? error?.message ?? "Unable to load dashboard data.";
const dashboardFailureMessage = (results) => {
  const rejected = results.filter((result) => result.status === "rejected");
  if (!rejected.length) return "";
  if (rejected.length === results.length) return errorMessage(rejected[0]?.reason);
  return "Some dashboard sections could not be refreshed.";
};

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);
const formatCurrency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const formatPercent = (value) => `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value) || 0)}%`;
const optionLabel = (options = [], value) => options.find((option) => String(option.value) === String(value))?.label ?? value;
const exportValue = (value) => {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};
const appendSheet = (workbook, sheetName, rows) => {
  const exportRows = rows.length ? rows : [{ Message: "No Data Available" }];
  const normalizedRows = exportRows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, exportValue(value)])));
  const worksheet = XLSX.utils.json_to_sheet(normalizedRows);
  worksheet["!cols"] = Object.keys(normalizedRows[0] ?? { Message: "" }).map((key) => ({
    wch: Math.min(45, Math.max(key.length, ...normalizedRows.map((row) => String(row[key] ?? "").length)) + 2),
  }));
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
};
const trendExportRows = (payload) => pickRows(unwrap(payload)).map((row) => ({
  Label: row.label ?? row.date ?? row.month ?? row.period ?? "-",
  Amount: Number(row.collectionAmount ?? row.amount ?? row.value ?? 0),
}));
const targetExportRows = (payload) => pickRows(unwrap(payload)).map((row) => ({
  Label: row.label ?? row.campaignName ?? row.name ?? row.month ?? "-",
  Target: Number(row.targetAmount ?? row.target ?? 0),
  Achieved: Number(row.achievedAmount ?? row.collectionAmount ?? row.achievement ?? 0),
}));

const mapKpis = (payload) => {
  const data = unwrap(payload) || {};
  return [
    { label: "Total Cases Allocated", value: formatNumber(data.totalCasesAllocated ?? data.allocatedCases ?? data.totalCases), metric: null },
    { label: "Total Contacted Cases", value: formatNumber(data.totalContactedCases ?? data.contactedCases), metric: "CONTACTED" },
    { label: "Total PTP Cases", value: formatNumber(data.totalPtpCases ?? data.ptpCases), metric: "PTP" },
    { label: "Total Paid Cases", value: formatNumber(data.totalPaidCases ?? data.paidCases), metric: "PAID" },
    { label: "Total Collection Amount", value: formatCurrency(data.totalCollectionAmount ?? data.collectionAmount), metric: "PAID" },
    { label: "Target Amount", value: formatCurrency(data.targetAmount), metric: null },
    { label: "Achievement %", value: formatPercent(data.achievementPercent), metric: null },
    { label: "Resolution %", value: formatPercent(data.resolutionPercent), metric: null },
    { label: "CE %", value: formatPercent(data.cePercent), metric: "CONTACTED" },
    { label: "NRRB %", value: formatPercent(data.nrrbPercent), metric: "NRRB" },
  ];
};
const miniRows = (payload, keys) => pickRows(unwrap(payload)).map((row) => ({
  ...row,
  label: keys.map((key) => row?.[key]).find((value) => value != null && value !== "") ?? "Unknown",
  count: row.count ?? row.total ?? row.value ?? 0,
}));
const campaignRows = (payload) => pickRows(unwrap(payload)).map((row, index) => ({
  ...row, id: row.campaignId ?? row.id ?? row._id ?? index,
  name: row.campaignName ?? row.name ?? row.campaignCode ?? "-",
  count: Number(row.totalCases ?? row.allocatedCases ?? row.caseCount ?? 0),
  posOrTos: Number(row.posOrTos ?? row.totalPOS ?? row.targetAmount ?? 0),
  totalPaid: Number(row.achievedAmount ?? row.collectionAmount ?? row.totalPaid ?? 0),
}));
const ptpRows = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data) || Array.isArray(data?.data) || Array.isArray(data?.rows)) return miniRows(data, ["label", "status", "bucket"]);
  return [
    { label: "Due Today", count: data?.dueToday ?? 0, metric: "PTP" },
    { label: "Upcoming Next Two Days", count: data?.upcomingNextTwoDays ?? data?.upcoming ?? 0, metric: "PTP" },
    { label: "Overdue", count: data?.overdue ?? 0, metric: "PTP" },
  ];
};

const TELECALLER_COLUMNS = [
  { key: "name", label: "Telecaller" }, { key: "allocatedCases", label: "Allocated" },
  { key: "contactedCases", label: "Contacted" }, { key: "ptpCases", label: "PTP" },
  { key: "paidCases", label: "Paid" }, { key: "collectionAmount", label: "Collection", format: "currency" },
];
const CAMPAIGN_COLUMNS = [
  { key: "name", label: "Campaign" }, { key: "count", label: "Cases" },
  { key: "posOrTos", label: "POS/TOS", format: "currency" }, { key: "totalPaid", label: "Paid", format: "currency" },
];

export default function DashboardLayout() {
  const user = useSelector((state) => state.auth?.user);
  const [filters, setFilters] = useState(defaultFilters);
  const [options, setOptions] = useState({ clients: [], campaigns: [], products: [], managers: [], teamLeaders: [], telecallers: [] });
  const [data, setData] = useState({});

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pollingMs, setPollingMs] = useState(60000);
  const requestRef = useRef({ controller: null, inFlight: false, sequence: 0 });
  const drilldownRequestRef = useRef({ controller: null, sequence: 0 });
  const [drilldown, setDrilldown] = useState({ open: false, level: "CASE", metric: "PAID", data: null, loading: false, error: "", extra: {}, query: { page: 1, limit: 10, search: "", sortBy: "", sortOrder: "asc" } });

  const loadOptions = useCallback(async () => {
    const results = await Promise.allSettled([fetchClientsApi({ limit: 1000 }), fetchCampaignsApi(), fetchProductsApi({ limit: 1000 }), fetchUsersApi({ limit: 1000 })]);
    const users = results[3].status === "fulfilled" ? extractListPayload(results[3].value).rows : [];
    setOptions({
      clients: results[0].status === "fulfilled" ? optionRows(results[0].value, clientLabel) : [],
      campaigns: results[1].status === "fulfilled" ? optionRows(results[1].value, campaignLabel) : [],
      products: results[2].status === "fulfilled" ? optionRows(results[2].value, productLabel) : [],
      managers: userOptionsByRole(users, [ROLES.MANAGER]),
      teamLeaders: userOptionsByRole(users, [ROLES.TEAM_LEADER]),
      telecallers: userOptionsByRole(users, [ROLES.TELE_CALLER]),
    });
  }, []);

  const fetchDashboard = useCallback(async ({ quiet = false } = {}) => {
    if (requestRef.current.inFlight && !requestRef.current.controller?.signal.aborted) return;
    requestRef.current.controller?.abort();
    const controller = new AbortController();
    const sequence = requestRef.current.sequence + 1;
    requestRef.current = { controller, inFlight: true, sequence };
    if (!quiet) setLoading(true);
    setError("");
    const params = cleanParams(filters);
    const calls = {
      kpis: fetchDashboardKpisApi(params, controller.signal),
      dailyTrend: fetchCollectionTrendApi(params, controller.signal),
      monthlyTrend: fetchCollectionTrendApi({ ...params, granularity: "monthly" }, controller.signal),
      target: fetchTargetVsAchievementApi(params, controller.signal),
      status: fetchStatusDistributionApi(params, controller.signal),
      mis: fetchMisDistributionApi(params, controller.signal),
      telecallers: fetchTelecallerPerformanceApi({ ...params, page: 1, limit: 100 }, controller.signal),
      campaigns: fetchCampaignSummaryApi({ ...params, page: 1, limit: 100 }, controller.signal),
      ptp: fetchPtpTrackingApi(params, controller.signal),
      alerts: fetchDashboardAlertsApi(params, controller.signal),
    };
    const keys = Object.keys(calls);
    const results = await Promise.allSettled(Object.values(calls));
    if (requestRef.current.sequence !== sequence || controller.signal.aborted) return;
    const next = {};
    let failures = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") next[keys[index]] = result.value;
      else failures += 1;
    });
    setData(next);
    setLastUpdated(new Date());
    if (failures) {
      const message = dashboardFailureMessage(results);
      setError(message);
      if (!quiet && failures < keys.length) toast.error(message);
    }
    requestRef.current.inFlight = false;
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => {
    fetchDashboard();
    return () => {
      requestRef.current.controller?.abort();
      drilldownRequestRef.current.controller?.abort();
    };
  }, [fetchDashboard]);
  useEffect(() => {
    if (!pollingMs) return undefined;
    const timer = window.setInterval(() => fetchDashboard({ quiet: true }), pollingMs);
    return () => window.clearInterval(timer);
  }, [fetchDashboard, pollingMs]);

  const fetchDrilldown = useCallback(async (nextState) => {
    setDrilldown((current) => ({ ...current, ...nextState, open: true, loading: true, error: "" }));
    const target = { ...drilldown, ...nextState };
    drilldownRequestRef.current.controller?.abort();
    const controller = new AbortController();
    const sequence = drilldownRequestRef.current.sequence + 1;
    drilldownRequestRef.current = { controller, sequence };
    try {
      const response = await fetchDashboardDrilldownApi(cleanParams({ ...filters, ...target.extra, level: target.level, metric: target.metric, ...target.query }), controller.signal);
      if (drilldownRequestRef.current.sequence !== sequence) return;
      setDrilldown((current) => ({ ...current, data: response, loading: false }));
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setDrilldown((current) => ({ ...current, loading: false, error: errorMessage(requestError) }));
    }
  }, [drilldown, filters]);

  const openDrilldown = (metric, level = "CASE", extra = {}) => fetchDrilldown({ level, metric, extra, query: { page: 1, limit: 10, search: "", sortBy: "", sortOrder: "asc" } });
  const kpis = useMemo(() => mapKpis(data.kpis), [data.kpis]);
  const campaigns = useMemo(() => campaignRows(data.campaigns), [data.campaigns]);
  const telecallers = useMemo(() => pickRows(unwrap(data.telecallers)).map((row) => ({ ...row, name: row.name ?? row.telecallerName ?? row.employeeId ?? "-" })), [data.telecallers]);
  const currentRole = roleKey(user);
  const canViewCampaignDrilldown = currentRole !== ROLES.TELE_CALLER;
  const canViewTelecallerDrilldown = ![ROLES.TELE_CALLER, ROLES.TEAM_LEADER].includes(currentRole);
  const filterExportRows = useMemo(() => {
    const lookup = {
      clientId: options.clients,
      campaignId: options.campaigns,
      productId: options.products,
      managerId: options.managers,
      teamLeaderId: options.teamLeaders,
      telecallerId: options.telecallers,
    };
    return Object.entries(filters).map(([key, value]) => ({
      Filter: FILTER_LABELS[key] ?? key,
      Value: value ? optionLabel(lookup[key], value) : key === "month" ? currentMonth() : "All",
    }));
  }, [filters, options]);

  const handleExport = () => {
    if (loading) return;
    if (!Object.keys(data).length) {
      toast.info("No dashboard data available to export.");
      return;
    }

    setExporting(true);
    try {
      const workbook = XLSX.utils.book_new();
      appendSheet(workbook, "Applied Filters", filterExportRows);
      appendSheet(workbook, "KPIs", kpis.map((item) => ({ Metric: item.label, Value: item.value })));
      appendSheet(workbook, "Daily Trend", trendExportRows(data.dailyTrend));
      appendSheet(workbook, "Monthly Trend", trendExportRows(data.monthlyTrend));
      appendSheet(workbook, "Target Achievement", targetExportRows(data.target));
      appendSheet(workbook, "Status Distribution", miniRows(data.status, ["status", "label", "name"]).map((row) => ({ Label: row.label, Count: row.count })));
      appendSheet(workbook, "MIS Distribution", miniRows(data.mis, ["misCode", "mis", "label", "name"]).map((row) => ({ Label: row.label, Count: row.count })));
      appendSheet(workbook, "PTP Tracking", ptpRows(data.ptp).map((row) => ({ Label: row.label, Count: row.count })));
      appendSheet(workbook, "Telecaller Performance", telecallers.map((row) => Object.fromEntries(TELECALLER_COLUMNS.map((column) => [column.label, row[column.key] ?? ""]))));
      appendSheet(workbook, "Campaign Performance", campaigns.map((row) => Object.fromEntries(CAMPAIGN_COLUMNS.map((column) => [column.label, row[column.key] ?? ""]))));

      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const filterTag = String(filters.month || filters.fromDate || "dashboard").replace(/[^\w-]/g, "");
      XLSX.writeFile(workbook, `dashboard_${filterTag}_${timestamp}.xlsx`);
      toast.success("Dashboard export downloaded.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div><h1 className="dashboard-title">Dashboard</h1><p className="dashboard-subtitle">Collection performance and case activity</p></div>
        <div className="dashboard-refresh-controls">
          <span>Last updated: {lastUpdated ? lastUpdated.toLocaleString("en-IN") : "Never"}</span>
          <div className="auto-refresh-selector">
            <span className="auto-refresh-tag">Auto Refresh</span>
            <select
              className="auto-refresh-select"
              value={pollingMs}
              onChange={(event) => setPollingMs(Number(event.target.value))}
            >
              <option value={0}>none</option>
              <option value={30000}>30 sec</option>
              <option value={60000}>1 min</option>
              <option value={300000}>5 min</option>
            </select>
          </div>
          <Button
            variant="primary"
            size="lg"
            disabled={loading}
            onClick={() => fetchDashboard()}
          >
            Refresh
          </Button>
          <Button
            variant="custom"
            size="lg"
            disabled={loading || exporting}
            onClick={handleExport}
            className="d-flex align-items-end gap-1"
          >
            <FiDownload aria-hidden="true" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>
      <FilterBar key={JSON.stringify(filters)} filters={filters} onApply={setFilters} onReset={setFilters} options={options} userRole={userRoleName(user)} loading={loading} />
      {error && <div className="dashboard-page-error" role="alert">{error}</div>}
      <div className="stats-grid dashboard-kpi-grid">
        {kpis.map((item) => <StatCard key={item.label} label={item.label} value={item.value} loading={loading} onClick={item.metric ? () => openDrilldown(item.metric) : undefined} />)}
      </div>
      <div className="dashboard-chart-grid">
        <TrendCard title="Daily Collection Trend" data={data.dailyTrend} loading={loading} />
        <TrendCard title="Monthly Collection Trend" data={data.monthlyTrend} loading={loading} />
        <TargetAchievementCard data={data.target} loading={loading} />
      </div>
      <div className="tables-grid">
        <TableCard title="Status Distribution" rows={miniRows(data.status, ["status", "label", "name"])} onRowClick={(row) => openDrilldown(String(row.label).toUpperCase() === "PAID" ? "PAID" : String(row.label).toUpperCase() === "PTP" ? "PTP" : String(row.label).toUpperCase().includes("NR") ? "NRRB" : "CONTACTED")} />
        <TableCard title="MIS Distribution" rows={miniRows(data.mis, ["misCode", "mis", "label", "name"])} onRowClick={() => openDrilldown("CONTACTED")} />
        <TableCard title="PTP Tracking" rows={ptpRows(data.ptp)} onRowClick={(row) => openDrilldown(row.metric ?? "PTP")} />
      </div>
      <MtdDispoChart data={miniRows(data.status, ["status", "label", "name"]).map((row) => ({ disposition: row.label, count: Number(row.count) || 0 }))} loading={loading} onBarClick={(row) => openDrilldown(String(row.disposition).toUpperCase() === "PAID" ? "PAID" : "CONTACTED")} />
      <PerformanceTable title="Telecaller Performance" rows={telecallers} columns={TELECALLER_COLUMNS} loading={loading} onDrilldown={canViewTelecallerDrilldown ? (row) => openDrilldown("PAID", "TELECALLER", { telecallerId: row.telecallerId ?? row.id ?? row._id }) : undefined} />
      <AllocationTable rows={campaigns} onRowClick={canViewCampaignDrilldown ? (row) => openDrilldown("PAID", "CAMPAIGN", { campaignId: row.campaignId ?? row.id }) : undefined} />
      <PerformanceTable title="Campaign Performance" rows={campaigns} columns={CAMPAIGN_COLUMNS} loading={loading} onDrilldown={canViewCampaignDrilldown ? (row) => openDrilldown("PAID", "CAMPAIGN", { campaignId: row.campaignId ?? row.id }) : undefined} />
      <DrilldownPanel state={drilldown} onClose={() => setDrilldown((current) => ({ ...current, open: false }))} onQueryChange={(changes) => fetchDrilldown({ query: { ...drilldown.query, ...changes } })} campaigns={options.campaigns} />
    </div>
  );
}

