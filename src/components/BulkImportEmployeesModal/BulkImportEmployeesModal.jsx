import { Modal } from "react-bootstrap";
import { IoCloudUploadOutline } from "react-icons/io5";
import { BsDownload } from "react-icons/bs";
import { FiX } from "react-icons/fi";
import { useState } from "react";
import Button from "@/components/Button/Button";
import "./BulkImportEmployeesModal.scss";

const BulkImportEmployeesModal = ({ show, handleClose }) => {
  const [file, setFile] = useState(null);

  const onClose = () => {
    setFile(null);
    handleClose();
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="md"
      className="bulk-import-modal"
    >
      <Modal.Header className="modal-header-custom">
        <Modal.Title>
          <IoCloudUploadOutline className="header-icon" />
          Bulk Import Employees
        </Modal.Title>

        <FiX className="close-icon" onClick={onClose} />
      </Modal.Header>

      <Modal.Body>
        {/* Step 1 */}
        <div className="step-one-box">
          <div className="icon-box">
            <BsDownload />
          </div>

          <div>
            <h6>Step 1: Prepare your data</h6>
            <p>
              Download the official template to ensure your data is formatted
              correctly.
            </p>

            <a href="#" className="download-link">
              <BsDownload /> Download Employee Template.xlsx
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <h6 className="mt-4">Step 2: Upload file</h6>

        <div className="upload-box">
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            hidden
            id="fileUpload"
          />

          <label htmlFor="fileUpload" className="upload-label">
            <IoCloudUploadOutline className="upload-icon" />
            <p>{file ? file.name : "Click to upload"}</p>
            <small>XLSX or CSV (max. 10MB)</small>
          </label>
        </div>

        <p className="note-text">
          Duplicate email addresses will be skipped.
        </p>
      </Modal.Body>

      <Modal.Footer className="modal-footer-custom">
        <Button variant="secondary" size="md" onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="primary"
          size="md"
          disabled={!file}
        >
          Start Import
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BulkImportEmployeesModal;