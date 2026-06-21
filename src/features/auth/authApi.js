import AUTH_ENDPOINTS from "@/api/endpoints/authEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const loginUserApi = async (email, password) => {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGIN, { email, password });
    return response.data;
};

export const sendOtpApi = async (email) => {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.RESET_PASSWORD, { email }, { params: { login_type: "email" } });
    return response.data;
};

export const verifyOtpApi = async (email, otp) => {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.VERIFY_OTP, { email, otp }, { params: { login_type: "email" } });
    return response.data;
};

export const updatePasswordApi = async (payload) => {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.UPDATE_PASSWORD, {
        email: payload.email,
        new_password: payload.new_password,
        confirm_password: payload.confirm_password,
    }, { params: { login_type: "email" } });
    return response.data;
};

export const logoutApi = async () => {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGOUT);
    return response.data;
};

export const fetchAuthMeApi = async () => {
    const response = await axiosInstance.get(AUTH_ENDPOINTS.ME);
    return response.data;
};

