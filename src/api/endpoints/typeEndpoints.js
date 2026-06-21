const TYPE_ENDPOINTS = {
  LIST: "types",
  CREATE: "types",
  BY_ID: (id) => `types/${id}`,
  UPDATE: (id) => `types/${id}`,
  DELETE: (id) => `types/${id}`,
  UPDATE_STATUS: (id) => `types/${id}/status`,
};

export default TYPE_ENDPOINTS;
