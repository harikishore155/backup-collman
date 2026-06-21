import CAMPAIGN_ENDPOINTS from "@/api/endpoints/campaignEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const isActiveCampaign = (campaign) =>
  String(campaign?.status ?? "").trim().toLowerCase() === "active";

export const filterActiveCampaigns = (campaigns = []) =>
  Array.isArray(campaigns) ? campaigns.filter(isActiveCampaign) : [];

const filterCampaignListResponse = (data) => {
  if (Array.isArray(data)) return filterActiveCampaigns(data);
  if (!data || typeof data !== "object") return data;

  const filtered = { ...data };
  ["data", "results", "campaigns", "rows"].forEach((key) => {
    if (Array.isArray(filtered[key])) {
      filtered[key] = filterActiveCampaigns(filtered[key]);
    }
  });
  return filtered;
};

/** Normalizes GET-by-id / save response bodies that wrap the entity in different shapes. */
export const pickCampaignFromResponse = (res) => {
  if (!res || typeof res !== "object") return null;
  if (res.campaign) return res.campaign;
  if (res.data?.campaign) return res.data.campaign;
  if (res.data != null && typeof res.data === "object" && !Array.isArray(res.data)) {
    return res.data;
  }
  return res;
};

export const fetchCampaignByIdApi = async (id) => {
  const response = await axiosInstance.get(CAMPAIGN_ENDPOINTS.BY_ID(id));
  return response.data;
};

export const fetchCampaignsApi = async () => {
  const response = await axiosInstance.get(CAMPAIGN_ENDPOINTS.GET, {
    params: { status: "active" },
  });
  return filterCampaignListResponse(response.data);
};

export const fetchCampaignsByClientIdApi = async (clientId) => {
  const response = await axiosInstance.get(
    CAMPAIGN_ENDPOINTS.LIST_BY_CLIENT(clientId),
    { params: { status: "active" } },
  );
  return filterCampaignListResponse(response.data);
};

export const createCampaignApi = async (payload) => {
  const response = await axiosInstance.post(CAMPAIGN_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const updateCampaignApi = async (id, payload) => {
  const response = await axiosInstance.put(CAMPAIGN_ENDPOINTS.UPDATE(id), payload);
  return response.data;
};

export const updateCampaignStatusApi = async (id, payload) => {
  const response = await axiosInstance.patch(
    CAMPAIGN_ENDPOINTS.UPDATE_STATUS(id),
    payload,
  );
  return response.data;
};

export const deleteCampaignApi = async (id) => {
  const response = await axiosInstance.delete(CAMPAIGN_ENDPOINTS.DELETE(id));
  return response.data;
};

export const previewCampaignMassDeleteApi = async (payload) => {
  const response = await axiosInstance.post(
    CAMPAIGN_ENDPOINTS.MASS_DELETE_PREVIEW,
    payload,
  );
  return response.data;
};

export const massDeleteCampaignsApi = async (payload) => {
  const response = await axiosInstance.delete(CAMPAIGN_ENDPOINTS.MASS_DELETE, {
    data: payload,
  });
  return response.data;
};

export const fetchCampaignCustomerListApi = async (campaignId, params = {}) => {
  const response = await axiosInstance.get(
    CAMPAIGN_ENDPOINTS.GET_CUSTOMER_LIST,
    {
      params: {
        ...(campaignId ? { campaignId } : {}),
        ...params,
      },
    },
  );
  return response.data;
};
