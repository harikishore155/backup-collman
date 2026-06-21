import { useOutletContext } from "react-router-dom";
import "./AccessTab.scss";

const ROLE_MODULES = [
  { id: "masterModuleAccess", name: "Master Module Access" },
  { id: "campaignManagement", name: "Campaign management" },
  { id: "reportDashboard", name: "Report & dashboard" },
  { id: "approvalSpecialControl", name: "Approval & Special Control" },
];

const AccessTab = () => {
  const { role } = useOutletContext();

  const getModulePermissions = (moduleId) => {
    const moduleData = role?.permissions?.find((p) => p.module === moduleId);
    if (!moduleData || !moduleData.actions) return "No access";

    const activePermissions = Object.entries(moduleData.actions)
      .filter(([_, value]) => value === true)
      .map(([key]) => {
        // Capitalize and handle camelCase if necessary (e.g. viewReports -> View Reports)
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
      });

    return activePermissions.length > 0 ? activePermissions.join(" / ") : "No permissions";
  };

  const accessData = ROLE_MODULES.map((module) => ({
    title: `${module.name}:`,
    permissions: getModulePermissions(module.id),
  }));

  return (
    <div className="access-tab-content">
      {accessData.map((item, index) => (
        <div key={index} className="access-card card-container">
          <div className="access-info">
            <span className="access-title">{item.title}</span>
            <span className="access-permissions">{item.permissions}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccessTab;
