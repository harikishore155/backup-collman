const CLIENT_ENDPOINTS = {
  LIST: "clients",
  CREATE: "clients",
  BY_ID: (id) => `clients/${id}`,
  VIEW: (id) => `clients/${id}`,
  UPDATE: (id) => `clients/${id}`,
  DELETE: (id) => `clients/${id}`,
  UPDATE_STATUS: (id) => `clients/${id}/status`,
};

export default CLIENT_ENDPOINTS;
