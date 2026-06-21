// import { useEffect, useState } from "react";
// import { Outlet, useNavigate, useParams } from "react-router-dom";
// import toast from "react-hot-toast";
// import MultiTabs from "@/components/MultiTabs/MultiTabs";
// import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
// import MoreIcon from "@/components/MoreIcon/MoreIcon";
// import PreLoader from "@/components/PreLoader/PreLoader";
// import { fetchRoleByIdApi, updateRoleStatusApi } from "@/features/roles/roleApi";
// import { getRoleDisplayId } from "@/features/roles/roleDisplay";
// import "./RoleDetails.scss";

// const RoleDetails = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const [role, setRole] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [statusUpdating, setStatusUpdating] = useState(false);

//   useEffect(() => {
//     if (id) {
//       fetchRoleDetails();
//     }
//   }, [id]);

//   const fetchRoleDetails = async () => {
//     try {
//       setLoading(true);
//       const data = await fetchRoleByIdApi(id);
//       if (data?.success) {
//         setRole(data.data);
//       } else {
//         toast.error(data?.message || "Failed to load role details");
//       }
//     } catch (error) {
//       console.error("Failed to fetch role details", error);
//       toast.error("Failed to load role details");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStatusChange = async () => {
//     try {
//       setStatusUpdating(true);
//       const newStatus = role.status?.toLowerCase() === "active" ? "inactive" : "active";
//       const response = await updateRoleStatusApi(id, { status: newStatus });
//       if (response.success) {
//         toast.success(`Role status updated to ${newStatus}`);
//         setRole((prev) => ({ ...prev, status: newStatus }));
//       } else {
//         toast.error(response.message || "Failed to update status");
//       }
//     } catch (error) {
//       console.error("Failed to update status", error);
//       toast.error("An error occurred while updating status");
//     } finally {
//       setStatusUpdating(false);
//     }
//   };

//   const tabs = [
//     { label: "Access", path: "access" },
//     { label: "Audit logs", path: "audit-logs" },
//   ];

//   if (loading) {
//     return <PreLoader />;
//   }

//   if (!role) {
//     return (
//       <div className="role-details-page">
//         <div className="card-container">
//           <p>Role not found</p>
//         </div>
//       </div>
//     );
//   }

//   const isActive = role.status?.toLowerCase() === "active";

//   return (
//     <div className="role-details-page">
//       <div className="role-details-header card-container">
//         <div className="header-top">
//           <div className="role-info">
//             <h5>{role.name}</h5>
//             <div className="role-meta">
//               <span>Role ID: {getRoleDisplayId(role, id)}</span>
//             </div>
//           </div>

//           <MoreIcon
//             onEdit={() => navigate(`/masters/roles/edit/${id}`)}
//           />
//         </div>

//         <div className="header-status">
//           <label>Status:</label>
//           <div className="status-toggle">
//             <IOSSwitch
//               checked={isActive}
//               onChange={handleStatusChange}
//               disabled={statusUpdating}
//               color="success"
//             />
//             <span className={isActive ? "active" : "inactive"}>
//               {isActive ? "Active" : "Inactive"}
//             </span>
//           </div>
//         </div>
//       </div>

//       <div className="role-details-content mt-2">
//         <MultiTabs tabs={tabs} baseDepth={4} />

//         <div className="tab-panel-container mt-0">
//           <Outlet context={{ role }} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RoleDetails;


import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import MultiTabs from "@/components/MultiTabs/MultiTabs";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import BackButton from "@/components/BackButton/BackButton";
import PreLoader from "@/components/PreLoader/PreLoader";
import { fetchRoleByIdApi, updateRoleStatusApi } from "@/features/roles/roleApi";
import { getRoleDisplayId } from "@/features/roles/roleDisplay";
import "./RoleDetails.scss";

const RoleDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRoleDetails();
    }
  }, [id]);

  const fetchRoleDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchRoleByIdApi(id);
      if (data?.success) {
        setRole(data.data);
      } else {
        toast.error(data?.message || "Failed to load role details");
      }
    } catch (error) {
      console.error("Failed to fetch role details", error);
      toast.error("Failed to load role details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      setStatusUpdating(true);
      const newStatus = role.status?.toLowerCase() === "active" ? "inactive" : "active";
      const response = await updateRoleStatusApi(id, { status: newStatus });
      if (response.success) {
        toast.success(`Role status updated to ${newStatus}`);
        setRole((prev) => ({ ...prev, status: newStatus }));
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
    { label: "Access", path: "access" },
    { label: "Audit logs", path: "audit-logs" },
  ];

  if (loading) {
    return <PreLoader />;
  }

  if (!role) {
    return (
      <div className="role-details-page">
        <div className="card-container">
          <div className="role-title-row">
            <BackButton />
            <p>Role not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isActive = role.status?.toLowerCase() === "active";

  return (
    <div className="role-details-page">
      <div className="role-details-header card-container">
        <div className="header-top">
          <div className="role-info">
            <div className="role-title-row">
              <BackButton />
              <h5>{role.name}</h5>
            </div>
            <div className="role-meta">
              <span>Role ID: {getRoleDisplayId(role, id)}</span>
            </div>
          </div>

          <MoreIcon
            onEdit={() => navigate(`/masters/roles/edit/${id}`)}
          />
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

      <div className="role-details-content mt-2">
        <MultiTabs tabs={tabs} baseDepth={4} />

        <div className="tab-panel-container mt-0">
          <Outlet context={{ role }} />
        </div>
      </div>
    </div>
  );
};

export default RoleDetails;