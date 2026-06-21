import { createSlice } from "@reduxjs/toolkit";
import { clearAuthCookies, getAccessTokenFromCookie, getUserFromCookie, saveAuthSession } from "@/utils/authCookies";
import { loginThunk, logoutThunk, sendOtpThunk, updatePasswordThunk, verifyOtpThunk } from "./authThunk";

const initialState = {
    user: getUserFromCookie(),
    token: getAccessTokenFromCookie(),
    selectedBranchId: localStorage.getItem("selectedBranchId") || null,
    loading: false,
    error: null,
    message: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setSelectedBranchId: (state, action) => {
            state.selectedBranchId = action.payload;
            localStorage.setItem("selectedBranchId", action.payload);
        },
        setAuthUser: (state, action) => {
            state.user = action.payload;
            if (state.token) {
                saveAuthSession({
                    ...(action.payload || {}),
                    access_token: state.token,
                    refresh_token: getUserFromCookie()?.refresh_token || "",
                    token_type: getUserFromCookie()?.token_type || "Bearer",
                    role: action.payload?.role || getUserFromCookie()?.role || "",
                    user_id: action.payload?._id || action.payload?.id || getUserFromCookie()?.user_id || "",
                });
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.access_token;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Login failed";
            })

            // send otp
            .addCase(sendOtpThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(sendOtpThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.message = action.payload;
                state.error = null;
            })
            .addCase(sendOtpThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to send reset link";
            })

            // Verify OTP
            .addCase(verifyOtpThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(verifyOtpThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.message = action.payload;
                state.error = null;
            })
            .addCase(verifyOtpThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to verify OTP";
            })

            // update password
            .addCase(updatePasswordThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(updatePasswordThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.message = action.payload;
            })
            .addCase(updatePasswordThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to change password";
            })

            // logout
            .addCase(logoutThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutThunk.fulfilled, (state) => {
                state.loading = false;
                clearAuthCookies();
                localStorage.removeItem("selectedBranchId");
                state.user = null;
                state.token = null;
                state.selectedBranchId = null;
                state.error = null;
                state.message = null;
            })
            .addCase(logoutThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Logout failed";
            });
    },
});

export const { logout, setSelectedBranchId, setAuthUser } = authSlice.actions;
export default authSlice.reducer;
