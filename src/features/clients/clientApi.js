import CLIENT_ENDPOINTS from "@/api/endpoints/clientEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchClientsApi = async (params = {}) => {
  const response = await axiosInstance.get(CLIENT_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchClientByIdApi = async (id) => {
  const response = await axiosInstance.get(CLIENT_ENDPOINTS.BY_ID(id));
  return response.data;
};

/** GET single client (same resource as BY_ID; used on view/details screens). */
export const fetchClientViewApi = async (id) => {
  const response = await axiosInstance.get(CLIENT_ENDPOINTS.VIEW(id));
  return response.data;
};

export const createClientApi = async (payload) => {
  const response = await axiosInstance.post(CLIENT_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const updateClientApi = async (id, payload) => {
  const response = await axiosInstance.put(CLIENT_ENDPOINTS.UPDATE(id), payload);
  return response.data;
};

export const deleteClientApi = async (id) => {
  const response = await axiosInstance.delete(CLIENT_ENDPOINTS.DELETE(id));
  return response.data;
};

export const updateClientStatusApi = async (id, payload) => {
  const response = await axiosInstance.patch(
    CLIENT_ENDPOINTS.UPDATE_STATUS(id),
    payload,
  );
  return response.data;
};
