import CUSTOMER_ENDPOINTS from "@/api/endpoints/customerEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchCustomersApi = async (params = {}) => {
  const response = await axiosInstance.get(CUSTOMER_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchCustomerByIdApi = async (id) => {
  const response = await axiosInstance.get(CUSTOMER_ENDPOINTS.BY_ID(id));
  return response.data;
};

export const createCustomerApi = async (payload) => {
  const response = await axiosInstance.post(CUSTOMER_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const updateCustomerApi = async (id, payload) => {
  const response = await axiosInstance.put(CUSTOMER_ENDPOINTS.UPDATE(id), payload);
  return response.data;
};

export const deleteCustomerApi = async (id) => {
  const response = await axiosInstance.delete(CUSTOMER_ENDPOINTS.DELETE(id));
  return response.data;
};