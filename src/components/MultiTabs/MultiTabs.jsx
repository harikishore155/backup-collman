import { Box, Tab, Tabs } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import "./MultiTabs.scss";

const MultiTabs = ({ tabs = [], baseDepth = 3, onChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  const basePath = `/${pathParts.slice(0, baseDepth).join("/")}`;
  const currentTab = pathParts[baseDepth] || "all";

  const currentIndex = tabs.findIndex((tab) => tab.path === currentTab);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  const handleChange = (_, newIndex) => {
    const selected = tabs[newIndex];
    onChange?.(selected.path);

    const newPath = selected.path ? `${basePath}/${selected.path}` : basePath;
    navigate(newPath);
  };

  return (
    <>
      <Box className="multi-tabs-container">
        <Tabs
          value={activeIndex}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons={false}
          className="tab-header"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.path || index}
              label={
                <div className="tab-content">
                  <span className="tab-label">{tab.label}</span>
                </div>
              }
              value={index}
              className="multiple-tab"
            />
          ))}
        </Tabs>
      </Box>
    </>
  );
};

export default MultiTabs;
