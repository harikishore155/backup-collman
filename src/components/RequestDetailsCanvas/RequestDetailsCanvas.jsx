import { Offcanvas } from "react-bootstrap";
import Button from "@/components/Button/Button";
import "./RequestDetailsCanvas.scss";

const RequestDetailsCanvas = ({ show, handleClose, data }) => {
  if (!data) return null;

  const {
    headerTitle,
    employeeName,
    status,
    sections = [],
    approverRemarks = [],
    footerButton,
  } = data;

  return (
    <Offcanvas
      show={show}
      onHide={handleClose}
      placement="end"
      className="request-details-offcanvas"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>{headerTitle}</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>

        <div className="top-section">
          <h6>{employeeName}</h6>
          {status && (
            <span className={`status ${status.toLowerCase()}`}>
              {status}
            </span>
          )}
        </div>

        {sections.map((section, sIndex) => (
          <div key={sIndex} className="section-wrapper">
            {section.title && <h6>{section.title}</h6>}

            {section.fields?.map((field, fIndex) => (
              <div key={fIndex} className="field-row">
                <span className="label">{field.label}</span>

                {field.type === "input" ? (
                  <input
                    type="text"
                    className="custom-input"
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange && field.onChange(e.target.value)
                    }
                    disabled={field.disabled}
                  />
                ) : field.type === "link" ? (
                  <a
                    href={field.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {field.value}
                  </a>
                ) : (
                  <span className="value">
                    {field.value ?? "-"}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}

        {approverRemarks.length > 0 && (
          <>
            <h6 className="mt-4">Approver Remarks</h6>

            {approverRemarks.map((remark, index) => (
              <div key={index} className="remark-card">
                <div className="remark-header">
                  <span>Status : {remark.status}</span>
                  <span>{remark.date}</span>
                </div>

                <p>Approved by: {remark.approvedBy}</p>
                <p>Approver Comments : {remark.comments}</p>

                {remark.approvedAmount && (
                  <p>Approved Amount : {remark.approvedAmount}</p>
                )}
              </div>
            ))}
          </>
        )}


        {footerButton && (
          <div className="footer-btn">
            <Button
              variant="primary"
              size="lg"
              className="w-100"
              onClick={footerButton.onClick}
            >
              {footerButton.label}
            </Button>
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default RequestDetailsCanvas;
