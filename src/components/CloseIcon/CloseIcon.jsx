import "./CloseIcon.scss";
import { IoClose } from "react-icons/io5";

const CloseIcon = ({ onClick }) => {
    return (
        <span className="close-icon" onClick={onClick} role="button" tabInFx={0}>
            <IoClose />
        </span>
    );
};

export default CloseIcon;
