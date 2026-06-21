import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import MultiTabs from "@/components/MultiTabs/MultiTabs";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import DeleteModal from "@/components/DeleteModal/DeleteModal";
import PreLoader from "@/components/PreLoader/PreLoader";
import BackButton from "@/components/BackButton/BackButton";
import {
  deleteTargetApi,
  fetchTargetByIdApi,
  getTargetApiErrorMessage,
  pickTargetFromResponse,
  updateTargetStatusApi,
} from "@/features/targets/targetApi";
import {
  targetDisplayId,
  targetDisplayMeta,
  targetDisplayTitle,
} from "@/features/targets/targetMappers";
import { formatDisplayDate, toListStatus } from "@/utils/formatters";
import { isApiFailure } from "@/utils/apiHelpers";
import "./TargetDetails.scss";

const TargetDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusChecked, setStatusChecked] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const refetchTarget = useCallback(async () => {
    if (!id) {
      setTarget(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const body = await fetchTargetByIdApi(id);
      if (isApiFailure(body)) {
        toast.error(body?.message || body?.error || "Failed to load target");
        setTarget(null);
        navigate("/customer-mgt/goal-sheet");
        return;
      }

      const next = pickTargetFromResponse(body);
      setTarget(next);
      setStatusChecked(
        toListStatus(next?.status ?? next?.is_active ?? next?.active) === "Active",
      );
    } catch (error) {
      console.error("Failed to fetch target", error);
      toast.error(getTargetApiErrorMessage(error, "Failed to load target"));
      setTarget(null);
      navigate("/customer-mgt/goal-sheet");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    refetchTarget();
  }, [refetchTarget]);

  const handleStatusToggle = async (event) => {
    const next = event.target.checked;
    const prev = !next;
    if (!id) return;

    setStatusChecked(next);
    try {
      setStatusUpdating(true);
      const res = await updateTargetStatusApi(id, {
        status: next ? "active" : "inactive",
      });
      if (isApiFailure(res)) {
        setStatusChecked(prev);
        toast.error(res?.message || res?.error || "Failed to update status");
        return;
      }

      toast.success(res?.message || "Status updated");
      refetchTarget();
    } catch (error) {
      setStatusChecked(prev);
      toast.error(getTargetApiErrorMessage(error, "Failed to update status"));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;

    try {
      setDeleteLoading(true);
      const res = await deleteTargetApi(id);
      if (isApiFailure(res)) {
        toast.error(res?.message || res?.error || "Failed to delete target");
        return;
      }

      toast.success(res?.message || "Target deleted successfully");
      navigate("/customer-mgt/goal-sheet");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(getTargetApiErrorMessage(error, "Failed to delete target"));
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const tabs = [
    { label: "Status", path: "status" },
    { label: "Details", path: "details" },
    { label: "Audit logs", path: "audit-logs" },
  ];

  if (loading && !target) {
    return <PreLoader />;
  }

  const title = targetDisplayTitle(target);
  const displayId = targetDisplayId(target);
  const { month, bank, product, type } = targetDisplayMeta(target);
  const createdAt = formatDisplayDate(
    target?.createdAt ?? target?.created_at ?? target?.createdOn,
  );
  const modifiedAt = formatDisplayDate(
    target?.updatedAt ?? target?.updated_at ?? target?.modifiedAt ?? target?.modified_at,
  );

  return (
    <div className="target-details-page">
      <div className="target-details-header card-container">
        <div className="header-top">
          <div className="target-info">
            <div className="target-title-row">
              <BackButton />
              <h5>{title}</h5>
            </div>
            <div className="target-meta">
              {displayId ? <span>Target ID: {displayId}</span> : null}
              {bank ? <span>Bank: {bank}</span> : null}
              {month ? <span>Month: {month}</span> : null}
              {product ? <span>Product: {product}</span> : null}
              {type ? <span>Type: {type}</span> : null}
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

          <div className="header-actions">
            <div className="timestamps">
              <p>Created at : {createdAt}</p>
              <p>Modified at: {modifiedAt}</p>
            </div>
            <MoreIcon
              onEdit={() => navigate(`/customer-mgt/goal-sheet/edit/${id}`)}
              onDelete={() => setShowDeleteModal(true)}
            />
          </div>
        </div>
      </div>

      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleConfirmDelete}
        loading={deleteLoading}
      />

      <div className="target-details-content mt-2">
        <MultiTabs tabs={tabs} baseDepth={4} />

        <div className="tab-panel-container mt-0">
          <Outlet context={{ target, loading, refetchTarget }} />
        </div>
      </div>
    </div>
  );
};

export default TargetDetails;
