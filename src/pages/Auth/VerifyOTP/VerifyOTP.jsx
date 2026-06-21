import OTPInput from "@/pages/Auth/OTPInput/OTPInput";
import { useState, useEffect } from "react";
import AuthLayout from "@/layouts/AuthLayout/AuthLayout";
import Button from "@/components/Button/Button";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "@/components/BackButton/BackButton";
import toast from "react-hot-toast";
import "./VerifyOTP.scss";
import { useDispatch } from "react-redux";
import { verifyOtpThunk } from "@/features/auth/authThunk";

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [seconds, setSeconds] = useState(120);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [seconds]);

  const handleOtpChange = (value) => {
    setOtp(value);
    if (errors.otp && value.length === 4) {
      setErrors({});
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 4) {
      setErrors({ otp: "Please enter a valid 4-digit OTP" });
      return;
    }

    if (!email) {
      toast.error("Email not found. Please try again.");
      return;
    }

    try {
      setLoading(true);
      const resultAction = await dispatch(verifyOtpThunk({ email, otp: Number(otp) }));

      if (verifyOtpThunk.fulfilled.match(resultAction)) {
        toast.success(resultAction.payload);
        navigate("/set-password", { state: { email } });
      } else {
        setErrors({ otp: resultAction.payload });
      }
    } catch (error) {
      setErrors({ otp: "Invalid OTP. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="otp-form" onSubmit={handleVerify}>
        <BackButton />

        <h5 className="title">Verify your OTP</h5>
        <span className="subtitle">
          4-digit verification code to your registered email
        </span>
        <span className="mail-link">{email}</span>

        <div className="position-relative">
          <OTPInput length={4} value={otp} onChange={handleOtpChange} />
          {errors.otp && <span className="error-message">{errors.otp}</span>}
        </div>

        <div className="mt-4 text-center">
          <Button
            variant="primary"
            size="lg"
            type="submit"
            style={{ width: "40%" }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </div>

        <div className="auth-link">
          {seconds > 0 ? (
            <span className="auth-text">
              Resend OTP in {" "}
              <strong>
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                {String(seconds % 60).padStart(2, "0")}
              </strong>
            </span>
          ) : (
            <span
              className="auth-text resend-link"
              onClick={() => navigate(-1)}
              style={{ cursor: "pointer" }}
            >
              Resend OTP
            </span>
          )}
        </div>
      </form>
    </AuthLayout >
  );
};

export default VerifyOTP;
