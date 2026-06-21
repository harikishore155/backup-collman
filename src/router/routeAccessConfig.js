export const ROUTE_ACCESS = {
  dashboard: { module: "reportDashboard", action: "view" },
  profile: null,

  masters: { module: "masterModuleAccess", action: "view" },
  masterCreate: { module: "masterModuleAccess", action: "create" },
  masterEdit: { module: "masterModuleAccess", action: "edit" },
  masterDelete: { module: "masterModuleAccess", action: "delete" },
  masterAudit: { module: "approvalSpecialControl", action: "auditLogAccess" },

  customers: { module: "caseUploadAllocation", action: "view" },
  customerCreate: { module: "caseUploadAllocation", action: "upload" },
  customerEdit: { module: "caseUploadAllocation", action: "update" },
  customerDelete: { module: "caseUploadAllocation", action: "delete" },
  customerAudit: { module: "approvalSpecialControl", action: "auditLogAccess" },

  allocation: { module: "campaignManagement", action: "view" },
  allocationCreate: { module: "campaignManagement", action: "create" },
  allocationEdit: { module: "campaignManagement", action: "edit" },
  allocationUpdateStatus: { module: "campaignManagement", action: "edit" },
  allocationDelete: { module: "campaignManagement", action: "delete" },
  allocationAudit: { module: "approvalSpecialControl", action: "auditLogAccess" },
  allocationApprove: { module: "approvalSpecialControl", action: "campaignApproval" },

  caseUpload: { module: "caseUploadAllocation", action: "upload" },
  caseReplace: { module: "caseUploadAllocation", action: "update" },
  caseMassUpdate: { module: "caseUploadAllocation", action: "update" },
  caseMassDelete: { module: "caseUploadAllocation", action: "delete" },
  caseRevertUpload: { module: "caseUploadAllocation", action: "delete" },

  targets: { module: "targetModule", action: "view" },
  targetCreate: { module: "targetModule", action: "create" },
  targetEdit: { module: "targetModule", action: "edit" },
  targetDelete: { module: "targetModule", action: "delete" },
  targetAudit: { module: "targetModule", action: "auditLogAccess" },

  incentives: { module: "incentiveModule", action: "view" },
  incentiveCreate: { module: "incentiveModule", action: "upload" },
  incentiveEdit: { module: "incentiveModule", action: "update" },
  incentiveDelete: { module: "incentiveModule", action: "delete" },
  incentiveAssign: { module: "incentiveModule", action: "assign" },

  dispositions: { module: "teleCallerOperation", action: "view" },
  dispositionEdit: { module: "teleCallerOperation", action: "update" },
  dispositionRemarks: { module: "teleCallerOperation", action: "addRemarks" },
  dispositionMIS: { module: "teleCallerOperation", action: "updateMIS" },
  dispositionCall: { module: "teleCallerOperation", action: "callCustomer" },
  dispositionModifyAllocation: { module: "teleCallerOperation", action: "modifyAllocation" },

  dcrs: { module: "reportDashboard", action: "viewReports" },
  dcrEdit: { module: "reportDashboard", action: "edit" },
  dcrDelete: { module: "reportDashboard", action: "delete" },

  reports: { module: "reportDashboard", action: "viewReports" },
  reportExport: { module: "reportDashboard", action: "exportReport" },

  imports: { module: "caseUploadAllocation", action: "upload" },
  auditLogs: { module: "approvalSpecialControl", action: "auditLogAccess" },
  knowledgeBase: { module: "approvalSpecialControl", action: "KnowledgeBaseAccess" },
};

export const DEFAULT_AUTHORIZED_ROUTES = [
  { path: "/dashboard", access: ROUTE_ACCESS.dashboard },

  { path: "/customer-mgt/allocation", access: ROUTE_ACCESS.allocation },
  { path: "/customer-mgt/customers", access: ROUTE_ACCESS.customers },
  { path: "/customer-mgt/goal-sheet", access: ROUTE_ACCESS.targets },
  { path: "/customer-mgt/incentives", access: ROUTE_ACCESS.incentives },

  { path: "/cases/bkt", access: ROUTE_ACCESS.dispositions },
  { path: "/dcrs", access: ROUTE_ACCESS.dcrs },
  { path: "/reports", access: ROUTE_ACCESS.reports },
  { path: "/imports", access: ROUTE_ACCESS.imports },
  { path: "/audit-logs", access: ROUTE_ACCESS.auditLogs },
  { path: "/knowledge-base", access: ROUTE_ACCESS.knowledgeBase },

  { path: "/masters/clients", access: ROUTE_ACCESS.masters },
  { path: "/masters/products", access: ROUTE_ACCESS.masters },
  { path: "/masters/mis-codes", access: ROUTE_ACCESS.masters },
  { path: "/masters/types", access: ROUTE_ACCESS.masters },
  { path: "/masters/fields", access: ROUTE_ACCESS.masters },
  { path: "/masters/users", access: ROUTE_ACCESS.masters },
  { path: "/masters/roles", access: ROUTE_ACCESS.masters },

  { path: "/profile", access: null },
];