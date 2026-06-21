import "./App.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import "@radix-ui/themes/styles.css";
import CustomToaster from "./components/CustomToaster/CustomToaster";
import AppRouter from "./router/AppRouter";

function App() {
  return (
    <>
      <AppRouter />
      <CustomToaster />
    </>
  );
}

export default App;
