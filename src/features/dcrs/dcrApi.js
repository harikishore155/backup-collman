import DCR_ENDPOINTS from "@/api/endpoints/dcrEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchDailyCallReportsApi = async (params = {}) => {
  const response = await axiosInstance.get(DCR_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchDailyCallReportByIdApi = async (id) => {
  const response = await axiosInstance.get(DCR_ENDPOINTS.BY_ID(id));
  return response.data;
};

export const deleteDailyCallReportApi = async (id) => {
  const response = await axiosInstance.delete(DCR_ENDPOINTS.DELETE(id));
  return response.data;
};
