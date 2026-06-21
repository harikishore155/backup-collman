import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import BackButton from "@/components/BackButton/BackButton";
import MultiTabs from "@/components/MultiTabs/MultiTabs";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import PreLoader from "@/components/PreLoader/PreLoader";
import ResetPasswordModal from "@/components/ResetPasswordModal/ResetPasswordModal";
import { fetchUserByIdApi, updateUserStatusApi } from "@/features/users/userApi";
import "./UserDetails.scss";

const UserDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchUserByIdApi(id);
      if (data?.success) {
        setUser(data.data);
      } else {
        toast.error(data?.message || "Failed to load user details");
      }
    } catch (error) {
      console.error("Failed to fetch user details", error);
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      setStatusUpdating(true);
      const newStatus = user.status?.toLowerCase() === "active" ? "inactive" : "active";
      const response = await updateUserStatusApi(id, { status: newStatus });
      if (response.success) {
        toast.success(`User status updated to ${newStatus}`);
        setUser((prev) => ({ ...prev, status: newStatus }));
      } else {
        toast.error(response.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("An error occurred while updating status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const tabs = [
    { label: "Details", path: "details" },
    { label: "Role", path: "role" },
    { label: "Audit logs", path: "audit-logs" },
  ];

  if (loading) {
    return <PreLoader />;
  }

  if (!user) {
    return (
      <div className="user-details-page">
        <div className="card-container">
          <div className="user-title-row">
            <BackButton />
            <span>User not found</span>
          </div>
        </div>
      </div>
    );
  }

  const isActive = user.status?.toLowerCase() === "active";

  return (
    <div className="user-details-page">
      <div className="user-details-header card-container">
        <div className="header-top">
          <div className="user-info">
            <div className="user-title-row">
              <BackButton />
              <h5>{user.name}</h5>
            </div>
            <div className="user-meta">
              <span>UID: {user.UID || user.id || id}</span>
            </div>
          </div>

          <MoreIcon
            onEdit={() => navigate(`/masters/users/edit/${id}`)}
          />
        </div>

        <div className="header-middle">
          <div className="password-info">
            <span>Password: {user.password || "********"}</span>
            <button
              type="button"
              className="reset-password-btn"
              onClick={() => setShowResetPasswordModal(true)}
            >
              Reset Password
            </button>
          </div>
        </div>

        <div className="header-status">
          <label>Status:</label>
          <div className="status-toggle">
            <IOSSwitch
              checked={isActive}
              onChange={handleStatusChange}
              disabled={statusUpdating}
              color="success"
            />
            <span className={isActive ? "active" : "inactive"}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <ResetPasswordModal
        show={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        userId={id}
      />

      <div className="user-details-content mt-2">
        <MultiTabs tabs={tabs} baseDepth={4} />

        <div className="tab-panel-container mt-0">
          <Outlet context={{ user }} />
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
