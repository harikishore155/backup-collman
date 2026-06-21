import { Controller, useForm } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { useEffect, useState } from "react";
import PreLoader from "@/components/PreLoader/PreLoader";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import SelectInput from "@/components/SelectInput/SelectInput";
import toast from "react-hot-toast";
import { fetchClientsApi, fetchClientViewApi } from "@/features/clients/clientApi";
import {
  createProductApi,
  updateProductApi,
  fetchProductByIdApi,
} from "@/features/products/productApi";
import "./ProductForm.scss";

const resolveClientId = (raw) => {
  if (raw == null || raw === "") return "";
  if (typeof raw === "object") {
    return raw._id ?? raw.id ?? "";
  }
  return String(raw);
};

const extractClientRecord = (response) => {
  if (!response || typeof response !== "object") return null;
  const inner = response.data ?? response.client ?? response.result;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner;
  if (response._id || response.id) return response;
  return null;
};

const ProductForm = ({ mode = "create", onSubmit }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [clients, setClients] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      productName: "",
      selectClient: "",
      status: true,
      description: "",
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setFetchingData(true);

        // Step 1: Fetch clients list and product data in parallel
        const [clientsData, productData] = await Promise.all([
          fetchClientsApi(),
          (mode === "edit" || mode === "view") && id
            ? fetchProductByIdApi(id)
            : Promise.resolve(null),
        ]);

        // Step 2: Build active client options
        let clientOptions = [];
        if (clientsData?.success) {
          const rawList = clientsData.data ?? clientsData.clients ?? [];
          clientOptions = rawList.map((client) => ({
            label:
              client.bankName ??
              client.bank_name ??
              client.client_name ??
              client.clientName ??
              "",
            value: String(client._id || client.id).trim(),
          }));
        }

        // Step 3: Build form values
        let formValues = null;
        if (productData?.success) {
          const product = productData.data ?? productData;
          const clientField =
            product.selectClient ??
            product.client_id ??
            product.clientId ??
            product.client;

          const resolvedClientId = resolveClientId(clientField).trim();

          // Step 4: Check if the assigned client exists in active list
          let matchedOption =
            clientOptions.find((opt) => opt.value === resolvedClientId) ??
            clientOptions.find(
              (opt) =>
                opt.value.toLowerCase() === resolvedClientId.toLowerCase()
            );

          // Step 5: If not found, fetch the old/deleted client by ID
          if (!matchedOption && resolvedClientId) {
            try {
              const oldClientData = await fetchClientViewApi(resolvedClientId);
              const oldClient = extractClientRecord(oldClientData);

              if (oldClient) {
                const oldLabel =
                  oldClient.bankName ??
                  oldClient.bank_name ??
                  oldClient.client_name ??
                  oldClient.clientName ??
                  resolvedClientId;

                const oldOption = {
                  label: oldLabel,
                  value: resolvedClientId,
                };

                // Add old client to the top of the dropdown
                clientOptions = [oldOption, ...clientOptions];
                matchedOption = oldOption;
              }
            } catch (err) {
              // Old client truly doesn't exist — add a fallback label
              console.warn("Old client not found by ID:", resolvedClientId, err);
              const fallbackOption = {
                label: `Unknown Client (${resolvedClientId.slice(-6)})`,
                value: resolvedClientId,
              };
              clientOptions = [fallbackOption, ...clientOptions];
              matchedOption = fallbackOption;
            }
          }

          formValues = {
            productName: product.productName || product.name || "",
            selectClient: matchedOption ? matchedOption.value : resolvedClientId,
            status: product.status === "active" || product.status === true,
            description:
              product.description || product.product_description || "",
          };
        } else if (state?.product) {
          const p = { ...state.product };
          const fromState = p.selectClient ?? p.client_id ?? p.clientId;
          if (fromState !== undefined) {
            p.selectClient = resolveClientId(fromState);
          }
          formValues = p;
        }

        // Step 6: Set clients then defer reset + hide loader to next tick
        // so SelectInput mounts with options already available
        setClients(clientOptions);

        setTimeout(() => {
          if (formValues) reset(formValues);
          setFetchingData(false);
        }, 0);

      } catch (error) {
        console.error("Failed to load form data", error);
        toast.error("Failed to load necessary data");
        setFetchingData(false);
      }
    };

    loadData();
  }, [mode, id, state, reset]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleFormSubmit = async (data) => {
    if (onSubmit) {
      onSubmit(data);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...data,
        status: data.status ? "active" : "inactive",
      };

      let response;
      if (mode === "edit") {
        response = await updateProductApi(id, payload);
      } else {
        response = await createProductApi(payload);
      }

      if (response.success) {
        toast.success(
          mode === "edit"
            ? "Product updated successfully"
            : "Product created successfully",
        );
        navigate("/masters/products");
      } else {
        toast.error(response.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Form submission error", error);
      toast.error(error?.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const productDetailsFields = [
    {
      name: "productName",
      label: "Product Name",
      type: "text",
      placeholder: "Enter Product Name",
      required: true,
      col: 4,
    },
    {
      name: "selectClient",
      label: "Select Client",
      type: "select",
      placeholder: "Select Client",
      required: true,
      col: 4,
      options: clients,
    },
    { name: "status", label: "Status", type: "toggle", col: 4 },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description",
      required: true,
      col: 12,
    },
  ];

  if (fetchingData || loading) {
    return <PreLoader />;
  }

  const renderField = (
    field,
    { name, label, type, placeholder, required, options },
  ) => {
    switch (type) {
      case "toggle":
        return (
          <div className="toggle-wrapper">
            <IOSSwitch
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              disabled={mode === "view"}
            />
            <span className="toggle-status-label">
              {field.value ? "Active" : "Inactive"}
            </span>
          </div>
        );
      case "textarea":
        return (
          <textarea
            {...field}
            className="form-input"
            placeholder={placeholder}
            disabled={mode === "view"}
            rows={3}
          />
        );
      case "select":
        return (
          <SelectInput
            {...field}
            options={options}
            placeholder={placeholder}
            disabled={mode === "view"}
          />
        );
      default:
        return (
          <input
            {...field}
            type={type}
            className="form-input"
            placeholder={placeholder}
            disabled={mode === "view"}
          />
        );
    }
  };

  return (
    <section className="product-form-container">
      <div className="page-header-container">
        <div className="page-title-wrap">
          <div className="title-breadcrumb-group">
            <div className="title-with-back">
              <BackButton onClick={handleBack} />
              <h4 className="mb-0">
                {mode === "edit"
                  ? "Edit Product"
                  : mode === "view"
                    ? "View Product"
                    : "Create Product"}
              </h4>
            </div>
          </div>
        </div>

        <div className="page-header-actions">
          <Button variant="secondary" size="lg" onClick={handleBack}>
            Cancel
          </Button>

          <Button variant="primary" size="lg" type="submit" form="product-form">
            {mode === "edit" ? "Update" : "Save"}
          </Button>
        </div>
      </div>

      <form
        id="product-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="mt-4 product-form-content"
      >
        <h4>Enter Product Details</h4>
        <Row className="form-group">
          {productDetailsFields.map(
            ({ name, label, type, placeholder, required, options, col }) => (
              <Col xxl={col} xl={col} lg={col} key={name}>
                <div className="input-container">
                  <label className="form-label">
                    {label} {required && <span className="required">*</span>}
                  </label>
                  <Controller
                    name={name}
                    control={control}
                    rules={{
                      required: required ? `${label} is required` : false,
                    }}
                    render={({ field }) =>
                      renderField(field, {
                        name,
                        label,
                        type,
                        placeholder,
                        required,
                        options,
                      })
                    }
                  />
                  {errors[name] && (
                    <span className="error-message">
                      {errors[name]?.message}
                    </span>
                  )}
                </div>
              </Col>
            ),
          )}
        </Row>
      </form>
    </section>
  );
};

export default ProductForm;