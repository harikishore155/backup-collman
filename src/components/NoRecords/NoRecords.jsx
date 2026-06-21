import "./NoRecords.scss";
import emptyImage from "@/assets/images/no-records/no-search.svg";

const NoRecords = ({ variant = "empty", message }) => {
    const displayMessage = message || (variant === "search" ? "No search results found" : "No records found");
    const image = emptyImage;

    return (
        <div className="no-records-container">
            <img src={image} alt="no-records" className="img-fluid" />
            <p className="no-records-text">{displayMessage}</p>
        </div>
    );
};

export default NoRecords;
