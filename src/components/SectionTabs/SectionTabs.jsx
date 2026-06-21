import { Box, Tab, Tabs } from "@mui/material";
import "./SectionTabs.scss";

const SectionTabs = ({ tabs = [], value, onChange }) => {
    const handleChange = (_, newValue) => {
        onChange?.(newValue);
    };

    return (
        <>
            <Box className="section-tabs-container">
                <Tabs
                    value={value}
                    onChange={handleChange}
                    variant="scrollable"
                    scrollButtons={false}
                    className="tab-header"
                    TabIndicatorProps={{ style: { display: "none" } }}
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            key={tab.path || index}
                            label={tab.label}
                            value={tab.path}
                            className="multiple-tab"
                        />
                    ))}
                </Tabs>
            </Box>
        </>
    );
};

export default SectionTabs;
