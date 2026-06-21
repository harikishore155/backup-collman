import { Outlet } from "react-router-dom";
import "./MainLayout.scss";
import { Container } from "react-bootstrap";
import AppNavbar from "@/components/AppNavbar/AppNavbar";
import NotificationSocket from "@/components/NotificationSocket/NotificationSocket";

const MainLayout = () => {
  // const { loading } = useSelector((state) => state.feature);

  // if (loading ) {
  //   return <PreLoader />;
  // }

  return (
    <section className="main-layout">
      <NotificationSocket />
      <AppNavbar />

      <div className="main-layout-container">
        <Container fluid>
          <main className="main-layout-content">
            <Outlet />
          </main>
        </Container>
      </div>
    </section>
  );
};

export default MainLayout;


