import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PreLoader from "@/components/PreLoader/PreLoader";
import { fetchAuthMeApi } from "@/features/auth/authApi";
import { fetchRoleByIdApi, fetchRolesApi } from "@/features/roles/roleApi";
import { setAuthUser } from "@/features/auth/authSlice";
import {
  hasLocalRolePermissions,
  hasRolePermission,
  isAdminUser,
  readRoleFromResponse,
  readRoleId,
  readRoleName,
} from "@/utils/rolePermissionHelpers";
import { DEFAULT_AUTHORIZED_ROUTES } from "./routeAccessConfig";

const getDefaultAuthorizedRoute = (user) => {
  const match = DEFAULT_AUTHORIZED_ROUTES.find(({ access }) => {
    if (!access) return true;
    return hasRolePermission(user, access.module, access.action);
  });
  return match?.path ?? "/profile";
};

const normalizeRoleMatchKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const findRoleInList = (roles, user, roleId) => {
  const targetId = normalizeRoleMatchKey(roleId);
  const targetName = normalizeRoleMatchKey(readRoleName(user));

  return roles.find((role) => {
    const ids = [role?._id, role?.id, role?.roleId, role?.role_id].map(
      normalizeRoleMatchKey,
    );
    const names = [role?.name, role?.roleName, role?.role_name].map(
      normalizeRoleMatchKey,
    );
    return (
      (targetId && ids.includes(targetId)) ||
      (targetName && names.includes(targetName))
    );
  });
};

const readUserFromResponse = (response) => {
  const payload =
    response?.data?.user ??
    response?.data?.data ??
    response?.data ??
    response?.user ??
    response;
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload
    : null;
};

const fetchRoleForUser = async (user, roleId) => {
  try {
    const profile = readUserFromResponse(await fetchAuthMeApi());
    if (profile && hasLocalRolePermissions(profile)) return { type: "profile", data: profile };
  } catch {
    // Continue with role lookup for older /auth/me responses.
  }

  try {
    const response = await fetchRoleByIdApi(roleId);
    const role = readRoleFromResponse(response);
    if (role?.permissions) return { type: "role", data: role };
  } catch (error) {
    if (error?.response?.status === 403) return null;
    // Fall back to the role list below.
  }

  const listResponse = await fetchRolesApi();
  const listPayload =
    listResponse?.data?.data ??
    listResponse?.data?.roles ??
    listResponse?.data ??
    listResponse?.roles ??
    listResponse;
  const roles = Array.isArray(listPayload)
    ? listPayload
    : Array.isArray(listPayload?.rows)
      ? listPayload.rows
      : [];
  const role = findRoleInList(roles, user, roleId) ?? null;
  return role ? { type: "role", data: role } : null;
};

const RoleProtectedRoute = ({ module, action = "view", children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth || {});
  const [loadingRole, setLoadingRole] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [roleFetchState, setRoleFetchState] = useState({
    roleId: "",
    attempted: false,
  });

  const roleId = readRoleId(user);
  const roleFetchAttempted =
    roleFetchState.roleId === roleId && roleFetchState.attempted;
  const needsRoleFetch =
    Boolean(token && user && roleId) &&
    !isAdminUser(user) &&
    !hasLocalRolePermissions(user);

  useEffect(() => {
    if (!needsRoleFetch) return undefined;

    let active = true;
    const loadRole = async () => {
      try {
        setLoadingRole(true);
        setFetchFailed(false);
        setRoleFetchState({ roleId, attempted: false });
        const result = await fetchRoleForUser(user, roleId);
        if (!active) return;
        if (!result) {
          setRoleFetchState({ roleId, attempted: true });
          return;
        }
        const { data, type } = result;
        const nextUser = type === "profile"
          ? { ...user, ...data }
          : {
              ...user,
              roleId:
                user?.roleId && typeof user.roleId === "object"
                  ? { ...user.roleId, ...data }
                  : data,
              permissions: data.permissions,
              role: data.name ?? user?.role,
            };
        dispatch(
          setAuthUser(nextUser),
        );
        setRoleFetchState({ roleId, attempted: true });
      } catch {
        if (active) {
          setFetchFailed(true);
          setRoleFetchState({ roleId, attempted: true });
        }
      } finally {
        if (active) setLoadingRole(false);
      }
    };

    loadRole();
    return () => {
      active = false;
    };
  }, [dispatch, needsRoleFetch, roleId, user]);

  const isAllowed = useMemo(() => {
    if (!module || !action) return true;
    return hasRolePermission(user, module, action);
  }, [action, module, user]);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (loadingRole || (needsRoleFetch && !roleFetchAttempted)) return <PreLoader />;

  if (!isAllowed || (fetchFailed && !hasRolePermission(user, module, action))) {
    const fallback = getDefaultAuthorizedRoute(user);
    return (
      <Navigate
        to={fallback === location.pathname ? "/profile" : fallback}
        replace
      />
    );
  }

  return children ?? <Outlet />;
};

export default RoleProtectedRoute;
