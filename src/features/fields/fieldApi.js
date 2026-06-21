import FIELD_ENDPOINTS from "@/api/endpoints/fieldEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchFieldsApi = async (params = {}) => {
  const response = await axiosInstance.get(FIELD_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchFieldByIdApi = async (id) => {
  const response = await axiosInstance.get(FIELD_ENDPOINTS.BY_ID(id));
  return response.data;
};

export const createFieldApi = async (payload) => {
  const response = await axiosInstance.post(FIELD_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const updateFieldApi = async (id, payload) => {
  const response = await axiosInstance.put(FIELD_ENDPOINTS.UPDATE(id), payload);
  return response.data;
};

export const deleteFieldApi = async (id) => {
  const response = await axiosInstance.delete(FIELD_ENDPOINTS.DELETE(id));
  return response.data;
};
