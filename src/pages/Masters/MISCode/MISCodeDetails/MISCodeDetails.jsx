import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import MultiTabs from "@/components/MultiTabs/MultiTabs";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import BackButton from "@/components/BackButton/BackButton";
import PreLoader from "@/components/PreLoader/PreLoader";
import {
  fetchMisCodeByIdApi,
  updateMisCodeStatusApi,
} from "@/features/misCodes/misCodeApi";
import toast from "react-hot-toast";
import { formatClientRef } from "@/utils/formatters";
import "./MISCodeDetails.scss";

const pickMisRecordFromBody = (body) => {
  if (!body || typeof body !== "object") return null;
  const inner = body.data ?? body.misCode ?? body.mis_code ?? body.result;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner;
  if (body._id || body.id) return body;
  return null;
};

const MISCodeDetails = () => {
  const navigate = useNavigate();
  const { _id } = useParams();

  const [misCodeData, setMisCodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const tabs = [
    { label: "Description", path: "description" },
    { label: "Audit logs", path: "audit-logs" },
  ];

  const fetchMisCode = async () => {
    setLoading(true);
    try {
      const data = await fetchMisCodeByIdApi(_id);
      if (data?.success === false) {
        toast.error(data?.message || "Failed to load MIS code details");
        setMisCodeData(null);
        return;
      }
      const record = pickMisRecordFromBody(data);
      if (record) {
        setMisCodeData(record);
      } else {
        toast.error(data?.message || "Failed to load MIS code details");
        setMisCodeData(null);
      }
    } catch (error) {
      console.error("Fetch MIS code error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load MIS code details";
      toast.error(typeof msg === "string" ? msg : "Failed to load MIS code details");
      setMisCodeData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (_id) fetchMisCode();
  }, [_id]);

  const handleStatusToggle = async (e) => {
    const newStatus = e.target.checked ? "active" : "inactive";
    setMisCodeData((prev) => (prev ? { ...prev, status: newStatus } : prev));
    setStatusLoading(true);
    try {
      const data = await updateMisCodeStatusApi(_id, { status: newStatus });
      if (data?.success) {
        toast.success(data.message || `MIS code marked ${newStatus}`);
        if (data.data && typeof data.data === "object") {
          setMisCodeData(data.data);
        }
      } else {
        toast.error(data?.message || "Failed to update status");
        setMisCodeData((prev) =>
          prev ? { ...prev, status: newStatus === "active" ? "inactive" : "active" } : prev,
        );
      }
    } catch (error) {
      console.error("Status toggle error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update status";
      toast.error(typeof msg === "string" ? msg : "Failed to update status");
      setMisCodeData((prev) =>
        prev ? { ...prev, status: newStatus === "active" ? "inactive" : "active" } : prev,
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const statusRaw =
    misCodeData?.status ?? misCodeData?.is_active ?? misCodeData?.isActive;
  const isActive =
    typeof statusRaw === "boolean"
      ? statusRaw
      : String(statusRaw ?? "").toLowerCase().replace(/\s+/g, "") === "active";

  const displayMisId =
    misCodeData?.misId ?? misCodeData?._id ?? misCodeData?.id ?? misCodeData?.mis_id ?? "—";
  const displayMisCode =
    misCodeData?.misCode ?? misCodeData?.code ?? misCodeData?.mis_code ?? "—";
  const displayClientName = formatClientRef(
    misCodeData?.clientId ?? misCodeData?.client_id,
    "—",
  );
  const description = misCodeData?.description ?? misCodeData?.desc ?? "";
  const displayTitle = displayMisCode !== "—" ? String(displayMisCode) : "MIS code";

  if (loading) {
    return <PreLoader />;
  }

  if (!misCodeData) {
    return (
      <div className="mis-code-details-page">
        <div className="mis-code-details-header card-container">
          <div className="mis-code-title-row">
            <BackButton />
            <p className="mb-0">MIS code not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-code-details-page">
      <div className="mis-code-details-header card-container">
        <div className="header-top">
          <div className="mis-code-info">
            <div className="mis-code-title-row">
              <BackButton />
              <h5>{displayTitle}</h5>
            </div>
            <div className="mis-code-meta">
              <span>MIS ID: {displayMisId}</span>
              <span>MIS Code: {displayMisCode}</span>
              <span>Client Name: {displayClientName}</span>
            </div>
          </div>

          <MoreIcon
            onEdit={() => navigate(`/masters/mis-code/edit/${_id}`)}
          />
        </div>

        <div className="header-status">
          <label>Status:</label>
          <div className="status-toggle">
            <IOSSwitch
              checked={isActive}
              onChange={handleStatusToggle}
              disabled={statusLoading || !misCodeData}
              color="success"
            />
            <span className={isActive ? "active" : "inactive"}>
              {statusLoading ? "Updating..." : isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="mis-code-details-content mt-2">
        <MultiTabs tabs={tabs} baseDepth={4} />

        <div className="tab-panel-container mt-0">
          <Outlet context={{ misCodeData, description, loading }} />
        </div>
      </div>
    </div>
  );
};

export default MISCodeDetails;