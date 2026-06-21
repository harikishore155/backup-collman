import { useRef, useState } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";
import Button from "../Button/Button";
import { IoCloudUploadOutline } from "react-icons/io5";
import "./ImageUpload.scss";
import toast from "react-hot-toast";

const ImageUpload = ({
  value,
  accept = "image/*",
  multiple = false,
  onChange,
  buttonLabel = "Upload Now",
  buttonVariant = "primary",
  buttonSize = "lg",
  maxFileSizeMB = 5,
  previewShape = "square",
  className = "",
  helpText = "",
}) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(value || null);

  const handleUpload = (e) => {
    const files = multiple ? Array.from(e.target.files) : [e.target.files?.[0]];
    if (!files.length) return;

    const validFiles = files.filter(
      (file) => file.size / 1024 / 1024 <= maxFileSizeMB,
    );
    if (!validFiles.length) {
      toast.error(`File size should not exceed ${maxFileSizeMB}MB`);
      return;
    }

    if (multiple) {
      setPreview(validFiles.map((file) => URL.createObjectURL(file)));
      onChange?.(validFiles);
    } else {
      const previewUrl = URL.createObjectURL(validFiles[0]);
      setPreview(previewUrl);
      onChange?.(validFiles[0]);
    }
  };

  const handleRemove = (index = 0) => {
    if (Array.isArray(preview)) {
      const updatedPreview = [...preview];
      updatedPreview.splice(index, 1);
      setPreview(updatedPreview);
      onChange?.(updatedPreview.length ? updatedPreview : null);
    } else {
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onChange?.(null);
    }
  };

  return (
    <div className={`image-upload-container ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        className="file-input"
        accept={accept}
        multiple={multiple}
        onChange={handleUpload}
      />

      {!preview || (Array.isArray(preview) && preview.length === 0) ? (
        <>
          <Button
            variant={buttonVariant}
            size={buttonSize}
            className="upload-now-btn"
            onClick={() => fileInputRef.current.click()}
          >
            <IoCloudUploadOutline />
            {buttonLabel}
          </Button>
          {helpText && <p className="img-size">{helpText}</p>}
        </>
      ) : (
        <div className="image-preview-container">
          {Array.isArray(preview) ? (
            preview.map((url, i) => (
              <div key={i} className="image-wrapper">
                <img
                  src={url}
                  alt={`preview-${i}`}
                  className={`image-preview ${previewShape}`}
                />
                <div className="image-cancel-icon">
                  <button
                    type="button"
                    className="close-btn"
                    onClick={() => handleRemove(i)}
                  >
                    <IoCloseCircleOutline />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="image-wrapper">
              <img
                src={preview}
                alt="preview"
                className={`image-preview ${previewShape}`}
              />
              <div className="image-cancel-icon">
                <button
                  type="button"
                  className="close-btn"
                  onClick={handleRemove}
                >
                  <IoCloseCircleOutline />
                </button>
              </div>
            </div>
          )}

          <Button
            variant="secondary"
            size="lg"
            className="upload-now-btn"
            onClick={() => fileInputRef.current.click()}
          >
            Change Image
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
