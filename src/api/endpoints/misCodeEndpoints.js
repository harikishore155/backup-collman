const MIS_CODE_ENDPOINTS = {
  LIST: "mis-codes",
  CREATE: "mis-codes",
  BY_ID: (_id) => `mis-codes/${_id}`,
  UPDATE: (_id) => `mis-codes/${_id}`,
  DELETE: (_id) => `mis-codes/${_id}`,
  UPDATE_STATUS: (_id) => `mis-codes/${_id}/status`,
};

export default MIS_CODE_ENDPOINTS;
