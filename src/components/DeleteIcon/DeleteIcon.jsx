import "./DeleteIcon.scss";
import { TbTrash } from "react-icons/tb";

const DeleteIcon = ({ onClick }) => {
  return (
    <span className="delete-icon" onClick={onClick} role="button" tabIndex={0}>
      <TbTrash />
    </span>
  );
};

export default DeleteIcon;
