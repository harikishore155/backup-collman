import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import MultiTabs from "@/components/MultiTabs/MultiTabs";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import BackButton from "@/components/BackButton/BackButton";
import PreLoader from "@/components/PreLoader/PreLoader";
import { fetchTypeByIdApi, updateTypeStatusApi } from "@/features/types/typeApi";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import "./TypeDetails.scss";

const TypeDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [typeData, setTypeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const tabs = [
    { label: "Description", path: "description" },
    { label: "Audit logs", path: "audit-logs" },
  ];

  const fetchType = async () => {
    setLoading(true);
    try {
      const data = await fetchTypeByIdApi(id);
      if (data?.success) {
        setTypeData(data.data);
      } else {
        toast.error(data?.message || "Failed to load type details");
      }
    } catch (error) {
      console.error("Fetch type error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load type details";
      toast.error(typeof msg === "string" ? msg : "Failed to load type details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchType();
  }, [id]);

  const handleStatusToggle = async (e) => {
    const newStatus = e.target.checked ? "active" : "inactive";
    setTypeData((prev) => ({ ...prev, status: newStatus }));
    setStatusLoading(true);
    try {
      const data = await updateTypeStatusApi(id, { status: newStatus });
      if (data?.success) {
        toast.success(data.message || `Type marked ${newStatus}`);
        setTypeData(data.data);
      } else {
        toast.error(data?.message || "Failed to update status");
        setTypeData((prev) => ({
          ...prev,
          status: newStatus === "active" ? "inactive" : "active",
        }));
      }
    } catch (error) {
      console.error("Status toggle error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update status";
      toast.error(typeof msg === "string" ? msg : "Failed to update status");
      setTypeData((prev) => ({
        ...prev,
        status: newStatus === "active" ? "inactive" : "active",
      }));
    } finally {
      setStatusLoading(false);
    }
  };

  const isActive = typeData?.status?.toLowerCase() === "active";
  const displayTitle = typeData
    ? `${typeData.typeCategory} - ${typeData.typeName}`
    : "—";
  const displayTypeId = typeData?.typeId ?? "—";
  const description = typeData?.description ?? "";
  const deadline = typeData?.allocationCreationDeadline
    ? dayjs(typeData.allocationCreationDeadline).format("DD/MM/YYYY")
    : "—";

  if (loading) {
    return <PreLoader />;
  }

  return (
    <div className="type-details-page">
      <div className="type-details-header card-container">
        <div className="header-top">
          <div className="type-info">
            <div className="type-title-row">
              <BackButton />
              <h5>{displayTitle}</h5>
            </div>
            <div className="type-meta">
              <span>Type ID: {displayTypeId}</span>
              <span>Deadline: {deadline}</span>
            </div>
          </div>

          <MoreIcon
            onEdit={() => navigate(`/masters/type/edit/${id}`)}
          />
        </div>

        <div className="header-status">
          <label>Status:</label>
          <div className="status-toggle">
            <IOSSwitch
              checked={isActive}
              onChange={handleStatusToggle}
              disabled={statusLoading || !typeData}
              color="success"
            />
            <span className={isActive ? "active" : "inactive"}>
              {statusLoading ? "Updating..." : isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="type-details-content mt-2">
        <MultiTabs tabs={tabs} baseDepth={4} />

        <div className="tab-panel-container mt-0">
          <Outlet context={{ typeData, description, loading }} />
        </div>
      </div>
    </div>
  );
};

export default TypeDetails;