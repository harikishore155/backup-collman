const PRODUCT_ENDPOINTS = {
  LIST: "products",
  CREATE: "products",
  BY_ID: (id) => `products/${id}`,
  UPDATE: (id) => `products/${id}`,
  DELETE: (id) => `products/${id}`,
  UPDATE_STATUS: (id) => `products/${id}/status`,
};

export default PRODUCT_ENDPOINTS;
