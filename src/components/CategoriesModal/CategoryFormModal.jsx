import { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { IoCloseCircleOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import axiosMultipartInstance from "@/utils/axiosMultipartInstance";
import "./CategoryFormModal.scss";

const CategoryFormModal = ({ show, handleClose, mode = "add", initialData = { id: null, name: "" }, onSubmit }) => {
    const title = mode === "edit" ? "Edit Category" : "Add Service";
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(initialData?.image || null);
    const [categoryName, setCategoryName] = useState("");
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    useEffect(() => {
        if (mode === "edit" && initialData) {
            setCategoryName(initialData.category_name || "");

            setPreview(
                initialData.category_image
                    ? `${BASE_URL}/${initialData.category_image}`
                    : null
            );

            setSelectedFile(null);
        } else {
            setCategoryName("");
            setPreview(null);
            setSelectedFile(null);
        }
    }, [initialData, mode, show]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append("category_name", categoryName);

        if (selectedFile) {
            formData.append("category_image", selectedFile);
        }

        try {
            let response;
            if (mode === "edit") {
                response = await axiosMultipartInstance.put(`/categories/${initialData.id}/`, formData);
            } else {
                response = await axiosMultipartInstance.post(`/categories/`, formData);
            }

            if (response.data.success) {
                toast.success(mode === "edit" ? "Updated Successfully" : "Added Successfully");
                onSubmit(response.data.data);
                handleClose();
            }
        } catch {
            toast.error("Network Error");
        }
    };


    return (
        <Modal
            show={show}
            onHide={handleClose}
            centered
            backdrop="static"
            contentClassName="modal-zoom"
            className="service-form-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {/* NAME */}
                    <div className="form-group">
                        <label className="form-label">Service Name</label>
                        <input
                            type="text"
                            placeholder="Enter service name"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            required
                            className="form-input"
                        />

                    </div>

                    {/* IMAGE UPLOAD */}
                    <div className="form-group">
                        <label className="form-label">Upload Image (or) Icon</label>
                        <div className="file-upload">
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageChange}
                                className="form-input"
                                required={mode === "add"}
                            />

                            {!preview && (
                                <div
                                    className="custom-upload-area"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <span>Upload File (SVG, PNG) — 120×120</span>
                                </div>
                            )}

                            {preview && (
                                <div className="file-preview">
                                    <img src={preview} alt="Preview" className="image-preview" />
                                    <div className="file-details">
                                        <IoCloseCircleOutline onClick={handleRemoveFile} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" style={{ display: "none" }}></button>
                </form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="tertiary" size="lg" onClick={handleClose}>Cancel</Button>
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    // onClick={() => document.querySelector("form").requestSubmit()}
                    onClick={handleSubmit}
                >
                    {mode === "edit" ? "Update" : "Add"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CategoryFormModal;
