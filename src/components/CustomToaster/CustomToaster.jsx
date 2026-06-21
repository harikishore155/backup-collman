import "./CustomToaster.scss";
import { Toaster } from "react-hot-toast";

const CustomToaster = () => {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          duration: 3000,
          className: "my-toast",
          success: { className: "my-toast toast-success" },
          error: { className: "my-toast toast-error" },
        }}
      />
    </>
  );
};

export default CustomToaster;
