import Modal from "react-bootstrap/Modal";
import Button from "../Button/Button";
import { MdLogout } from "react-icons/md";
import "./LogoutModal.scss";
import { useDispatch, useSelector } from "react-redux";
import { logoutThunk } from "@/features/auth/authThunk";
import { useNavigate } from "react-router-dom";

const LogoutModal = ({
    show,
    onClose
}) => {
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logoutThunk()).finally(() => {
            onClose();
            navigate("/login");
        });
    };

    return (
        <>
            <Modal
                show={show}
                onHide={onClose}
                centered
                contentClassName="modal-zoom"
                className="logout-modal"
            >
                <Modal.Body>
                    <div className="logout-icon"><MdLogout /></div>
                    <h5 className="title">Are you sure you want to log out?</h5>

                    <div className="logout-actions">
                        <Button variant="secondary" size="lg" onClick={onClose}>Cancel</Button>
                        <Button variant="danger" size="lg" onClick={handleLogout} disabled={loading}>
                            {loading ? "Logging out..." : "Logout"}</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default LogoutModal;
