import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Box, CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import Button from "@/components/Button/Button";
import AuthLayout from "@/layouts/AuthLayout/AuthLayout";
import { useDispatch, useSelector } from "react-redux";
import BackButton from "@/components/BackButton/BackButton";
import { updatePasswordThunk } from "@/features/auth/authThunk";
import "./NewPassword.scss";

const NewPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState({});

  const handleTogglePassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email not found. Please try again.");
      navigate("/reset-password");
      return;
    }

    const { newPassword, confirmPassword } = formData;
    const newErrors = {};

    if (!newPassword.trim())
      newErrors.newPassword = "Please enter a new password";
    else if (newPassword.length < 6)
      newErrors.newPassword = "Password must be at least 6 characters";

    if (!confirmPassword.trim())
      newErrors.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await dispatch(
        updatePasswordThunk({
          email,
          new_password: newPassword,
          confirm_password: confirmPassword,
        })
      );

      if (updatePasswordThunk.fulfilled.match(result)) {
        toast.success(result.payload || "Password updated successfully!");
        navigate("/login");
      } else {
        toast.error(result.payload || "Login failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again later.");
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleLogin} className="new-password-form">
        <BackButton />

        <h2 className="title">Choose a New Password</h2>

        <div className="input-container mt-3">
          <label htmlFor="newPassword" className="form-label">
            New password
          </label>
          <div className="input-wrapper">
            <input
              type={showPassword.newPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              placeholder="Enter new password"
              className={`form-input password-input ${errors.newPassword ? "input-error" : ""}`}
              value={formData.newPassword}
              onChange={handleChange}
            />
            <span
              className="input-icon"
              onClick={() => handleTogglePassword("newPassword")}
              role="button"
            >
              {showPassword.newPassword ? <Visibility /> : <VisibilityOff />}
            </span>
          </div>
          {errors.newPassword && (
            <span className="error-message">{errors.newPassword}</span>
          )}
        </div>

        <div className="input-container">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <div className="input-wrapper">
            <input
              type={showPassword.confirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Enter confirm password"
              className={`form-input password-input ${errors.confirmPassword ? "input-error" : ""}`}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <span
              className="input-icon"
              onClick={() => handleTogglePassword("confirmPassword")}
              role="button"
            >
              {showPassword.confirmPassword ? (
                <Visibility />
              ) : (
                <VisibilityOff />
              )}
            </span>
          </div>
          {errors.confirmPassword && (
            <span className="error-message">{errors.confirmPassword}</span>
          )}
        </div>

        <div className="mt-5 text-center">
          <Button
            variant="primary"
            size="lg"
            type="submit"
            style={{ width: "35%" }}
            disabled={loading}
          >
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress
                  size={20}
                  sx={{ marginRight: 1, color: "white" }}
                />
                Updating...
              </Box>
            ) : (
              "Confirm"
            )}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default NewPassword;
