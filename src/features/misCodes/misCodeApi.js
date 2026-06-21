import MIS_CODE_ENDPOINTS from "@/api/endpoints/misCodeEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchMisCodesApi = async (params = {}) => {
  const response = await axiosInstance.get(MIS_CODE_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchMisCodeByIdApi = async (_id) => {
  const response = await axiosInstance.get(MIS_CODE_ENDPOINTS.BY_ID(_id));
  return response.data;
};

export const createMisCodeApi = async (payload) => {
  const response = await axiosInstance.post(MIS_CODE_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const updateMisCodeApi = async (_id, payload) => {
  const response = await axiosInstance.put(
    MIS_CODE_ENDPOINTS.UPDATE(_id),
    payload,
  );
  return response.data;
};

export const deleteMisCodeApi = async (_id) => {
  const response = await axiosInstance.delete(MIS_CODE_ENDPOINTS.DELETE(_id));
  return response.data;
};

export const updateMisCodeStatusApi = async (_id, payload) => {
  const response = await axiosInstance.patch(
    MIS_CODE_ENDPOINTS.UPDATE_STATUS(_id),
    payload,
  );
  return response.data;
};
