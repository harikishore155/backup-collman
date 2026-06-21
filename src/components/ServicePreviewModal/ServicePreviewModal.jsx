import { Col, Modal, Row } from "react-bootstrap";
import Button from "@/components/Button/Button";
import "./ServicePreviewModal.scss";
import dayjs from "dayjs";

const ServicePreviewModal = ({ show, onClose, data, extraSections }) => {
    if (!data) return null;

    const startDate = data.fromDate ? dayjs(data.fromDate).format("ddd, MM/DD/YY") + " PST" : "-";
    const endDate = data.toDate ? dayjs(data.toDate).format("ddd, MM/DD/YY") + " PST" : "-";

    const startTime = data.startTime ? dayjs(data.startTime).format("hh:mm A") : "-";
    const endTime = data.endTime ? dayjs(data.endTime).format("hh:mm A") : "-";

    const getStaticImageUrl = (path) => {
        if (!path) return null;

        if (Array.isArray(path)) {
            path = path[0];
        }
        if (typeof path === "object") {
            path = path.image || path.url || "";
        }
        if (typeof path !== "string") return null;

        const BASE_URL = import.meta.env.VITE_BASE_URL;
        const STATIC_HOST = BASE_URL.split("/api/v1")[0].replace(/\/$/, "");

        const cleanPath = path
            .replace(/^\/+/, "")
            .replace(/^api\/v1\//i, "");

        return `${STATIC_HOST}/${cleanPath}`;
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(value)) return "$ 0.00";

        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(Number(value));
    };



    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            backdrop="static"
            contentClassName="modal-zoom"
            className="service-preview-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>Preview</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="service-preview-content">
                    <div className="service-preview-timing">
                        <h6 className="section-label">Timing</h6>
                        <Row>
                            <Col>
                                <h6 className="label-title">Start</h6>
                                <p>{startDate}</p>
                                <p>{startTime}</p>
                            </Col>
                            <Col>
                                <h6 className="label-title">End</h6>
                                <p>{endDate}</p>
                                <p>{endTime}</p>
                            </Col>
                        </Row>
                    </div>

                    <div className="preview-service-container">
                        <h6 className="section-label">Service Details</h6>
                        {data.thumbnail ? (
                            <div className="service-image-preview">
                                <img src={data.thumbnail} alt="Service Thumbnail" />
                            </div>
                        ) : (
                            <p>No Image</p>
                        )}
                        <Row className="mt-3">
                            <Col>
                                <p>Service</p>
                                <p>{data.serviceName || "-"}</p>
                            </Col>
                            <Col>
                                <p>No of Guest</p>
                                <p>{data.guestCount || "-"}</p>
                            </Col>
                        </Row>
                        <Row>
                            <p>Description</p>
                            <p>{data.description || "-"}</p>
                        </Row>
                    </div>

                    <div className="preview-charge-container">
                        <h6 className="section-label">Service Charge</h6>
                        <p className="label-price"> $ {data.price}</p>
                        <p> Payment Method - {data.payment}</p>
                    </div>

                    {extraSections && Object.keys(extraSections).length > 0 &&
                        Object.entries(extraSections)
                            .filter(([_, value]) => value && value.trim() !== "•")
                            .map(([title, value], idx) => (
                                <div className="preview-extra-container" key={idx}>
                                    <h6 className="section-label">{title}</h6>
                                    <p>{value.split("\n").map((line, i) => (
                                        <span key={i}>
                                            {line}
                                            <br />
                                        </span>
                                    ))}</p>
                                </div>
                            ))
                    }
                    {data.stay ? (
                        <div className="preview-stay-container">
                            <h6 className="section-label">Stay</h6>

                            <Row>
                                <Col md={4}>
                                    {getStaticImageUrl(data?.stay?.images)?.length ? (
                                        <div className="service-stay-preview">
                                            <img
                                                src={getStaticImageUrl(data.stay.images)}
                                                alt="Stay"
                                            />
                                        </div>

                                    ) : (
                                        <p>No Stay Image</p>
                                    )}
                                </Col>

                                <Col md={8}>
                                    <h6 className="label-title">
                                        {formatCurrency(data.stay.price)}
                                    </h6>
                                    <p> {data.stay.name}</p>
                                </Col>
                            </Row>
                        </div>
                    ) : (
                        <div className="preview-stay-container">
                            <h6 className="section-label">Stay</h6>
                            <p>No stay selected</p>
                        </div>
                    )}

                    <div className="preview-venue-container">
                        <h6 className="section-label">Venue & Amenities</h6>

                        {Array.isArray(data.amenities) && data.amenities.length > 0 ? (
                            <div className="amenities-list">
                                {data.amenities.map((item, index) => (
                                    <div className="amenity-item" key={index}>
                                        {item?.icon && (
                                            <img
                                                src={item.icon}
                                                alt={item.label || "Amenity"}
                                                className="amenity-icon"
                                            />
                                        )}
                                        <span className="amenity-value">{item?.label || "-"}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>-</p>
                        )}
                    </div>



                    <div className="preview-practitioner-container">
                        <h6 className="section-label">Practitioners</h6>

                        {data.practitioners && data.practitioners.length > 0 ? (
                            <div className="practitioner-list">
                                {data.practitioners.map((item, index) => (
                                    <div className="practitioner-item" key={index}>
                                        {item.logo && (
                                            <img
                                                src={item.logo}
                                                alt={item.label}
                                                className="practitioner-icon"
                                            />
                                        )}
                                        <span className="practitioner-value">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>-</p>
                        )}
                    </div>


                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="primary" size="lg" onClick={onClose}>
                    Back
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ServicePreviewModal;
