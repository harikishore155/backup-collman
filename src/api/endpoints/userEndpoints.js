const USER_ENDPOINTS = {
  LIST: "users",
  CREATE: "users",
  BY_ID: (id) => `users/${id}`,
  VIEW: (id) => `users/${id}`,
  UPDATE: (id) => `users/${id}`,
  DELETE: (id) => `users/${id}`,
  UPDATE_STATUS: (id) => `users/${id}/status`,
  RESET_PASSWORD: (id) => `users/${id}/reset-password`,
};

export default USER_ENDPOINTS;
