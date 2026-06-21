import { Skeleton } from "@mui/material";
import "./RoleTabs.scss";

const RoleTabs = ({
    tabs = [],
    loading = false,
    activeTab,
    onChange
}) => {
    return (
        <div className="role-tabs">
            {loading ? (
                [...Array(3)].map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="rounded"
                        width={80}
                        height={35}
                        className="tab-skeleton"
                    />
                ))
            ) : (
                tabs.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        className={`tab-item ${activeTab === tab.value ? "active" : ""}`}
                        onClick={() => onChange(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))
            )}
        </div>
    );
};

export default RoleTabs;
