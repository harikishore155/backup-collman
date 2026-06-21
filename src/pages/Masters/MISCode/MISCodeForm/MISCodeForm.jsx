import { Controller, useForm } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { useEffect, useState, useCallback } from "react";
import PreLoader from "@/components/PreLoader/PreLoader";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import SelectInput from "@/components/SelectInput/SelectInput";
import {
  createMisCodeApi,
  updateMisCodeApi,
  fetchMisCodeByIdApi,
} from "@/features/misCodes/misCodeApi";
import { fetchClientsApi } from "@/features/clients/clientApi";
import { extractListPayload } from "@/utils/apiHelpers";
import toast from "react-hot-toast";
import "./MISCodeForm.scss";

const normalizeMisCodeForForm = (mis) => {
  if (!mis || typeof mis !== "object") return null;

  const statusRaw = mis.status ?? mis.is_active ?? mis.isActive;
  const statusBool =
    typeof statusRaw === "boolean"
      ? statusRaw
      : String(statusRaw).toLowerCase() === "active";

  // ← FIX: extract _id string from clientId if it's an object
  const clientRaw = mis.clientId ?? mis.client_id ?? "";
  const clientId =
    clientRaw && typeof clientRaw === "object"
      ? String(clientRaw._id ?? clientRaw.id ?? "")
      : String(clientRaw ?? "");

  return {
    clientId,
    misCode: mis.misCode ?? mis.mis_code ?? "",
    description: mis.description ?? "",
    status: statusBool,
  };
};

const pickMisRecordFromBody = (body) => {
  if (!body || typeof body !== "object") return null;
  const inner = body.data ?? body.misCode ?? body.mis_code ?? body.result;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner;
  if (body._id || body.id) return body;
  return null;
};

