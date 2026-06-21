const CAMPAIGN_ENDPOINTS = {
  GET: "campaigns",

  LIST: "campaigns",
  // LIST_BY_CLIENT: (clientId) => `clients/${clientId}/campaigns`,
  LIST_BY_CLIENT: (clientId) => `campaigns?clientId=${clientId}`,
  
  CREATE: "campaigns",
  BY_ID: (id) => `campaigns/${id}`,
  UPDATE: (id) => `campaigns/${id}`,
  DELETE: (id) => `campaigns/${id}`,
  MASS_DELETE_PREVIEW: "campaigns/mass-delete/preview",
  MASS_DELETE: "campaigns/mass-delete",
  APPROVE: (id) => `campaigns/${id}/approve`,
  UPDATE_STATUS: (id) => `campaigns/${id}/status`,
  
  GET_CUSTOMER_LIST: "customers/cases/my",
  UPDATE_CUSTOMER_LIST: (id) => `customers/cases/${id}`,
};

export default CAMPAIGN_ENDPOINTS;
