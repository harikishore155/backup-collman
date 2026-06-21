import { ROLES } from "@/constants/roles";
import { normalizeRole } from "@/constants/permissions";

export const DEFAULT_ROUTE_BY_ROLE = {
  [ROLES.ADMIN]: "/dashboard",
  [ROLES.SUB_ADMIN]: "/dashboard",
  [ROLES.MD]: "/dashboard",
  [ROLES.UNIT_HEAD]: "/dashboard",
  [ROLES.MANAGER]: "/dashboard",
  [ROLES.ASSISTANT_MANAGER]: "/dashboard",
  [ROLES.TEAM_LEADER]: "/dashboard",
  [ROLES.TELE_CALLER]: "/dashboard",
};

export const getDefaultRouteByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return DEFAULT_ROUTE_BY_ROLE[normalizedRole] || "/login";
};
