import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { TbTrash } from "react-icons/tb";
import { AiOutlineEdit } from "react-icons/ai";
import toast from "react-hot-toast";
import CategoryIcon from "@/assets/images/admin/settings/category.svg?react";
import CategoryFormModal from "./CategoryFormModal";
import "./CategoriesModal.scss";
import axiosInstance from "@/utils/axiosInstance";

const CategoriesModal = ({ show, handleClose }) => {
    const [modalMode, setModalMode] = useState("add");
    const [showFormModal, setShowFormModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);

    const fetchCategories = async () => {
        try {
            const res = await axiosInstance.get("/categories/");
            if (res.data.success) {
                setCategories(res.data.data);
            }

        }
        catch {
            toast.error("Failed to load categories");
        }
    };

    useEffect(() => {
        if (show) fetchCategories();
    }, [show]);


    const handleAddShow = () => {
        setModalMode("add");
        setSelectedCategory(null);
        setShowFormModal(true);
        handleClose();
    };

    const handleEditShow = (category) => {
        setModalMode("edit");
        setSelectedCategory(category);
        setShowFormModal(true);
        handleClose();
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        fetchCategories();
    }


    const handleFormSubmit = (formData) => {
        if (modalMode === "add") {
            setCategories([
                ...categories,
                { id: Date.now(), ...formData },
            ]);
        } else {
            setCategories(
                categories.map((cat) =>
                    cat.id === selectedCategory.id
                        ? { ...cat, ...formData }
                        : cat
                )
            );
        }
        handleFormClose();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category?"))
            return;

        try {
            await axiosInstance.delete(`/categories/${id}/`);
            fetchCategories();
        } catch {
            toast.error("Failed to delete category");
        }
    };


    return (
        <>
            <Modal show={show}
                onHide={handleClose}
                centered
                backdrop="static"
                contentClassName="modal-zoom"
                className="categories-modal">

                <Modal.Header closeButton>
                    <Modal.Title>Service Categories</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="modal-top">
                        <h5>Service List</h5>
                        <Button variant="primary" size="lg" onClick={handleAddShow}>Add New</Button>
                    </div>
                    <div className="category-scroll-container">
                        {categories.map((category) => (
                            <div className="category-list" key={category._id ?? category.id}>
                                <div className="category-item">
                                    <CategoryIcon />
                                    <p className="category-name">{category.category_name}</p>
                                </div>

                                <div className="category-actions">
                                    <span className="edit-icon" onClick={() => handleEditShow(category)}>
                                        <AiOutlineEdit />
                                    </span>

                                    <span className="delete-icon" onClick={() => handleDelete(category._id ?? category.id)}>
                                        <TbTrash />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>


                </Modal.Body>
            </Modal>

            <CategoryFormModal
                show={showFormModal}
                handleClose={handleFormClose}
                mode={modalMode}
                initialData={
                    selectedCategory || { category_name: "", category_image: "" }
                }
                onSubmit={handleFormSubmit}
            />
        </>
    )
}

export default CategoriesModal
