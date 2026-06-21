export const ROLES = {
  ADMIN: "ADMIN",
  SUB_ADMIN: "SUB_ADMIN",
  MD: "MD",
  UNIT_HEAD: "UNIT_HEAD",
  MANAGER: "MANAGER",
  ASSISTANT_MANAGER: "ASSISTANT_MANAGER",
  TEAM_LEADER: "TEAM_LEADER",
  TELE_CALLER: "TELE_CALLER",
};

/** Master Role form — name dropdown options */
export const ROLE_NAME_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Sub Admin", value: "subAdmin" },
  { label: "Manager", value: "manager" },
  { label: "Assistant Manager", value: "assistantManager" },
  { label: "TL", value: "TL" },
  { label: "Telecaller", value: "telecaller" },
  { label: "MD", value: "md" },
  { label: "Unit Head", value: "unithead" },
];

const normalizeRoleNameKey = (name) =>
  String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

/** Map API / legacy role name strings to a dropdown value */
export const normalizeRoleNameValue = (name) => {
  if (name == null || name === "") return "";
  const key = normalizeRoleNameKey(name);
  const match = ROLE_NAME_OPTIONS.find((opt) => {
    const valueKey = normalizeRoleNameKey(opt.value);
    const labelKey = normalizeRoleNameKey(opt.label);
    return valueKey === key || labelKey === key;
  });
  return match?.value ?? name;
};

/** True when a user/role API name denotes Team Leader (TL). */
export const isTeamLeaderRoleName = (name) => {
  if (name == null || name === "") return false;
  const key = normalizeRoleNameKey(name);
  if (key === "tl" || key === "teamleader") return true;
  return normalizeRoleNameValue(name) === "TL";
};
