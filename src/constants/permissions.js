import { ROLES } from "./roles";

export const PERMISSIONS = {
  [ROLES.ADMIN]: ["dashboard", "users", "reports"],
  [ROLES.SUB_ADMIN]: ["dashboard", "users", "reports"],
  [ROLES.MD]: ["dashboard", "users", "reports"],
  [ROLES.UNIT_HEAD]: ["dashboard", "reports"],
  [ROLES.MANAGER]: ["dashboard", "reports"],
  [ROLES.ASSISTANT_MANAGER]: ["dashboard"],
  [ROLES.TEAM_LEADER]: ["dashboard"],
  [ROLES.TELE_CALLER]: ["dashboard"],
};

const ROLE_ALIASES = {
  ADMIN: ROLES.ADMIN,
  SUBADMIN: ROLES.SUB_ADMIN,
  MD: ROLES.MD,
  UNITHEAD: ROLES.UNIT_HEAD,
  MANAGER: ROLES.MANAGER,
  ASSISTANTMANAGER: ROLES.ASSISTANT_MANAGER,
  AM: ROLES.ASSISTANT_MANAGER,
  TL: ROLES.TEAM_LEADER,
  TEAMLEADER: ROLES.TEAM_LEADER,
  TELECALLER: ROLES.TELE_CALLER,
  TELECALLERUSER: ROLES.TELE_CALLER,
};

export const normalizeRole = (role = "") => {
  const key = String(role)
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
  return ROLE_ALIASES[key] || key;
};

export const getPermissionsByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return PERMISSIONS[normalizedRole] || [];
};

export const hasPermissions = (role, requiredPermissions = []) => {
  if (!requiredPermissions.length) return true;

  const userPermissions = getPermissionsByRole(role);
  return requiredPermissions.every((permission) => userPermissions.includes(permission));
};
