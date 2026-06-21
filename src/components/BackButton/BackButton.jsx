import "./BackButton.scss";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <span className="back-btn" onClick={handleBack}>
            <IoMdArrowRoundBack />
        </span>
    );
};

export default BackButton;
