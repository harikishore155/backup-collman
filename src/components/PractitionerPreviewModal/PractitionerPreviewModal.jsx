import { Col, Modal, Row } from "react-bootstrap"
import "./PractitionerPreviewModal.scss"
// import docImg from "@/assets/images/logo/docLogo.svg"


const PractitionerPreviewModal = ({ show, onClose, data }) => {

    const removeExtension = (fileName = "") =>
        fileName.replace(/\.[^/.]+$/, "");

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            backdrop="static"
            contentClassName="modal-zoom"
            className="practitioner-preview-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>Preview</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="practitioner-preview-content">
                    <div className="practitioner-preview-card">
                        <h6 className="practitioner-label">Personal Details</h6>

                        <div className="practitioner-profile-preview">
                            {data?.profileImage && (
                                <img src={data.profileImage} alt="Profile" />
                            )}
                        </div>
                        <p className="preview-label">Name</p>
                        <span className="preview-value">{data?.firstName} {data?.lastName}</span>
                        <p className="preview-label">Email Id</p>
                        <span className="preview-value">{data.email}</span>
                        <p className="preview-label">Gender</p>
                        <span className="preview-value">{data?.gender}</span>
                        <p className="preview-label">Language</p>
                        <span className="preview-value">{data?.language}</span>
                        <p className="preview-label">DOB</p>
                        <span className="preview-value">{data?.dob}</span>
                        <p className="preview-label">Website URL</p>
                        <span className="preview-value">{data?.websiteurl}</span>

                    </div>
                    <div className="practitioner-preview-card">
                        <h6 className="practitioner-label">Bio</h6>
                        <p className="preview-label">Description</p>
                        <span className="preview-value">{data?.bio}</span>
                    </div>


                    <div className="practitioner-preview-card">
                        <h6 className="practitioner-label">Address Info</h6>
                        <p className="preview-label">Commercial Address</p>
                        <span className="preview-value">{data?.communication}</span>
                        <p className="preview-label">Residential Address</p>
                        <span className="preview-value">{data?.residential}</span>
                    </div>

                    <div className="practitioner-preview-card">
                        <h6 className="practitioner-label">Verification ID's</h6>
                        <p className="preview-label">Tax No</p>
                        <span className="preview-value">{data?.taxNumber}</span>
                        <p className="preview-label">SSN No</p>
                        <span className="preview-value">{data?.ssnNumber}</span>
                        <p className="preview-label">Taxonomic ID</p>
                        <span className="preview-value">{data?.taxonomicNo}</span>
                        <p className="preview-label">National ID</p>
                        <span className="preview-value">{data?.nationalNo}</span>
                    </div>

                    <div className="practitioner-preview-card">
                        <h6 className="practitioner-label">Service</h6>

                        <div className="service-grid">
                            {data?.service?.length ? (
                                data.service.map((s, i) => (
                                    <div className="service-item" key={i}>
                                        <span className="service-icon">{s.icon}</span>
                                        <span className="service-text">{s.label}</span>
                                    </div>
                                ))
                            ) : (
                                <span className="preview-value">-</span>
                            )}
                        </div>
                    </div>

                    <div className="practitioner-preview-card">
                        <h6 className="practitioner-label">Certifications</h6>

                        {data?.certificates?.length ? (
                            <div className="certificate-list">
                                {data.certificates.map((c, i) => (
                                    <div className="certificate-row" key={i}>
                                        <div className="certificate-item">
                                            {/* <img src={docImg} alt="doc" /> */}
                                            <span>{removeExtension(c)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="preview-value">-</span>
                        )}
                    </div>


                    <div className="practitioner-preview-card">
                        <h6 className="practitioner-label">Available</h6>
                        {data?.availabletype ? (
                            <div className="available-preview">
                                <span className="available-icon">
                                    {data.availabletype.icon}
                                </span>
                                <span className="available-text">
                                    {data.availabletype.label}
                                </span>
                            </div>
                        ) : (
                            <span className="preview-value">-</span>
                        )}
                    </div>
                </div>

            </Modal.Body>
        </Modal>

    )
}

export default PractitionerPreviewModal