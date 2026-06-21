const CASE_UPLOAD_ENDPOINTS = {
  CREATE: (id) => `case-uploads/${id}/upload`, // POST multipart — id = campaign _id
  CAMPAIGNS: "case-uploads/campaigns", // GET — campaigns + preview rows for import flow
  REVERT_UPLOAD: (campaignId) => `case-uploads/${campaignId}/revert-upload`,
  REPLACE_UPLOAD: (campaignId) => `case-uploads/${campaignId}/replace-upload`,
  REPLACE_DELETE: (campaignId) => `case-uploads/${campaignId}/replace-delete`,
  MASS_UPDATE_PREVIEW: "case-uploads/mass-update/preview",
  MASS_UPDATE: "case-uploads/mass-update",
  MASS_DELETE_PREVIEW: "case-uploads/mass-delete/preview",
  MASS_DELETE: "case-uploads/mass-delete",
};

export default CASE_UPLOAD_ENDPOINTS;
