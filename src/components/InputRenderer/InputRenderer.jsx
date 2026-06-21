import { Col, Row } from "react-bootstrap";
import SelectInput from "../SelectInput/SelectInput";
import ImageUpload from "../ImageUpload/ImageUpload";
import FilterDatePicker from "../DatePicker/FilterDatePicker";
import "./InputRenderer.scss";

const InputRenderer = ({ field, value, onChange, error }) => {
  const { id, input_type, question_text, internal_options } = field;

  const renderInput = () => {
    switch (input_type) {
      case "text":
        return (
          <input
            type="text"
            className="form-input"
            placeholder={question_text}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "date":
        return <FilterDatePicker value={value} onChange={onChange} />;

      case "select":
        return (
          <SelectInput
            value={value || ""}
            placeholder={question_text}
            options={internal_options.map((opt) => ({
              label: opt.name,
              value: opt.name,
            }))}
            onChange={(val) => onChange(val)}
          />
        );

      case "checkbox":
        return (
          <Row className="mb-4">
            {internal_options.map((opt) => {
              const selectedValues = Array.isArray(value) ? value : [];
              const isActive = selectedValues.includes(opt.name);

              const handleClick = () => {
                const updated = isActive
                  ? selectedValues.filter((v) => v !== opt.name)
                  : [...selectedValues, opt.name];

                onChange(updated);
              };

              return (
                <Col key={opt.id}>
                  <div
                    className={`checkbox-container ${isActive ? "is-active" : ""}`}
                    onClick={handleClick}
                    role="button"
                    tabIndex={0}
                  >
                    {opt.icon && (
                      <div className="label-icon">
                        <img src={opt.icon} alt={opt.name} />
                      </div>
                    )}
                    <p className="label-name">{opt.name}</p>
                  </div>
                </Col>
              );
            })}
          </Row>
        );

      case "file":
        return (
          <ImageUpload
            value={value}
            accept="image/*"
            maxFileSizeMB={5}
            buttonLabel="Upload your profile"
            className="mb-4"
            onChange={(file) => onChange(file)}
          />
        );

      case "radio":
        return (
          <div className="radio-container mb-3">
            {internal_options.map((opt) => {
              const radioId = `${id}-${opt.id}`;

              return (
                <label className="radio-item" htmlFor={radioId} key={opt.id}>
                  <input
                    id={radioId}
                    type="radio"
                    name={id}
                    value={opt.id}
                    checked={value === opt.id}
                    onChange={() => onChange(opt.id)}
                  />
                  <span>{opt.name}</span>
                </label>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="input-render-container">
    {renderInput()}

    {error && <p className="error-message">{error}</p>}
  </div>;
};

export default InputRenderer;
