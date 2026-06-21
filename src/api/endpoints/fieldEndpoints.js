const FIELD_ENDPOINTS = {
  LIST: "field",
  CREATE: "field",
  BY_ID: (id) => `field/${id}`,
  UPDATE: (id) => `field/${id}`,
  DELETE: (id) => `field/${id}`,
};

export default FIELD_ENDPOINTS;
