import "./EmptyImage.scss";
import emptyImageSrc from "@/assets/images/empty-img.png";

const EmptyImage = ({ message, className = "" }) => {
    return (
        <div className={`empty-image-container ${className}`}>
            <img src={emptyImageSrc} alt="empty data" className="empty-records-image" />
            {message && <p className="empty-text">{message}</p>}
        </div>
    );
};

export default EmptyImage;
