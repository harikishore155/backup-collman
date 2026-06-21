import AUDIT_LOG_ENDPOINTS from "@/api/endpoints/auditLogEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchAuditLogsApi = async (params = {}) => {
  const response = await axiosInstance.get(AUDIT_LOG_ENDPOINTS.LIST, {
    params,
  });
  return response.data;
};
