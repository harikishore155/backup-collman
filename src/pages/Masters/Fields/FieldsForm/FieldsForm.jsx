import { Controller, useForm, useFieldArray } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { useEffect, useState, useCallback } from "react";
import PreLoader from "@/components/PreLoader/PreLoader";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import toast from "react-hot-toast";
import {
  createFieldApi,
  updateFieldApi,
  fetchFieldByIdApi,
} from "@/features/fields/fieldApi";
import "./FieldsForm.scss";

const INPUT_SLOTS = 10;

const emptyAllowInputs = () =>
  Array.from({ length: INPUT_SLOTS }, () => ({ name: "" }));

const normalizeFieldForForm = (record) => {
  if (!record || typeof record !== "object") return null;
  const statusRaw = record.status ?? record.is_active ?? record.isActive;
  const statusBool =
    typeof statusRaw === "boolean"
      ? statusRaw
      : String(statusRaw).toLowerCase() === "active";
  const name =
    record.fieldName ?? record.field_name ?? record.fieldsName ?? record.name ?? "";
  const inputsRaw = record.inputs;
  const names = Array.isArray(inputsRaw)
    ? inputsRaw.map((x) =>
        typeof x === "string" ? x : (x?.name != null ? String(x.name) : ""),
      )
    : [];
  const allowInputs = emptyAllowInputs();
  names.slice(0, INPUT_SLOTS).forEach((n, i) => {
    allowInputs[i] = { name: n };
  });
  return {
    fieldsName: name ? String(name) : "",
    status: statusBool,
    allowInputs,
  };
};

const pickFieldRecordFromBody = (body) => {
  if (!body || typeof body !== "object") return null;
  const inner = body.data ?? body.field ?? body.result;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner;
  if (body._id || body.id) return body;
  return null;
};

const FieldsForm = ({ mode = "create", onSubmit }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fieldsName: "",
      status: true,
      allowInputs: emptyAllowInputs(),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "allowInputs",
  });

  const loadFieldById = useCallback(
    async (fieldId) => {
      if (!fieldId) {
        toast.error("Field not found");
        return;
      }

      setLoading(true);
      try {
        const data = await fetchFieldByIdApi(fieldId);
        if (data?.success === false) {
          toast.error(data?.message || "Failed to load field");
          return;
        }
        const record = pickFieldRecordFromBody(data);
        const normalized = normalizeFieldForForm(record);
        if (normalized) {
          reset(normalized);
        } else {
          toast.error(data?.message || "Failed to load field");
        }
      } catch (error) {
        console.error("Load field error:", error);
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load field";
        toast.error(typeof msg === "string" ? msg : "Failed to load field");
      } finally {
        setLoading(false);
      }
    },
    [reset],
  );

  useEffect(() => {
    if (mode !== "edit" && mode !== "view") return;

    if (id) {
      queueMicrotask(() => {
        void loadFieldById(id);
      });
      return;
    }

    const fromState = normalizeFieldForForm(state?.field);
    if (fromState) {
      reset(fromState);
    }
  }, [mode, id, state?.field, reset, loadFieldById]);

  const handleBack = () => {
    navigate(-1);
  };

  const buildPayload = (formData) => {
    const inputs = (formData.allowInputs ?? [])
      .map((row) => String(row?.name ?? "").trim())
      .filter(Boolean);

    return {
      fieldName: String(formData.fieldsName ?? "").trim(),
      status: formData.status ? "active" : "inactive",
      inputs,
    };
  };

  const handleCreate = async (formData) => {
    setSubmitLoading(true);
    try {
      const payload = buildPayload(formData);
      const data = await createFieldApi(payload);

      if (data?.success) {
        toast.success(data.message || "Field created successfully");
        if (typeof onSubmit === "function") {
          onSubmit(data);
        } else {
          navigate("/masters/fields");
        }
      } else {
        toast.error(data?.message || "Failed to create field");
      }
    } catch (error) {
      console.error("Create field error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create field";
      toast.error(typeof msg === "string" ? msg : "Failed to create field");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    const docId = id ?? state?.field?._id ?? state?.field?.id;

    if (!docId) {
      toast.error("Field not found");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = buildPayload(formData);
      const data = await updateFieldApi(docId, payload);

      if (data?.success) {
        toast.success(data.message || "Field updated successfully");
        if (typeof onSubmit === "function") {
          onSubmit(data);
        } else {
          navigate("/masters/fields");
        }
      } else {
        toast.error(data?.message || "Failed to update field");
      }
    } catch (error) {
      console.error("Update field error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update field";
      toast.error(typeof msg === "string" ? msg : "Failed to update field");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFormSubmit = (formData) => {
    if (mode === "view") return;
    if (mode === "edit") {
      void handleEdit(formData);
    } else {
      void handleCreate(formData);
    }
  };

  if (loading) {
    return <PreLoader />;
  }

  return (
    <section className="fields-form-container">
      <div className="page-header-container">
        <div className="page-title-wrap">
          <div className="title-breadcrumb-group">
            <div className="title-with-back">
              <BackButton onClick={handleBack} />
              <h4 className="mb-0">
                {mode === "edit"
                  ? "Edit Fields"
                  : mode === "view"
                    ? "View Fields"
                    : "Create Fields"}
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
              form="fields-form"
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
        id="fields-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="mt-4 fields-form-content"
      >
        <div className="form-section">
          <h4>Fields</h4>
          <Row className="form-group">
            <Col xxl={4} xl={4} lg={4}>
              <div className="input-container">
                <label className="form-label">
                  Fields Name <span className="required">*</span>
                </label>
                <Controller
                  name="fieldsName"
                  control={control}
                  rules={{ required: "Fields Name is required" }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="form-input"
                      placeholder="Enter Fields name"
                      disabled={mode === "view"}
                    />
                  )}
                />
                {errors.fieldsName && (
                  <span className="error-message">
                    {errors.fieldsName.message}
                  </span>
                )}
              </div>
            </Col>
            <Col xxl={4} xl={4} lg={4}>
              <div className="input-container">
                <label className="form-label">Status</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
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
                  )}
                />
              </div>
            </Col>
          </Row>
        </div>

        <div className="form-section mt-4">
          <h4>Allow inputs</h4>
          <div className="form-group">
            {fields.map((item, index) => (
              <Row key={item.id} className="mb-3">
                <Col xxl={4} xl={4} lg={4}>
                  <div className="input-container">
                    <label className="form-label">Name</label>
                    <Controller
                      name={`allowInputs.${index}.name`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="form-input"
                          placeholder="Enter name"
                          disabled={mode === "view"}
                        />
                      )}
                    />
                  </div>
                </Col>
              </Row>
            ))}
          </div>
        </div>
      </form>
    </section>
  );
};

export default FieldsForm;
