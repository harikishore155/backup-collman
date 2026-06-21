const ROLE_ENDPOINTS = {
  LIST: "roles",
  CREATE: "roles",
  BY_ID: (id) => `roles/${id}`,
  VIEW: (id) => `roles/${id}`,
  UPDATE: (id) => `roles/${id}`,
  DELETE: (id) => `roles/${id}`,
  UPDATE_STATUS: (id) => `roles/${id}/status`,
};

export default ROLE_ENDPOINTS;
