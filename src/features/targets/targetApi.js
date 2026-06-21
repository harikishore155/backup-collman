import TARGET_ENDPOINTS from "@/api/endpoints/targetEndpoints";
import axiosInstance from "@/utils/axiosInstance";

/** Normalizes GET-by-id / save response bodies that wrap the entity in different shapes. */
export const pickTargetFromResponse = (res) => {
  if (!res || typeof res !== "object") return null;
  if (res.target) return res.target;
  if (res.goalSheet) return res.goalSheet;
  if (res.goal_sheet) return res.goal_sheet;
  if (res.data?.target) return res.data.target;
  if (res.data?.goalSheet) return res.data.goalSheet;
  if (res.data?.goal_sheet) return res.data.goal_sheet;
  if (res.data != null && typeof res.data === "object" && !Array.isArray(res.data)) {
    return res.data;
  }
  return res;
};

export const getTargetApiErrorMessage = (error, fallback = "Something went wrong") => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const msg = data.message ?? data.error ?? data.detail;
    if (typeof msg === "string" && msg.trim()) return msg;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((e) => e?.message ?? e).join(", ");
    }
  }
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
};

export const fetchTargetsApi = async (params = {}) => {
  const response = await axiosInstance.get(TARGET_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchTargetByIdApi = async (id) => {
  const response = await axiosInstance.get(TARGET_ENDPOINTS.BY_ID(id));
  return response.data;
};

export const createTargetApi = async (payload) => {
  const response = await axiosInstance.post(TARGET_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const updateTargetApi = async (id, payload) => {
  const response = await axiosInstance.put(TARGET_ENDPOINTS.UPDATE(id), payload);
  return response.data;
};

export const updateTargetStatusApi = async (id, payload) => {
  const response = await axiosInstance.patch(
    TARGET_ENDPOINTS.UPDATE_STATUS(id),
    payload,
  );
  return response.data;
};

export const deleteTargetApi = async (id) => {
  const response = await axiosInstance.delete(TARGET_ENDPOINTS.DELETE(id));
  return response.data;
};
