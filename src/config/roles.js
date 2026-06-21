export const ROLES = {
  MASTER: "master",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
  MANAGER: "manager",
};

export const ROLE_LABELS = {
  [ROLES.MASTER]: "Master",
  [ROLES.ADMIN]: "Admin",
  [ROLES.SUPERADMIN]: "Super Admin",
  [ROLES.MANAGER]: "Manager",
};

export const DEFAULT_ROLE = ROLES.MANAGER;
