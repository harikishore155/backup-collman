import CASE_UPLOAD_ENDPOINTS from "@/api/endpoints/caseuploadEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchCaseUploadCampaignsApi = async (params = {}) => {
  const response = await axiosInstance.get(CASE_UPLOAD_ENDPOINTS.CAMPAIGNS, {
    params,
  });
  return response.data;
};

export const revertCaseUploadApi = async (campaignId) => {
  const response = await axiosInstance.post(
    CASE_UPLOAD_ENDPOINTS.REVERT_UPLOAD(campaignId),
  );
  return response.data;
};

export const replaceCaseUploadApi = async (campaignId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post(
    CASE_UPLOAD_ENDPOINTS.REPLACE_UPLOAD(campaignId),
    formData,
    { headers: { "Content-Type": undefined } },
  );
  return response.data;
};

export const replaceDeleteCaseUploadApi = async (campaignId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post(
    CASE_UPLOAD_ENDPOINTS.REPLACE_DELETE(campaignId),
    formData,
    { headers: { "Content-Type": undefined } },
  );
  return response.data;
};

export const previewCaseMassUpdateApi = async (payload) => {
  const response = await axiosInstance.post(
    CASE_UPLOAD_ENDPOINTS.MASS_UPDATE_PREVIEW,
    payload,
  );
  return response.data;
};

export const massUpdateCasesApi = async (payload) => {
  const response = await axiosInstance.patch(
    CASE_UPLOAD_ENDPOINTS.MASS_UPDATE,
    payload,
  );
  return response.data;
};

export const previewCaseMassDeleteApi = async (payload) => {
  const response = await axiosInstance.post(
    CASE_UPLOAD_ENDPOINTS.MASS_DELETE_PREVIEW,
    payload,
  );
  return response.data;
};

export const massDeleteCasesApi = async (payload) => {
  const response = await axiosInstance.delete(CASE_UPLOAD_ENDPOINTS.MASS_DELETE, {
    data: payload,
  });
  return response.data;
};
