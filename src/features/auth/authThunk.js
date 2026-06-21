import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ROLE } from "@/config/roles";
import { normalizeRoleNameValue } from "@/constants/roles";
import { saveAuthSession } from "@/utils/authCookies";
import { fetchAuthMeApi, loginUserApi, updatePasswordApi, logoutApi, sendOtpApi } from "./authApi";
import { verifyOtpApi } from "./authApi";


const readAccessToken = (response) => response?.accessToken ;

const readRefreshToken = (response) =>
    response?.refreshToken ??
    response?.refresh_token ??
    response?.data?.refreshToken ??
    response?.data?.refresh_token ??
    "";

const readTokenType = (response) =>
    response?.tokenType ??
    response?.token_type ??
    response?.data?.tokenType ??
    response?.data?.token_type ??
    "Bearer";

const readUserObject = (response) => {
    const directUser =
        response?.user ??
        response?.data?.user ??
        response?.data?.data ??
        response?.data;
    if (directUser && typeof directUser === "object" && !Array.isArray(directUser)) {
        return directUser;
    }
    return null;
};

const readUserId = (user) => user?._id ;

const buildSessionFromLoginResponse = (response, profileFallback = null) => {
    const apiUser = profileFallback || readUserObject(response);
    const accessToken = readAccessToken(response);
    const userId = readUserId(apiUser);
    if (!apiUser || !userId || !accessToken) return null;

    const role = normalizeRoleNameValue(
        apiUser.roleId?.name || apiUser.role || DEFAULT_ROLE,
    );

    return {
        ...apiUser,
        access_token: accessToken,
        refresh_token: readRefreshToken(response),
        token_type: readTokenType(response),
        role,
        user_id: userId,
    };
};

export const loginThunk = createAsyncThunk("auth/login",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await loginUserApi(email, password);

            if (response?.success === false) {
                return rejectWithValue(
                    response?.message || response?.error || "Invalid credentials"
                );
            }

            let session = buildSessionFromLoginResponse(response);
            if (!session && readAccessToken(response)) {
                const profileResponse = await fetchAuthMeApi();
                const profileUser =
                    profileResponse?.data ??
                    profileResponse?.user ??
                    profileResponse;
                session = buildSessionFromLoginResponse(response, profileUser);
            }

            if (!session) {
                return rejectWithValue("Unexpected login response");
            }

            saveAuthSession(session);

            return session;
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Network error";
            return rejectWithValue(msg);
        }
    }
);

// send otp thunk
export const sendOtpThunk = createAsyncThunk(
    "auth/sendOtp",
    async (email, { rejectWithValue }) => {
        try {
            const response = await sendOtpApi(email);

            if (response?.success) {
                return response.message || "OTP sent successfully!";
            } else {
                return rejectWithValue(response?.error || "Failed to send OTP");
            }
        } catch (error) {
            return rejectWithValue(error?.response?.data?.message || "Network error");
        }
    }
);

// Verify OTP Thunk
export const verifyOtpThunk = createAsyncThunk(
    "auth/verifyOtp",
    async ({ email, otp }, { rejectWithValue }) => {
        try {
            const response = await verifyOtpApi(email, otp);
            if (response?.success) return response.message || "OTP verified successfully!";
            return rejectWithValue(response?.error || "Failed to verify OTP");
        } catch (error) {
            return rejectWithValue(error?.response?.data?.message || "Network error");
        }
    }
);

// update password Thunk
export const updatePasswordThunk = createAsyncThunk(
    "auth/resetPassword",
    async ({ email, new_password, confirm_password }, { rejectWithValue }) => {
        try {
            const response = await updatePasswordApi({ email, new_password, confirm_password });
            if (response?.success) return response.message;
            return rejectWithValue(response?.error || "Failed to change password");
        } catch (error) {
            return rejectWithValue(error?.response?.data?.message || "Network error");
        }
    }
);

// logout thunk
export const logoutThunk = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            const response = await logoutApi();
            if (response?.success) {
                return response.message || "Logged out successfully";
            } else {
                return rejectWithValue(response?.error || "Failed to logout");
            }
        } catch (error) {
            return rejectWithValue(error?.response?.data?.message || "Network error");
        }
    }
);
