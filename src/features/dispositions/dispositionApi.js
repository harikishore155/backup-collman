import DISPOSITION_ENDPOINTS from "@/api/endpoints/dispositionEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchDispositionsApi = async (type, params = {}) => {
  const endpoint = DISPOSITION_ENDPOINTS[String(type).toUpperCase()];
  const response = await axiosInstance.get(endpoint, { params });
  return response.data;
};
