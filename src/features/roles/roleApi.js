import ROLE_ENDPOINTS from "@/api/endpoints/roleEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchRolesApi = async (params = {}) => {
  const response = await axiosInstance.get(ROLE_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchRoleByIdApi = async (id) => {
  const response = await axiosInstance.get(ROLE_ENDPOINTS.VIEW(id));
  return response.data;
};

export const createRoleApi = async (payload) => {
  const response = await axiosInstance.post(ROLE_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const updateRoleApi = async (id, payload) => {
  const response = await axiosInstance.put(ROLE_ENDPOINTS.UPDATE(id), payload);
  return response.data;
};

export const deleteRoleApi = async (id) => {
  const response = await axiosInstance.delete(ROLE_ENDPOINTS.DELETE(id));
  return response.data;
};

export const updateRoleStatusApi = async (id, payload) => {
  const response = await axiosInstance.patch(ROLE_ENDPOINTS.UPDATE_STATUS(id), payload);
  return response.data;
};
