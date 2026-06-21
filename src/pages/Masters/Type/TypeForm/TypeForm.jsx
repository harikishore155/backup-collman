import { Controller, useForm } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useLocation } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { useEffect, useState } from "react";
import PreLoader from "@/components/PreLoader/PreLoader";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import FilterDatePicker from "@/components/DatePicker/FilterDatePicker";
import { createTypeApi, updateTypeApi } from "@/features/types/typeApi";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import "./TypeForm.scss";
import SelectInput from "@/components/SelectInput/SelectInput";

const TYPE_CATEGORY_OPTIONS = [
  { label: "BKT", value: "BKT" },
  { label: "REC", value: "REC" },
];

const TypeForm = ({ mode = "create", onSubmit }) => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      typeName: "",
      typeCategory: "",
      allocationDeadlineDate: "",
      status: true,
      description: "",
    },
  });

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && state?.type) {
      reset(state.type);
    }
  }, [mode, state, reset]);

  const handleBack = () => {
    navigate(-1);
  };

  // ── Build payload matching Postman body ───────────────────────────────────
  const buildPayload = (formData) => {
    const {
      typeName,
      typeCategory,
      allocationDeadlineDate,
      status,
      description,
    } = formData;

    // Normalise date → "YYYY-MM-DD"
    let allocationCreationDeadline = "";
    if (allocationDeadlineDate) {
      const parsed = dayjs(allocationDeadlineDate);
      allocationCreationDeadline = parsed.isValid()
        ? parsed.format("YYYY-MM-DD")
        : allocationDeadlineDate;
    }

    return {
      typeName,
      typeCategory,
      allocationCreationDeadline,
      description,
      status: status ? "active" : "inactive",
    };
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    setSubmitLoading(true);
    try {
      const payload = buildPayload(formData);
      const data = await createTypeApi(payload);

      if (data?.success) {
        toast.success(data.message || "Type created successfully");
        if (typeof onSubmit === "function") {
          onSubmit(data);
        } else {
          navigate(-1);
        }
      } else {
        toast.error(data?.message || "Failed to create type");
      }
    } catch (error) {
      console.error("Create type error:", error);
      console.error("Server error response:", error?.response?.data);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create type";
      toast.error(typeof msg === "string" ? msg : "Failed to create type");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = async (formData) => {
    const typeId = state?.type?._id ?? state?.type?.id ?? state?.type?.typeId;

    if (!typeId) {
      toast.error("Type ID not found");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = buildPayload(formData);
      const data = await updateTypeApi(typeId, payload);

      if (data?.success) {
        toast.success(data.message || "Type updated successfully");
        if (typeof onSubmit === "function") {
          onSubmit(data);
        } else {
          navigate(-1);
        }
      } else {
        toast.error(data?.message || "Failed to update type");
      }
    } catch (error) {
      console.error("Edit type error:", error);
      console.error("Server error response:", error?.response?.data);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update type";
      toast.error(typeof msg === "string" ? msg : "Failed to update type");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFormSubmit = (formData) => {
    if (mode === "edit") {
      handleEdit(formData);
    } else {
      handleCreate(formData);
    }
  };

  // ── Field renderer ────────────────────────────────────────────────────────
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

      case "dropdown":
        return (
          <SelectInput
            value={field.value}
            options={options}
            placeholder={placeholder}
            onChange={(val) => field.onChange(val)}
            disabled={mode === "view"}
          />
        );

      case "date":
        return (
          <FilterDatePicker
            {...field}
            placeholder={placeholder}
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

  const typeFields = [
    {
      name: "typeName",
      label: "Type Name",
      type: "text",
      placeholder: "Enter Type name",
      required: true,
      col: 4,
    },
    {
      name: "typeCategory",
      label: "Type Category",
      type: "dropdown",
      placeholder: "Select Category",
      options: TYPE_CATEGORY_OPTIONS,
      required: true,
      col: 4,
    },
    {
      name: "allocationDeadlineDate",
      label: "Allocation Deadline Date",
      type: "date",
      placeholder: "Select Date",
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

  if (loading) {
    return <PreLoader />;
  }

  return (
    <section className="type-form-container">
      {/* ── Page header ── */}
      <div className="page-header-container">
        <div className="page-title-wrap">
          <div className="title-breadcrumb-group">
            <div className="title-with-back">
              <BackButton onClick={handleBack} />
              <h4 className="mb-0">
                {mode === "edit"
                  ? "Edit Type"
                  : mode === "view"
                    ? "View Type"
                    : "Create Type"}
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
              form="type-form"
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

      {/* ── Form ── */}
      <form
        id="type-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="mt-4 type-form-content"
      >
        <h4>Enter Type Details</h4>
        <Row className="form-group">
          {typeFields.map(
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

export default TypeForm;
