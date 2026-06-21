import Modal from "react-bootstrap/Modal";
import { MdDeleteOutline } from "react-icons/md";
import "./DeleteModal.scss";
import Button from "../Button/Button";

const DeleteModal = ({
    show,
    onClose,
    onDelete,
    loading = false,
    title = "Are you sure you want to delete?",
    actionLabel = "Delete",
    loadingLabel = "Deleting...",
}) => {
    return (
        <>
            <Modal
                show={show}
                onHide={onClose}
                centered
                contentClassName="modal-zoom"
                className="delete-modal"
            >
                <Modal.Body>
                    <div className="delete-icon"><MdDeleteOutline /></div>
                    <h6>{title}</h6>

                    <div className="action-buttons">
                        <Button variant="secondary" size="xl" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button variant="danger" size="xl" onClick={onDelete} disabled={loading}>
                            {loading ? loadingLabel : actionLabel}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default DeleteModal
