import "./UploadCertificateModal.scss";
import Button from '../Button/Button';
import { Modal } from 'react-bootstrap';
import { BsImageAlt } from 'react-icons/bs';

const UploadCertificateModal = ({ show,
    file,
    certName,
    setCertName,
    onClose,
    onConfirm, }) => {
    if (!file) return null;

    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            backdrop="static"
            contentClassName="modal-zoom"
            className="categories-modal"
        >

            <Modal.Header closeButton>
                <Modal.Title>Upload File</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="certificate-modal-top">
                    <div className="certificate-upload-placeholder">
                        {isImage ? (
                            <img src={previewUrl} alt="preview" className="certificate-preview" />
                        ) : (
                            <BsImageAlt size={48} />
                        )}
                    </div>

                    <div className="form-group mt-3">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter Certificate Name"
                            value={certName}
                            onChange={(e) => setCertName(e.target.value)}
                        />
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="tertiary" size="lg" onClick={onClose}>Cancel</Button>
                <Button
                    variant="primary"
                    disabled={!certName}
                    onClick={onConfirm}
                >
                    Upload
                </Button>
            </Modal.Footer>


        </Modal>
    )
}

export default UploadCertificateModal;