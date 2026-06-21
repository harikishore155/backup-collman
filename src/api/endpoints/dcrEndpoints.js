const DCR_ENDPOINTS = {
  LIST: "daily-call-reports",
  BY_ID: (id) => `daily-call-reports/${id}`,
  DELETE: (id) => `daily-call-reports/${id}`,
};

export default DCR_ENDPOINTS;
