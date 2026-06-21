import DASHBOARD_ENDPOINTS from "@/api/endpoints/dashboardEndpoints";
import axiosInstance from "@/utils/axiosInstance";

const getWithParams = async (url, params = {}, signal) => {
  const response = await axiosInstance.get(url, { params, signal });
  return response.data;
};

export const fetchDashboardKpisApi = async (params = {}, signal) => getWithParams(DASHBOARD_ENDPOINTS.KPIS, params, signal);

export const fetchCollectionTrendApi = async (params = {}, signal) => getWithParams(DASHBOARD_ENDPOINTS.COLLECTION_TREND, params, signal);

export const fetchTargetVsAchievementApi = async (params = {}, signal) => getWithParams(DASHBOARD_ENDPOINTS.TARGET_VS_ACHIEVEMENT, params, signal);

export const fetchStatusDistributionApi = async (params = {}, signal) => getWithParams(DASHBOARD_ENDPOINTS.STATUS_DISTRIBUTION, params, signal);

export const fetchMisDistributionApi = async (params = {}, signal) => getWithParams(DASHBOARD_ENDPOINTS.MIS_DISTRIBUTION, params, signal);

export const fetchTelecallerPerformanceApi = async (params = {}, signal) => getWithParams(DASHBOARD_ENDPOINTS.TELECALLER_PERFORMANCE, params, signal);

export const fetchCampaignSummaryApi = async (params = {}, signal) => getWithParams(DASHBOARD_ENDPOINTS.CAMPAIGN_SUMMARY, params, signal);

export const fetchPtpTrackingApi = async (params = {}, signal) => getWithParams(DASHBOARD_ENDPOINTS.PTP_TRACKING, params, signal);

export const fetchDashboardAlertsApi = async (params = {}, signal) => getWithParams(DASHBOARD_ENDPOINTS.ALERTS, params, signal);

export const fetchDashboardDrilldownApi = async (params = {}, signal) => getWithParams(DASHBOARD_ENDPOINTS.DRILLDOWN, params, signal);
