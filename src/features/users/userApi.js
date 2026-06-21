import USER_ENDPOINTS from "@/api/endpoints/userEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchUsersApi = async (params = {}) => {
  const response = await axiosInstance.get(USER_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchUserByIdApi = async (id) => {
  const response = await axiosInstance.get(USER_ENDPOINTS.BY_ID(id));
  return response.data;
};

export const createUserApi = async (payload) => {
  const response = await axiosInstance.post(USER_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const updateUserApi = async (id, payload) => {
  const response = await axiosInstance.put(USER_ENDPOINTS.UPDATE(id), payload);
  return response.data;
};

export const deleteUserApi = async (id) => {
  const response = await axiosInstance.delete(USER_ENDPOINTS.DELETE(id));
  return response.data;
};

export const updateUserStatusApi = async (id, payload) => {
  const response = await axiosInstance.patch(USER_ENDPOINTS.UPDATE_STATUS(id), payload);
  return response.data;
};

export const resetUserPasswordApi = async (id, payload) => {
  const response = await axiosInstance.patch(USER_ENDPOINTS.RESET_PASSWORD(id), payload);
  return response.data;
};
