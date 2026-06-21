import { Col, Modal, ModalFooter, Row } from "react-bootstrap";
import { useEffect } from "react";
import Button from "../Button/Button";
import { useForm, Controller } from "react-hook-form";
import "./AddressModal.scss";

const AddressModal = ({
  show,
  onClose,
  value = {},
  onSave,
  label = "Enter Address",
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      address: "",
      city: "",
      state: "",
      postalcode: "",
      country: "",
    },
  });

  useEffect(() => {
    if (show) {
      reset({
        address: value?.address || "",
        city: value?.city || "",
        state: value?.state || "",
        postalcode: value?.postalcode || "",
        country: value?.country || "",
      });
    }
  }, [show, value, reset]);

  const onSubmit = (data) => {
    onSave(data);
    onClose();
  };

  const handlePostalCodeChange = (e, onChange) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    onChange(val);
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      contentClassName="modal-zoom"
      className="address-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>{label}</Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <div className="input-container">
            <label className="form-label">Address</label>
            <Controller
              name="address"
              control={control}
              rules={{ required: "Address is required" }}
              render={({ field }) => (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Address"
                  {...field}
                />
              )}
            />
            {errors.address && (
              <span className="error-message">{errors.address.message}</span>
            )}
          </div>

          <Row>
            <Col>
              <div className="input-container">
                <label className="form-label">City</label>
                <Controller
                  name="city"
                  control={control}
                  rules={{
                    required: "City is required",
                    pattern: {
                      value: /^[A-Za-z\s]+$/,
                      message: "Contain Only letters",
                    },
                  }}
                  render={({ field }) => (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter City"
                      {...field}
                    />
                  )}
                />
                {errors.city && (
                  <span className="error-message">{errors.city.message}</span>
                )}
              </div>
            </Col>

            <Col>
              <div className="input-container">
                <label className="form-label">Postal Code</label>
                <Controller
                  name="postalcode"
                  control={control}
                  rules={{
                    required: "Postal code is required",
                    minLength: { value: 6, message: "Minimum 6 digits" },
                  }}
                  render={({ field }) => (
                    <input
                      type="text"
                      maxLength={10}
                      className="form-input"
                      placeholder="Enter Postal Code"
                      value={field.value}
                      onChange={(e) =>
                        handlePostalCodeChange(e, field.onChange)
                      }
                    />
                  )}
                />
                {errors.postalcode && (
                  <span className="error-message">
                    {errors.postalcode.message}
                  </span>
                )}
              </div>
            </Col>
          </Row>

          <Row>
            <Col>
              <div className="input-container">
                <label className="form-label">State</label>
                <Controller
                  name="state"
                  control={control}
                  rules={{
                    required: "State is required",
                    pattern: {
                      value: /^[A-Za-z\s]+$/,
                      message: "Contain Only letters",
                    },
                  }}
                  render={({ field }) => (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter State"
                      {...field}
                    />
                  )}
                />
                {errors.state && (
                  <span className="error-message">{errors.state.message}</span>
                )}
              </div>
            </Col>

            <Col>
              <div className="input-container">
                <label className="form-label">Country</label>
                <Controller
                  name="country"
                  control={control}
                  rules={{
                    required: "Country is required",
                    pattern: {
                      value: /^[A-Za-z\s]+$/,
                      message: "Country must contain only letters",
                    },
                  }}
                  render={({ field }) => (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter Country"
                      {...field}
                    />
                  )}
                />
                {errors.country && (
                  <span className="error-message">
                    {errors.country.message}
                  </span>
                )}
              </div>
            </Col>
          </Row>
        </Modal.Body>

        <ModalFooter>
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" type="submit">
            Add
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default AddressModal;
