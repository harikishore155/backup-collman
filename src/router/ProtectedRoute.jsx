import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasPermissions } from "@/constants/permissions";
import { getDefaultRouteByRole } from "./roleRoutes";

const ProtectedRoute = ({ allowedPermissions = [] }) => {
  const { user, token } = useSelector((state) => state.auth || {});
  const currentRole = user?.role;

  if (!token || !currentRole) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = hasPermissions(currentRole, allowedPermissions);
  if (!isAllowed) {
    return <Navigate to={getDefaultRouteByRole(currentRole)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;