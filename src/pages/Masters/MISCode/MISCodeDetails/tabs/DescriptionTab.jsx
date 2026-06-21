import { useOutletContext } from "react-router-dom";

const DescriptionTab = () => {
  const { description } = useOutletContext() ?? {};

  return (
    <div className="description-tab-content">
      <p>{description || "No description available."}</p>
    </div>
  );
};

export default DescriptionTab;
