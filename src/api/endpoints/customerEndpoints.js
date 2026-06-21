const CUSTOMER_ENDPOINTS = {
  LIST:   "customers/cases/my",
  UPDATE: (id) => `customers/cases/${id}`,
  DELETE: (id) => `customers/cases/${id}`,
  BY_ID: (id) => `customers/cases/${id}`,
 
};

export default CUSTOMER_ENDPOINTS;