import { Box, Tabs, Tab } from "@mui/material";
import "./VerticalTabs.scss";

const VerticalTabs = ({ tabs, activeTab, onChangeTab }) => {
  const currentIndex = tabs.findIndex(
    (tab) => tab.path === activeTab
  );

  const validIndex = currentIndex === -1 ? 0 : currentIndex;

  const handleChange = (_, newIndex) => {
    onChangeTab(tabs[newIndex].path);
  };

  return (
    <Box className="vertical-tabs-container">
      <Tabs
        orientation="vertical"
        value={validIndex}
        onChange={handleChange}
        className="tabs-list"
        TabIndicatorProps={{ style: { display: "none" } }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.path}
            label={tab.label}
            value={index}
            className="tab-item"
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default VerticalTabs;


