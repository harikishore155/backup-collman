import NOTIFICATION_ENDPOINTS from "@/api/endpoints/notificationEndpoints";
import axiosInstance from "@/utils/axiosInstance";

export const fetchNotificationsApi = async (params = {}) => {
  const response = await axiosInstance.get(NOTIFICATION_ENDPOINTS.LIST, {
    params,
  });
  return response.data;
};

export const fetchUnreadNotificationCountApi = async () => {
  const response = await axiosInstance.get(NOTIFICATION_ENDPOINTS.UNREAD_COUNT);
  return response.data;
};

export const markAllNotificationsAsReadApi = async () => {
  const response = await axiosInstance.patch(NOTIFICATION_ENDPOINTS.MARK_ALL_READ);
  return response.data;
};

export const markNotificationAsReadApi = async (id) => {
  const response = await axiosInstance.patch(NOTIFICATION_ENDPOINTS.MARK_READ(id));
  return response.data;
};

export const actionNotificationApi = async (id, approvalStatus) => {
  const response = await axiosInstance.patch(NOTIFICATION_ENDPOINTS.ACTION(id), {
    approvalStatus,
  });
  return response.data;
};
