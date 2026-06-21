import "./ViewIcon.scss";
import { AiOutlineEye } from "react-icons/ai";

const ViewIcon = ({ onClick }) => {
  return (
    <span className="view-icon" onClick={onClick} role="button" tabIndex={0}>
      <AiOutlineEye />
    </span>
  );
};

export default ViewIcon;
