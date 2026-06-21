import PRODUCT_ENDPOINTS from "@/api/endpoints/productEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchProductsApi = async (params = {}) => {
  const response = await axiosInstance.get(PRODUCT_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchProductByIdApi = async (id) => {
  const response = await axiosInstance.get(PRODUCT_ENDPOINTS.BY_ID(id));
  return response.data;
};

export const createProductApi = async (payload) => {
  const response = await axiosInstance.post(PRODUCT_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const updateProductApi = async (id, payload) => {
  const response = await axiosInstance.put(PRODUCT_ENDPOINTS.UPDATE(id), payload);
  return response.data;
};

export const deleteProductApi = async (id) => {
  const response = await axiosInstance.delete(PRODUCT_ENDPOINTS.DELETE(id));
  return response.data;
};

export const updateProductStatusApi = async (id, payload) => {
  const response = await axiosInstance.patch(
    PRODUCT_ENDPOINTS.UPDATE_STATUS?.(id) || `products/${id}/status`,
    payload,
  );
  return response.data;
};
