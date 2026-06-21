import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import AuditLogsTimeline from "@/components/AuditLogsTimeline/AuditLogsTimeline";
import { fetchAuditLogsApi } from "@/features/auditLogs/auditLogApi";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import {
  groupAuditLogsByDate,
  mapAuditLogEntry,
} from "@/utils/auditLogHelpers";
import "./AuditLogsTabContent.scss";

const AuditLogsTabContent = ({ module, action, extraParams = {} }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuditLogs = async () => {
      if (!module) {
        setLogs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const query = { module, ...extraParams };
        if (action) query.action = action;

        const data = await fetchAuditLogsApi(query);

        if (isApiFailure(data)) {
          toast.error(data?.message || "Failed to load audit logs");
          setLogs([]);
          return;
        }

        const { rows } = extractListPayload(data);
        setLogs(rows.map(mapAuditLogEntry));
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load audit logs";
        toast.error(typeof msg === "string" ? msg : "Failed to load audit logs");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    void loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extraParams is a stable override object per tab
  }, [module, action]);

  const groupedLogs = useMemo(() => groupAuditLogsByDate(logs), [logs]);

  return (
    <div className="audit-logs-tab-content card-container">
      <AuditLogsTimeline groups={groupedLogs} loading={loading} />
    </div>
  );
};

export default AuditLogsTabContent;
