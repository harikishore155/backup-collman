import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Box, CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import Button from "@/components/Button/Button";
import AuthLayout from "@/layouts/AuthLayout/AuthLayout";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk } from "@/features/auth/authThunk";
import { getDefaultRouteByRole } from "@/router/roleRoutes";
import "./LoginPage.scss";
import { useForm } from "react-hook-form";
import loginLogo from "./../../../assets/images/logo/collman_logo.png";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });

  const handlePasswordToggle = () => {
    setShowPassword((prev) => !prev);
  };

  const onSubmit = async (data) => {
    const { email, password } = data;

    try {
      const resultAction = await dispatch(loginThunk({ email, password }));

      if (loginThunk.fulfilled.match(resultAction)) {
        const role = resultAction.payload.role;
        // const companyId = resultAction.payload.company_id;
        // if (companyId) {
        //   dispatch(fetchCompanyFeatures(companyId));
        // }

        toast.success("Login successful!");
        navigate(getDefaultRouteByRole(role), { replace: true });
      } else {
        setError("password", {
          type: "manual",
          message: resultAction.payload || "Invalid email or password",
        });
      }
    } catch {
      setError("password", {
        type: "manual",
        message: "Something went wrong. Please try again later.",
      });
    }
  };

  return (
    <AuthLayout showLogo={false}>
      <form onSubmit={handleSubmit(onSubmit)} className="login-form">
        <img src={loginLogo} alt="collman logo" className="login-logo" />

        <h2 className="title">Welcome Back!</h2>
        <span className="subtitle">Log In to Continue</span>

        <div className="input-container mt-4">
          <label htmlFor="email" className="form-label">
            Username
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter user name"
            className={`form-input ${errors.email ? "input-error" : ""}`}
            {...register("email", {
              required: "Please enter email address",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address",
              },
            })}
          />
          {errors.email && (
            <span className="error-message">{errors.email.message}</span>
          )}
        </div>

        <div className="input-container">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Enter your password"
              className={`form-input password-input ${errors.password ? "input-error" : ""}`}
              {...register("password", {
                required: "Please enter password",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            <span
              className="input-icon"
              onClick={handlePasswordToggle}
              role="button"
            >
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </span>
          </div>

          {errors.password && (
            <span className="error-message">{errors.password.message}</span>
          )}
        </div>

        <div className="mt-3 text-center">
          <Button
            variant="primary"
            size="lg"
            type="submit"
            style={{ width: "40%" }}
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
                Logging in...
              </Box>
            ) : (
              "Log In"
            )}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
