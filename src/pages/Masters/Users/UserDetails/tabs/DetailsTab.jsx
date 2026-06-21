import { useOutletContext } from "react-router-dom";
import "./DetailsTab.scss";

const DetailsTab = () => {
  const { user } = useOutletContext();

  const details = [
    { label: "Branch:", value: user?.branch || "N/A" },
    { label: "Designation:", value: user?.designation || "N/A" },
    { label: "Gender:", value: user?.gender || "N/A" },
    { label: "Contact Number:", value: user?.contactNumber || "N/A" },
    { label: "Mail ID:", value: user?.email || user?.mailId || "N/A" },
    { label: "Current Address:", value: user?.currentAddress || "N/A" },
  ];

  return (
    <div className="details-tab-content card-container">
      <div className="details-grid">
        {details.map((item, index) => (
          <div key={index} className="detail-item">
            <span className="label">{item.label}</span>
            <span className="value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailsTab;
