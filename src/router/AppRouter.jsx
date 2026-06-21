import { Navigate, Route, Routes } from "react-router-dom";
import AuthRouter from "./AuthRouter";
import AdminRouter from "./AdminRouter";

const AppRouter = () => (
  <Routes>
    <Route path="/login/*" element={<AuthRouter />} />
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<AdminRouter />} />
  </Routes>
);

export default AppRouter;
