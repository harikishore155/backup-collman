import "./EditIcon.scss";
import { AiOutlineEdit } from "react-icons/ai";

const EditIcon = ({ onClick }) => {
  return (
    <span className="edit-icon" onClick={onClick} role="button" tabIndex={0}>
      <AiOutlineEdit />
    </span>
  );
};

export default EditIcon;
