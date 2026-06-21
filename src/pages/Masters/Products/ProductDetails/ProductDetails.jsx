import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import MultiTabs from "@/components/MultiTabs/MultiTabs";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import BackButton from "@/components/BackButton/BackButton";
import PreLoader from "@/components/PreLoader/PreLoader";
import toast from "react-hot-toast";
import {
  fetchProductByIdApi,
  updateProductStatusApi,
  deleteProductApi,
} from "@/features/products/productApi";
import "./ProductDetails.scss";

const ProductDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetchProductByIdApi(id);
        if (response.success) {
          setProduct(response.data);
          setStatus(
            response.data.status === "active" || response.data.status === true,
          );
        } else {
          toast.error(response.message || "Failed to fetch product details");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to fetch product details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.checked;
    try {
      setStatusLoading(true);
      const response = await updateProductStatusApi(id, {
        status: newStatus ? "active" : "inactive",
      });
      if (response.success) {
        setStatus(newStatus);
        toast.success("Status updated successfully");
      } else {
        toast.error(response.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await deleteProductApi(id);
        if (response.success) {
          toast.success("Product deleted successfully");
          navigate("/masters/products");
        } else {
          toast.error(response.message || "Failed to delete product");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }
    }
  };

  if (loading) {
    return <PreLoader />;
  }

  if (!product) {
    return (
      <div className="product-details-page">
        <div className="card-container">
          <div className="product-title-row">
            <BackButton />
            <span>Product not found</span>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { label: "Description", path: "description" },
    { label: "Audit logs", path: "audit-logs" },
  ];

  return (
    <div className="product-details-page">
      <div className="product-details-header card-container">
        <div className="header-top">
          <div className="product-info">
            <div className="product-title-row">
              <BackButton />
              <h5>{product.name || product.productName}</h5>
            </div>
            <div className="product-meta">
              <span>Product code: {product.code || product.id}</span>
            </div>
          </div>

          <MoreIcon
            onEdit={() => navigate(`/masters/products/edit/${id}`)}
            onDelete={handleDelete}
          />
        </div>

        <div className="header-status">
          <label>Status:</label>
          <div className="status-toggle">
            <IOSSwitch
              checked={status}
              onChange={handleStatusChange}
              disabled={statusLoading}
              color="success"
            />
            <span className={status ? "active" : "inactive"}>
              {status ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="product-details-content mt-2">
        <MultiTabs tabs={tabs} baseDepth={4} />

        <div className="tab-panel-container mt-0">
          <Outlet context={{ product }} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;