import { NavLink, useLocation } from "react-router-dom";
import { SIDEBAR_CONFIG } from "@/config/sidebarConfig";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
// import { Tooltip } from "react-tooltip";
import { useSelector } from "react-redux";
import "./Sidebar.scss";

const Sidebar = () => {
  const { pathname } = useLocation();
  const [isClosed, setIsClosed] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const features = useSelector((state) => state.feature?.features || []);

  const role = user?.role;

  const isSettingsRoute = pathname.split("/").includes("settings");
  const activeSection = isSettingsRoute
    ? "settings"
    : role === "master"
      ? "master"
      : role === "manager"
        ? "manager"
        : "admin";

  const sidebarItems = SIDEBAR_CONFIG.find((s) => s.section === activeSection)?.items || [];

  // API enabled features
  const enabledFeatures = features
    ?.filter((feature) => feature.sub_features?.some((sub) => sub.is_web))
    ?.map((feature) => feature.feature_name.toLowerCase().replace(/\s+/g, "-"));


  const filteredItems = sidebarItems.filter((item) => {
    const roleCheck = item.roles.includes(role);
    if (role === "master") return roleCheck;
    const featureCheck = !item.featureKey || enabledFeatures.includes(item.featureKey);
    return roleCheck && featureCheck;
  });

  return (
    <div className={`sidebar-container${isClosed ? " sidebar-closed" : ""}`}>
      <aside className="sidebar-section">
        <span className="collapse-icon" onClick={() => setIsClosed(!isClosed)}>
          {!isClosed ? (
            <FiChevronLeft className="sidebar-toggle-icon" />
          ) : (
            <FiChevronRight className="sidebar-toggle-icon" />
          )}  
        </span>

        <ul className="sidebar-link pt-3">
          {filteredItems.map(({ title, icon: Icon, path }, index) => (
            <li key={index}>
              <NavLink
                to={path}
                className={({ isActive }) => (isActive ? "active-link" : "")}
                aria-label={title}
                data-tooltip-id={isClosed ? "sidebar-tooltip" : undefined}
                data-tooltip-content={isClosed ? title : undefined}>
                <span className="sidebar-icon"> <Icon /></span>
                <span className="sidebar-content">{title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      {/* <Tooltip id="sidebar-tooltip" place="right" className="sidebar-tooltip" /> */}
    </div>
  );
};

export default Sidebar;
