import { FiDownload } from "react-icons/fi";
import { MdOutlineAdd } from "react-icons/md";
import "./PageHeader.scss";
import Button from "../Button/Button";

const PageHeader = ({
  title = "Clients",
  subtitle = "View, search and manage all Client records",
  onExport,
  onCreate,
  exportLabel = "Export",
  createLabel = "Create Client",
}) => {
  return (
    <header className="page-header-container">
      <div className="page-title-wrap">
        <h5>{title}</h5>
        <p>{subtitle}</p>
      </div>

      <div className="page-header-actions">
        {onExport && (
          <Button
            variant="custom"
            size="lg"
            onClick={onExport}
            className="d-flex align-items-end gap-1"
          >
            <FiDownload aria-hidden="true" />
            {exportLabel}
          </Button>
        )}

        {onCreate && (
          <Button
            variant="primary"
            size="lg"
            onClick={onCreate}
            className="d-flex align-items-end gap-1"
          >
            <MdOutlineAdd aria-hidden="true" />
            {createLabel}
          </Button>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
