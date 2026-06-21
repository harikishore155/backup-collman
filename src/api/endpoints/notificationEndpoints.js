const NOTIFICATION_ENDPOINTS = {
  LIST: "notifications",
  UNREAD_COUNT: "notifications/unread-count",
  MARK_ALL_READ: "notifications/read-all",
  MARK_READ: (id) => `notifications/${id}/read`,
  ACTION: (id) => `notifications/${id}/action`,
};

export default NOTIFICATION_ENDPOINTS;
