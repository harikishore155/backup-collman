import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ReportHome.scss";

import { LuFolderOpen } from "react-icons/lu";
import toast from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";
import REPORT_ENDPOINTS from "@/api/endpoints/reportEndpoints";
import ListHeader from "@/components/ListHeader/ListHeader";
import ViewIcon from "@/components/ViewIcon/ViewIcon";
import PreLoader from "@/components/PreLoader/PreLoader";

// ── Helpers ───────────────────────────────────────────────────────────────────

// "TELECALLER_ACTIVITY" → "Telecaller Activity"  (used as route segment too)
const formatReportName = (key) =>
  key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ") + " Report";

// "TELECALLER_ACTIVITY" → "telecaller-activity"  (clean URL segment)
const toRouteSlug = (key) => key.toLowerCase().replace(/_/g, "-");

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Recent", value: "recent" },
  { label: "Archived", value: "archived" },
];

// ─────────────────────────────────────────────────────────────────────────────
const ReportHome = () => {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [rows, setRows] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReports = async () => {
    setListLoading(true);
    try {
      const res = await axiosInstance.get(REPORT_ENDPOINTS.LIST);
      const data = res.data;

      if (data?.success === false) {
        toast.error(data?.message || "Failed to load reports");
        setReports([]);
        setRows([]);
        return;
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      const mapped = list.map((key, index) => ({
        id: index + 1,
        key, // raw key e.g. "TELECALLER_ACTIVITY"
        slug: toRouteSlug(key), // route segment e.g. "telecaller-activity"
        reportName: formatReportName(key),
      }));

      setReports(mapped);
      setRows(mapped);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load reports";
      toast.error(typeof msg === "string" ? msg : "Failed to load reports");
      setReports([]);
      setRows([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearchChange = (val) => {
    setSearchValue(val);
    if (!val.trim()) {
      setRows(reports);
      return;
    }
    setRows(
      reports.filter((r) =>
        r.reportName.toLowerCase().includes(val.toLowerCase()),
      ),
    );
  };

  // ── View → navigate to DCRsList (or report-specific page) ─────────────────
  const handleView = (row) => {
    // Map each report key to its existing route
    const ROUTE_MAP = {
      ALLOCATION: "/customer-mgt/allocation",
      MIS: "/masters/mis-code",
      DCR_SUMMARY: "/dcrs",
      COLLECTION: "/customer-mgt/goal-sheet", // ← add this
      PERFORMANCE: "/customer-mgt/incentives",
      CAMPAIGN_SUMMARY: "/customer-mgt/customers",
      TELECALLER_ACTIVITY: "/reports/telecaller-activity",
      PTP: "/reports/ptp",
    };

    const path = ROUTE_MAP[row.key] ?? `/reports/view/${row.slug}`;
    navigate(path);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="report-home-page">
      <div className="report-container">
        {/* ── HEADER ── */}
        <div className="report-header">
          <div className="report-header-left">
            <h4 className="report-title">Reports</h4>
            <p className="report-subtitle">
              Build, group, and share insights from your CRM data.
            </p>
          </div>
        </div>

        {/* ── FILTER BAR ── */}
        {/* <ListHeader
          selectValue={selectedFilter}
          selectOptions={FILTER_OPTIONS}
          selectPlaceholder="All"
          onSelectChange={setSelectedFilter}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search..."
          filterLabel="Filters"
        /> */}

        {/* ── TABLE CARD ── */}
        <div className="report-table-card">
          <div className="report-table-wrap">
            {listLoading ? (
              <PreLoader />
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th className="col-sno">S.No</th>
                    <th className="col-name">Report Name</th>
                    <th className="col-view">View</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="col-empty" colSpan={3}>
                        No reports found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => (
                      <tr key={row.id}>
                        <td className="col-sno">{index + 1}</td>

                        <td className="col-name">
                          <div className="report-file-item">
                            <span className="file-icon" aria-hidden="true">
                              <LuFolderOpen size={16} color="#37b7d1" />
                            </span>
                            <span className="file-name">{row.reportName}</span>
                          </div>
                        </td>

                        <td className="col-view">
                          <ViewIcon onClick={() => handleView(row)} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportHome;