const MISCodeForm = ({ mode = "create", onSubmit }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { _id } = useParams();

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientOptions, setClientOptions] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientId: "",
        misCode: "",   
      description: "",
      status: true,
    },
  });

  const loadMisCodeById = useCallback(
    async (mongo_id) => {
      if (!mongo_id) {
        toast.error("MIS Code not found");
        return;
      }

      setLoading(true);
      try {
        const data = await fetchMisCodeByIdApi(mongo_id);
        if (data?.success === false) {
          toast.error(data?.message || "Failed to load MIS Code");
          return;
        }
        const record = pickMisRecordFromBody(data);
        const normalized = normalizeMisCodeForForm(record);
        if (normalized) {
          reset(normalized);
        } else {
          toast.error(data?.message || "Failed to load MIS Code");
        }
      } catch (error) {
        console.error("Load MIS Code error:", error);
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load MIS Code";
        toast.error(typeof msg === "string" ? msg : "Failed to load MIS Code");
      } finally {
        setLoading(false);
      }
    },
    [reset],
  );

  useEffect(() => {
    if (mode !== "edit" && mode !== "view") return;

    if (_id) {
      queueMicrotask(() => {
        void loadMisCodeById(_id);
      });
      return;
    }

    const fromState = normalizeMisCodeForForm(state?.misCode);
    if (fromState) {
      reset(fromState);
    }
  }, [mode, _id, state?.misCode, reset, loadMisCodeById]);

  useEffect(() => {
    let cancelled = false;

    const loadClients = async () => {
      setClientsLoading(true);
      try {
        const data = await fetchClientsApi();
        if (cancelled) return;
        if (data?.success === false) {
          toast.error(data?.message || "Failed to load clients");
          setClientOptions([]);
          return;
        }
        const { rows } = extractListPayload(data);
        setClientOptions(
          rows
            .map((client, index) => {
              const value = String(client._id ?? client.id ?? "");
              const label =
                (client.bankName ??
                  client.bank_name ??
                  client.client_name ??
                  client.clientName ??
                  client.name ??
                  value) ||
                `Client ${index + 1}`;
              return { label, value };
            })
            .filter((o) => o.value),
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Load clients error:", error);
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load clients";
        toast.error(typeof msg === "string" ? msg : "Failed to load clients");
        setClientOptions([]);
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    };

    void loadClients();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBack = () => navigate(-1);

  const buildPayload = (formData) => {
    const { clientId,misCode, description, status } = formData;
    return {
      clientId,
       misCode,
      description,
      status: status ? "active" : "inactive",
    };
  };

  const handleCreate = async (formData) => {
    setSubmitLoading(true);
    try {
      const payload = buildPayload(formData);
      const data = await createMisCodeApi(payload);
      if (data?.success) {
        toast.success(data.message || "MIS Code created successfully");
        if (typeof onSubmit === "function") onSubmit(data);
        else navigate(-1);
      } else {
        toast.error(data?.message || "Failed to create MIS Code");
      }
    } catch (error) {
      console.error("Create MIS Code error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create MIS Code";
      toast.error(typeof msg === "string" ? msg : "Failed to create MIS Code");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    const doc_id = _id ?? state?.misCode?._id ?? state?.misCode?.id;
    if (!doc_id) {
      toast.error("MIS Code not found");
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = buildPayload(formData);
      const data = await updateMisCodeApi(doc_id, payload);
      if (data?.success) {
        toast.success(data.message || "MIS Code updated successfully");
        if (typeof onSubmit === "function") onSubmit(data);
        else navigate(-1);
      } else {
        toast.error(data?.message || "Failed to update MIS Code");
      }
    } catch (error) {
      console.error("Edit MIS Code error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update MIS Code";
      toast.error(typeof msg === "string" ? msg : "Failed to update MIS Code");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFormSubmit = (formData) => {
    if (mode === "edit") handleEdit(formData);
    else handleCreate(formData);
  };

  const misCodeFields = [
    {
      name: "clientId",
      label: "Client",
      type: "select",
      placeholder: "Select client",
      required: true,
      col: 4,
      options: clientOptions,
    },
    {
      name: "misCode",
      label: "MIS Code",
      placeholder: "Enter MIS Code",
      required: true,
      col: 4,
    },
    {
      name: "status",
      label: "Status",
      type: "toggle",
      col: 4,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description",
      required: true,
      col: 12,
    },
  ];

  const renderField = (field, { type, placeholder, options }) => {
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

      case "select":
        return (
          <SelectInput
            value={typeof field.value === "object"
              ? (field.value?._id ?? field.value?.id ?? "")  // ← safety net
              : field.value ?? ""}
            options={options}
            placeholder={placeholder}
            onChange={(val) => field.onChange(val)}
            disabled={mode === "view"}
          />
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

  if (loading || clientsLoading) {
    return <PreLoader />;
  }

  return (
    <section className="mis-code-form-container">
      <div className="page-header-container">
        <div className="page-title-wrap">
          <div className="title-breadcrumb-group">
            <div className="title-with-back">
              <BackButton onClick={handleBack} />
              <h4 className="mb-0">
                {mode === "edit"
                  ? "Edit MIS Code"
                  : mode === "view"
                    ? "View MIS Code"
                    : "Create MIS Code"}
              </h4>
            </div>
          </div>
        </div>

        <div className="page-header-actions">
          <Button variant="secondary" size="lg" onClick={handleBack}>
            Cancel
          </Button>

          {mode !== "view" && (
            <Button
              variant="primary"
              size="lg"
              type="submit"
              form="mis-code-form"
              disabled={submitLoading}
            >
              {submitLoading
                ? "Saving..."
                : mode === "edit"
                  ? "Update"
                  : "Save"}
            </Button>
          )}
        </div>
      </div>

      <form
        id="mis-code-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="mt-4 mis-code-form-content"
      >
        <h4>Enter MIS Details</h4>
        <Row className="form-group">
          {misCodeFields.map(
            ({ name, label, type, placeholder, required, options, col }) => (
              <Col xxl={col} xl={col} lg={col} key={name}>
                <div className="input-container">
                  <label className="form-label">
                    {label}{required && <span className="required">*</span>}
                  </label>
                  <Controller
                    name={name}
                    control={control}
                    rules={{
                      required: required ? `${label} is required` : false,
                    }}
                    render={({ field }) =>
                      renderField(field, { name, label, type, placeholder, options })
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

export default MISCodeForm;
