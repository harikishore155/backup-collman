import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";
import PRODUCT_ENDPOINTS from "@/api/endpoints/productEndpoints";
import { fetchProductsApi } from "@/features/products/productApi";
import DataTable from "@/components/DataTable/DataTable";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import ListHeader from "@/components/ListHeader/ListHeader";
import PageHeader from "@/components/PageHeader/PageHeader";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import DeleteModal from "@/components/DeleteModal/DeleteModal";
import FilterBar from "@/components/FilterBar/FilterBar";
import { formatDisplayDate, toListStatus } from "@/utils/formatters";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import {
  applyAdvancedFilters,
  buildListQueryParams,
  matchesStatusFilters,
  normalizeListQueryFilters,
} from "@/utils/listFilterHelpers";
import {
  buildProductsFilterConfig,
  PRODUCT_FILTER_RULES,
} from "@/config/listFilterConfigs";
import "./ProductsList.scss";

const mapProductRow = (raw, index) => {
  const apiId = raw?._id ?? raw?.id ?? raw?.product_id ?? raw?.uuid ?? `row_${index}`;
  const displayId =
    raw?.code ??
    raw?.product_code ??
    raw?.productCode ??
    raw?.id ??
    raw?.product_id ??
    `row_${index}`;
  const code = raw?.code ?? raw?.product_code ?? raw?.productCode ?? "";
  const productName = raw?.productName ?? raw?.product_name ?? raw?.name ?? "";
  const name = productName;
  const description = raw?.description ?? raw?.product_description ?? "";
  const createdAt = formatDisplayDate(
    raw?.created_at ?? raw?.createdAt ?? raw?.created_on,
  );
  const modifiedAt = formatDisplayDate(
    raw?.updated_at ?? raw?.modified_at ?? raw?.modifiedAt,
  );
  const status = toListStatus(raw?.status ?? raw?.is_active ?? raw?.active);

  return {
    _id: String(apiId),
    id: String(displayId),
    code,
    productName,
    name,
    description,
    createdAt,
    modifiedAt,
    status,
  };
};

const ProductsList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setListLoading(true);

      const data = await fetchProductsApi(
        {
          ...buildListQueryParams({
            filterStatus,
            searchTerm,
            pageNo,
            rowsPerPage,
            withPagination: true,
          }),
          ...normalizeListQueryFilters(filters),
        },
      );

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to load products");
        setProducts([]);
        setTotalProducts(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setProducts(rows.map(mapProductRow));
      setTotalProducts(total);
    } catch (error) {
      console.error("Failed to fetch products", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load products";
      toast.error(typeof msg === "string" ? msg : "Failed to load products");
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm, pageNo, rowsPerPage, filters]);

  const columns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "id",
      title: "Product ID",
      render: (_, product) => (
        <span className="table-field-chip product">{product.id}</span>
      ),
    },
    {
      key: "productName",
      title: "Product Name",
      render: (_, product) => (
        <span className="table-field-chip product-name">{product.productName}</span>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (_, product) => (
        <span className="table-field-chip product-description">
          {product.description || "—"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_, product) => (
        <span className={`products-status-badge ${product.status.toLowerCase()}`}>
          {product.status}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (_, product) => (
        <MoreIcon
          onView={() => navigate(`view/${product._id}`)}
          onEdit={() => navigate(`edit/${product._id}`)}
          onDelete={() => handleDeleteClick(product._id)}
        />
      ),
    },
  ];

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesStatus = matchesStatusFilters(
        filterStatus,
        filters.status,
        product.status,
      );
      const matchesSearch =
        !normalizedSearch ||
        [product.id, product.productName, product.description].some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );
      const matchesAdvanced = applyAdvancedFilters(
        product,
        filters,
        PRODUCT_FILTER_RULES,
      );

      return matchesStatus && matchesSearch && matchesAdvanced;
    });
  }, [products, filterStatus, searchTerm, filters]);

  const totalCount = totalProducts;
  const paginatedProducts = filteredProducts
    .map((product, index) => ({
      ...product,
      sno: (pageNo - 1) * rowsPerPage + index + 1,
    }));

  const handleNavigate = () => {
    navigate("create");
  };

  const handleDeleteClick = (id) => {
    setSelectedProductId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await axiosInstance.delete(
        PRODUCT_ENDPOINTS.DELETE(selectedProductId),
      );

      if (response.data?.success) {
        toast.success(response.data?.message || "Product deleted successfully");
        fetchProducts();
      } else {
        toast.error(response.data?.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSelectedProductId(null);
    }
  };

  const filterConfig = useMemo(() => buildProductsFilterConfig(), []);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  return (
    <section className="products-page-container">
      <PageHeader
        title="Products"
        subtitle="View, search and manage all Product records"
        breadcrumbItems={[{ label: "Masters" }, { label: "Products" }]}
        createLabel="Create Product"
        onCreate={handleNavigate}
      />

      <ListHeader
        className="products-list-header"
        selectValue={filterStatus}
        selectOptions={[
          { value: "All", label: "All" },
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ]}
        onSelectChange={(value) => {
          setFilterStatus(value);
          setPageNo(1);
        }}
        searchValue={searchTerm}
        onSearchChange={(event) => {
          setSearchTerm(event.target.value);
          setPageNo(1);
        }}
        searchPlaceholder="Search..."
        onSearch={() => setPageNo(1)}
        onFiltersClick={(e) => setFilterAnchor(e.currentTarget)}
        filterLabel="Filters"
        showSearchButton={true}
      />

      <FilterBar
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        config={filterConfig}
        filters={filters}
        onApply={handleApplyFilters}
        showButton={false}
      />

      <DataTable
        wrapperClassName="products-table-wrap"
        className="products-table"
        columns={columns}
        data={paginatedProducts}
        loading={listLoading}
      />

      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleConfirmDelete}
        loading={deleteLoading}
      />

      <CustomPagination
        pageNo={pageNo}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPageNo}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPageNo(1);
        }}
      />

      <Outlet />
    </section>
  );
};

export default ProductsList;

