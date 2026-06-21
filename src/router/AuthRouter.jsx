import NotFound from "@/components/NotFound/NotFound";
import LoginPage from "@/pages/Auth/LoginPage/LoginPage";
import { Route, Routes } from "react-router-dom";

const AuthRouter = () => {
  return (
    <Routes>
      <Route index element={<LoginPage />} />
      <Route path="login" element={<LoginPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AuthRouter;
