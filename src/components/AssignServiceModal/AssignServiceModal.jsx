import { Modal, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { FaAngleDown } from "react-icons/fa";
import dayjs from "dayjs";
import Button from "@/components/Button/Button";
import "./AssignServiceModal.scss";

const dummyServices = [
  { value: "svc_1", label: "Yoga Therapy" },
  { value: "svc_2", label: "Meditation Session" },
  { value: "svc_3", label: "Stress Management" },
];

const AssignServiceModal = ({ show, onHide }) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = () => {
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      className="service-form-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Assign Service</Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>

          <div className="form-group">
            <label>Service</label>

            <div className="select-wrapper">
              <select
                className="select-input"
                {...register("serviceId", {
                  required: "Service is required",
                })}
              >
                <option value="">Select service</option>
                {dummyServices.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label}
                  </option>
                ))}
              </select>

              <FaAngleDown className="select-icon" />
            </div>

            {errors.serviceId && (
              <p className="error-message">{errors.serviceId.message}</p>
            )}
          </div>

          <Row className="gy-3">
            <Col md={6}>
              <label>Start Date</label>
              <input
                type="date"
                className="text-input"
                {...register("fromDate", { required: "Start date required" })}
                min={dayjs().format("YYYY-MM-DD")}
              />
            </Col>

            <Col md={6}>
              <label>End Date</label>
              <input
                type="date"
                className="text-input"
                {...register("toDate", { required: "End date required" })}
                min={watch("fromDate")}
              />
            </Col>

            <Col md={6}>
              <label>Start Time</label>
              <input
                type="time"
                className="text-input"
                {...register("startTime", { required: true })}
              />
            </Col>

            <Col md={6}>
              <label>End Time</label>
              <input
                type="time"
                className="text-input"
                {...register("endTime", { required: true })}
              />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" size="lg" onClick={onHide}>
            Do it Later
          </Button>
          <Button type="submit" variant="primary" size="lg">
            Assign Now
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default AssignServiceModal;
