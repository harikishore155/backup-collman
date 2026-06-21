import { normalizeRole } from "@/constants/permissions";

const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMIN"]);

const normalizeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export const normalizePermissionAction = (value) => {
  const key = normalizeKey(value);
  const aliases = {
    auditlogaccess: "auditLogAccess",
    addremarks: "addRemarks",
    updatemis: "updateMIS",
    callcustomer: "callCustomer",
    modifyallocation: "modifyAllocation",
    viewreports: "viewReports",
    exportreport: "exportReport",
    campaignapproval: "campaignApproval",
    escalationapproval: "escalationApproval",
    overduedeadline: "overdueDeadline",
    overduerules: "overdueRules",
    changestatus: "changeStatus",
    assignuser: "assignUser",
    knowledgebaseaccess: "knowledgeBaseAccess",
  };
  return aliases[key] ?? value;
};

export const readRoleName = (user) =>
  user?.roleId?.name ??
  user?.role?.name ??
  user?.roleName ??
  user?.designation ??
  user?.role ??
  "";

export const isAdminUser = (user) => ADMIN_ROLES.has(normalizeRole(readRoleName(user)));

export const readRoleId = (user) => {
  const roleRef = user?.roleId ?? user?.role_id ?? user?.role;
  if (roleRef && typeof roleRef === "object") {
    return String(roleRef._id ?? roleRef.id ?? roleRef.value ?? "");
  }
  return String(roleRef ?? "");
};

export const readRoleFromResponse = (response) => {
  const payload =
    response?.data?.data ??
    response?.data?.role ??
    response?.data ??
    response?.role ??
    response;
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload
    : null;
};

const asPermissionSource = (source) => {
  if (Array.isArray(source)) return source;
  if (source && typeof source === "object" && source.module) return [source];
  return [];
};

export const getPermissionSources = (user) =>
  [
    user?.permissions,
    user?.roleId?.permissions,
    user?.role?.permissions,
    user?.roleId,
    user?.role,
  ].flatMap(asPermissionSource);

export const hasLocalRolePermissions = (user) =>
  getPermissionSources(user).length > 0;

export const hasRolePermission = (user, moduleName, actionName = "view") => {
  if (!moduleName || !actionName) return true;
  if (isAdminUser(user)) return true;

  const targetModule = normalizeKey(moduleName);
  const targetAction = normalizeKey(normalizePermissionAction(actionName));

  return getPermissionSources(user).some((permission) => {
      if (normalizeKey(permission?.module) !== targetModule) return false;
      const actions = permission?.actions ?? permission?.permissions ?? {};

      if (Array.isArray(actions)) {
        return actions.some((action) => {
          if (typeof action === "object") {
            const name =
              action.name ?? action.permission ?? action.action ?? action.key;
            return (
              normalizeKey(normalizePermissionAction(name)) === targetAction &&
              action.enabled !== false &&
              action.value !== false
            );
          }
          return normalizeKey(normalizePermissionAction(action)) === targetAction;
        });
      }

      if (actions && typeof actions === "object") {
        return Object.entries(actions).some(
          ([action, enabled]) =>
            Boolean(enabled) &&
            normalizeKey(normalizePermissionAction(action)) === targetAction,
        );
      }

      return false;
    });
};
