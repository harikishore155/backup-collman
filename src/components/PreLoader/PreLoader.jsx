import { FadeLoader } from "react-spinners";
import "./PreLoader.scss";

const PreLoader = () => {
  return (
    <div className="preloader-container">
      <FadeLoader
        color="var(--primary-color)"
        loading={true}
        height={15}
        width={4}
        radius={2}
        margin={2} />
    </div>
  );
};

export default PreLoader;
