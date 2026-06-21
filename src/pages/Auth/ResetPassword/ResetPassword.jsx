import { Box, CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import Button from "@/components/Button/Button";
import AuthLayout from "@/layouts/AuthLayout/AuthLayout";
import { useDispatch, useSelector } from "react-redux";
import BackButton from "@/components/BackButton/BackButton";
import { sendOtpThunk } from "@/features/auth/authThunk";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import "./ResetPassword.scss";

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      const message = await dispatch(sendOtpThunk(data.email)).unwrap();
      toast.success(message);
      navigate("/verify-otp", { state: { email: data.email } });
      reset();
    } catch (err) {
      setError("email", {
        type: "manual",
        message: err || "Failed to send OTP",
      });
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="reset-form">
        <BackButton />

        <h2 className="title">Reset Password</h2>

        <div className="input-container mt-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter email address"
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

        <div className="mt-4 text-center">
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
                Sending...
              </Box>
            ) : (
              "Send OTP"
            )}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
