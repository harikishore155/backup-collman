import { Modal } from 'react-bootstrap';
import "./GrandAccessModal.scss";
import IOSSwitch from '../IOSSwitch/IOSSwitch';

const GrandAccessModal = (
    { show,
        onClose,
        label = "Lead Access",
        leadData = [], }
) => {
    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            contentClassName="modal-zoom"
            className="grand-access-container"
        >
            <Modal.Header closeButton>
                <Modal.Title>{label}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="card-wrapper">
                    {leadData.map((item, index) => (
                        <div className="card-container" key={index}>
                            <div className="card-label">
                                <h6>{item.duration}</h6>
                                <span>{item.name}</span>
                            </div>

                            <div className="card-meta"><IOSSwitch /></div>
                        </div>
                    ))}
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default GrandAccessModal