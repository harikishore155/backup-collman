const TARGET_ENDPOINTS = {
  LIST: "targets",
  CREATE: "targets",
  BY_ID: (id) => `targets/${id}`,
  UPDATE: (id) => `targets/${id}`,
  DELETE: (id) => `targets/${id}`,
  UPDATE_STATUS: (id) => `targets/${id}/status`,
};

export default TARGET_ENDPOINTS;
