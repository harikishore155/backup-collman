import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import BackButton from "@/components/BackButton/BackButton";
import toast from "react-hot-toast";
import MultiTabs from "@/components/MultiTabs/MultiTabs";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import DeleteModal from "@/components/DeleteModal/DeleteModal";
import PreLoader from "@/components/PreLoader/PreLoader";
import {
  deleteCampaignApi,
  fetchCampaignByIdApi,
  pickCampaignFromResponse,
  updateCampaignStatusApi,
} from "@/features/campaigns/campaignApi";
import { toListStatus } from "@/utils/formatters";
import { isApiFailure } from "@/utils/apiHelpers";
import "./AllocationDetails.scss";

const campaignTitle = (c) =>
  String(
    c?.campaignName ?? c?.campaign_name ?? c?.name ?? c?.title ?? "Campaign",
  ).trim() || "Campaign";

const campaignDisplayId = (c) =>
  String(
    c?.campaignId ??
      c?.campaign_id ??
      c?.code ??
      c?.campaign_code ??
      c?._id ??
      "",
  ).trim();

const approvalLabel = (c) =>
  String(c?.approvalStatus ?? c?.approval_status ?? "—").trim();

const AllocationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusChecked, setStatusChecked] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refetchCampaign = useCallback(async () => {
    if (!id) {
      setCampaign(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const body = await fetchCampaignByIdApi(id);
      if (isApiFailure(body)) {
        toast.error(
          body?.message || body?.error || "Failed to load allocation",
        );
        setCampaign(null);
        navigate("/customer-mgt/allocation");
        return;
      }
      const next = pickCampaignFromResponse(body);
      setCampaign(next);
      setStatusChecked(
        toListStatus(next?.status ?? next?.is_active ?? next?.active) ===
          "Active",
      );
    } catch (error) {
      console.error("Failed to fetch allocation", error);
      toast.error(
        error?.response?.data?.message || "Failed to load allocation",
      );
      setCampaign(null);
      navigate("/customer-mgt/allocation");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    refetchCampaign();
  }, [refetchCampaign]);

  const handleStatusToggle = async (e) => {
    const next = e.target.checked;
    const prev = !next;
    if (!id) return;
    setStatusChecked(next);
    try {
      setStatusUpdating(true);
      const res = await updateCampaignStatusApi(id, {
        status: next ? "active" : "inactive",
      });
      if (isApiFailure(res)) {
        setStatusChecked(prev);
        toast.error(res?.message || "Failed to update status");
        return;
      }

      toast.success(res?.message || "Status updated");
      refetchCampaign();
    } catch (error) {
      console.error("Status update error:", error);
      setStatusChecked(prev);
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      setDeleteLoading(true);
      const res = await deleteCampaignApi(id);
      if (isApiFailure(res)) {
        toast.error(res?.message || "Failed to delete allocation");
        return;
      }

      toast.success(res?.message || "Allocation deleted successfully");
      navigate("/customer-mgt/allocation");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete allocation",
      );
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const tabs = [
    { label: "Cases", path: "cases" },
    { label: "Details", path: "details" },
    { label: "Audit logs", path: "audit-logs" },
  ];

  if (loading && !campaign) {
    return <PreLoader />;
  }

  const title = campaignTitle(campaign);
  const displayId = campaignDisplayId(campaign);
  const approval = approvalLabel(campaign);

  return (
    <div className="allocation-details-page">
      <div className="allocation-details-header card-container">
        <div className="header-top">
          <div className="allocation-info">
            <div className="allocation-title-row">
              <BackButton />
              <h5>{title}</h5>
            </div>
            <div className="allocation-meta">
              {displayId ? <span>Campaign ID: {displayId}</span> : null}
            </div>
          </div>

          <MoreIcon
            onEdit={() => navigate(`/customer-mgt/allocation/edit/${id}`)}
            onDelete={() => setShowDeleteModal(true)}
          />
        </div>

        <div className="header-status">
          <label>Status:</label>
          <div className="status-toggle">
            <IOSSwitch
              checked={statusChecked}
              onChange={handleStatusToggle}
              disabled={statusUpdating}
              color="success"
            />
            <span className={statusChecked ? "active" : "inactive"}>
              {statusChecked ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleConfirmDelete}
        loading={deleteLoading}
      />

      <div className="allocation-details-content mt-2">
        <MultiTabs tabs={tabs} baseDepth={4} />

        <div className="tab-panel-container mt-0">
          <Outlet context={{ campaign, loading, refetchCampaign }} />
        </div>
      </div>
    </div>
  );
};

export default AllocationDetails;
