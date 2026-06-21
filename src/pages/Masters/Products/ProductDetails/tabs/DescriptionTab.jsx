import { useOutletContext } from "react-router-dom";

const DescriptionTab = () => {
  const { product } = useOutletContext();

  return (
    <div className="description-tab-content">
      <p>{product?.description || "No description available."}</p>
    </div>
  );
};

export default DescriptionTab;
