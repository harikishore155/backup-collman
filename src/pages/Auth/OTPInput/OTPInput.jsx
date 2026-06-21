import { useRef } from "react";
import "./OTPInput.scss";

const OTPInput = ({ length = 4, value, onChange }) => {
  const inputs = Array.from({ length });
  const refs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    let otpArray = value.split("");

    otpArray[index] = val;
    onChange(otpArray.join(""));

    if (val && index < length - 1) {
      refs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1].focus();
    }
  };

  return (
    <div className="otp-container">
      {inputs.map((_, index) => (
        <input
          key={index}
          ref={(el) => (refs.current[index] = el)}
          type="text"
          maxLength="1"
          className="otp-input"
          value={value[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        />
      ))}
    </div>
  );
};

export default OTPInput;
