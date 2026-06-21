import TYPE_ENDPOINTS from "@/api/endpoints/typeEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchTypesApi = async (params = {}) => {
  const response = await axiosInstance.get(TYPE_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchTypeByIdApi = async (id) => {
  const response = await axiosInstance.get(TYPE_ENDPOINTS.BY_ID(id));
  return response.data;
};

export const createTypeApi = async (payload) => {
  const response = await axiosInstance.post(TYPE_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const updateTypeApi = async (id, payload) => {
  const response = await axiosInstance.put(TYPE_ENDPOINTS.UPDATE(id), payload);
  return response.data;
};

export const deleteTypeApi = async (id) => {
  const response = await axiosInstance.delete(TYPE_ENDPOINTS.DELETE(id));
  return response.data;
};

export const updateTypeStatusApi = async (id, payload) => {
  const response = await axiosInstance.patch(TYPE_ENDPOINTS.UPDATE_STATUS(id), payload);
  return response.data;
};
