import { useOutletContext } from "react-router-dom";
import "./RoleTab.scss";

const formatUserRef = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(
      ref.name ??
        ref.fullName ??
        ref.full_name ??
        ref.email ??
        ref.UID ??
        ref._id ??
        "",
    );
  }
  return String(ref);
};

const RoleTab = () => {
  const { user } = useOutletContext();

  const roleDetails = [
    { label: "Role:", value: user?.roleName || user?.roleId?.name || "N/A" },
    { label: "Manager:", value: formatUserRef(user?.managerId ?? user?.manager) || "N/A" },
    { label: "Assistant manager:", value: formatUserRef(user?.assistantManagerId ?? user?.assistantManager) || "N/A" },
    { label: "Team Leader:", value: formatUserRef(user?.teamLeaderId ?? user?.teamLeader) || "N/A" },
    { label: "Bank ID Card:", value: user?.bankIdCardNumber || "N/A" },
  ];

  return (
    <div className="role-tab-content card-container">
      <div className="role-grid">
        {roleDetails.map((item, index) => (
          <div key={index} className="role-item">
            <span className="label">{item.label}</span>
            <span className="value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleTab;
