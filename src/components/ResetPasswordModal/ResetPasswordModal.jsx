// import { useState } from "react";
// import Modal from "react-bootstrap/Modal";
// import Visibility from "@mui/icons-material/Visibility";
// import VisibilityOff from "@mui/icons-material/VisibilityOff";
// import toast from "react-hot-toast";
// import Button from "@/components/Button/Button";
// import { resetUserPasswordApi } from "@/features/users/userApi";
// import "./ResetPasswordModal.scss";

// const ResetPasswordModal = ({ show, onClose, userId }) => {
//   const [formData, setFormData] = useState({
//     password: "",
//     confirmPassword: "",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);

//   const resetForm = () => {
//     setFormData({ password: "", confirmPassword: "" });
//     setShowPassword(false);
//     setShowConfirmPassword(false);
//     setErrors({});
//   };

//   const handleClose = () => {
//     resetForm();
//     onClose();
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   const validate = () => {
//     const { password, confirmPassword } = formData;
//     const newErrors = {};

//     if (!password.trim()) {
//       newErrors.password = "Please enter a new password";
//     } else if (password.length < 6) {
//       newErrors.password = "Password must be at least 6 characters";
//     }

//     if (!confirmPassword.trim()) {
//       newErrors.confirmPassword = "Please re-enter your password";
//     } else if (password !== confirmPassword) {
//       newErrors.confirmPassword = "Passwords do not match";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;

//     try {
//       setLoading(true);
//       const response = await resetUserPasswordApi(userId, {
//         password: formData.password,
//         // API accepts password only; confirm field is validated in UI only
//         // confirm_password: formData.confirmPassword,
//       });

//       if (response?.success) {
//         toast.success(response.message || "Password reset successfully");
//         handleClose();
//       } else {
//         toast.error(response?.message || "Failed to reset password");
//       }
//     } catch (error) {
//       console.error("Failed to reset password", error);
//       toast.error(error?.response?.data?.message || "Failed to reset password");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderPasswordField = ({
//     id,
//     name,
//     label,
//     placeholder,
//     value,
//     isVisible,
//     onToggle,
//     error,
//   }) => (
//     <div className="input-container">
//       <label htmlFor={id} className="form-label">
//         {label}
//       </label>
//       <div className="input-wrapper">
//         <input
//           type={isVisible ? "text" : "password"}
//           id={id}
//           name={name}
//           className={`form-input password-input ${error ? "input-error" : ""}`}
//           placeholder={placeholder}
//           value={value}
//           onChange={handleChange}
//           autoComplete="new-password"
//         />
//         <span
//           className="input-icon"
//           onClick={onToggle}
//           role="button"
//           aria-label={isVisible ? "Hide password" : "Show password"}
//         >
//           {isVisible ? <Visibility /> : <VisibilityOff />}
//         </span>
//       </div>
//       {error && <span className="error-message">{error}</span>}
//     </div>
//   );

//   return (
//     <Modal
//       show={show}
//       onHide={handleClose}
//       centered
//       contentClassName="modal-zoom"
//       className="reset-password-modal"
//     >
//       <Modal.Body>
//         <h5 className="title">Reset Password</h5>

//         <form onSubmit={handleSubmit}>
//           <div className="modal-top">
//             <div className="form-group">
//               {renderPasswordField({
//                 id: "password",
//                 name: "password",
//                 label: "New password",
//                 placeholder: "Enter New Password",
//                 value: formData.password,
//                 isVisible: showPassword,
//                 onToggle: () => setShowPassword((prev) => !prev),
//                 error: errors.password,
//               })}

//               {renderPasswordField({
//                 id: "confirmPassword",
//                 name: "confirmPassword",
//                 label: "Re-enter New password",
//                 placeholder: "Re-enter Password",
//                 value: formData.confirmPassword,
//                 isVisible: showConfirmPassword,
//                 onToggle: () => setShowConfirmPassword((prev) => !prev),
//                 error: errors.confirmPassword,
//               })}
//             </div>
//           </div>

//           <div className="action-buttons">
//             <Button
//               variant="tertiary"
//               size="lg"
//               type="button"
//               onClick={handleClose}
//               disabled={loading}
//             >
//               Cancel
//             </Button>
//             <Button variant="primary" size="lg" type="submit" disabled={loading}>
//               {loading ? "Changing..." : "Change"}
//             </Button>
//           </div>
//         </form>
//       </Modal.Body>
//     </Modal>
//   );
// };

// export default ResetPasswordModal;



import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import Button from "@/components/Button/Button";
import { resetUserPasswordApi } from "@/features/users/userApi";
import "./ResetPasswordModal.scss";

const PASSWORD_RULES = [
  { id: "minLength", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "uppercase", label: "At least 1 uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number",    label: "At least 1 number",          test: (v) => /[0-9]/.test(v) },
  { id: "symbol",    label: "At least 1 special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const validatePassword = (password) => {
  if (!password.trim()) return "Please enter a new password";
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return rule.label;
  }
  return null;
};

const ResetPasswordModal = ({ show, onClose, userId }) => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({ password: "", confirmPassword: "" });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const { password, confirmPassword } = formData;
    const newErrors = {};

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please re-enter your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const response = await resetUserPasswordApi(userId, {
        password: formData.password,
      });

      if (response?.success) {
        toast.success(response.message || "Password reset successfully");
        handleClose();
      } else {
        toast.error(response?.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Failed to reset password", error);
      toast.error(error?.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = ({
    id,
    name,
    label,
    placeholder,
    value,
    isVisible,
    onToggle,
    error,
  }) => (
    <div className="input-container">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="input-wrapper">
        <input
          type={isVisible ? "text" : "password"}
          id={id}
          name={name}
          className={`form-input password-input ${error ? "input-error" : ""}`}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          autoComplete="new-password"
        />
        <span
          className="input-icon"
          onClick={onToggle}
          role="button"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <FiEye /> : <FiEyeOff />}
        </span>
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      contentClassName="modal-zoom"
      className="reset-password-modal"
    >
      <Modal.Body>
        <h5 className="title">Reset Password</h5>

        <form onSubmit={handleSubmit}>
          <div className="modal-top">
            <div className="form-group">
              {renderPasswordField({
                id: "password",
                name: "password",
                label: "New password",
                placeholder: "Enter New Password",
                value: formData.password,
                isVisible: showPassword,
                onToggle: () => setShowPassword((prev) => !prev),
                error: errors.password,
              })}

              {renderPasswordField({
                id: "confirmPassword",
                name: "confirmPassword",
                label: "Re-enter New password",
                placeholder: "Re-enter Password",
                value: formData.confirmPassword,
                isVisible: showConfirmPassword,
                onToggle: () => setShowConfirmPassword((prev) => !prev),
                error: errors.confirmPassword,
              })}
            </div>
          </div>

          <div className="action-buttons">
            <Button
              variant="tertiary"
              size="lg"
              type="button"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant="primary" size="lg" type="submit" disabled={loading}>
              {loading ? "Changing..." : "Change"}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default ResetPasswordModal;