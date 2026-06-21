import { Controller, useForm } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { useEffect, useState } from "react";
import PreLoader from "@/components/PreLoader/PreLoader";
import SelectInput from "@/components/SelectInput/SelectInput";
import FilterDatePicker from "@/components/DatePicker/FilterDatePicker";
import axiosInstance from "@/utils/axiosInstance";
import CUSTOMER_ENDPOINTS from "@/api/endpoints/customerEndpoints";
import toast from "react-hot-toast";
import "./UpdateStatusForm.scss";

// ── Option Lists ──────────────────────────────────────────────────────────────
const misCodeOptions = [
  { label: "PTP", value: "PTP" },
  { label: "Paid", value: "Paid" },
];

const contactStatusOptions = [
  { label: "Contacted", value: "Contacted" },
  { label: "Uncontacted", value: "Uncontacted" },
];

const modeOfPaymentOptions = [
  { label: "Cash", value: "Cash" },
  { label: "Cheque", value: "Cheque" },
  { label: "NEFT", value: "NEFT" },
  { label: "UPI", value: "UPI" },
  { label: "Direct", value: "Direct" },
  { label: "Billdesk", value: "Billdesk" },
  { label: "Online", value: "Online" },
  { label: "AD", value: "AD" },
  { label: "ECS", value: "ECS" },
];

const paidTypeOptions = [
  { label: "EMI", value: "EMI" },
  { label: "SETT", value: "SETT" },
  { label: "PART", value: "PART" },
  { label: "PDC", value: "PDC" },
  { label: "Penalty", value: "Penalty" },
  { label: "TOS Paid", value: "TOS Paid" },
];

const paymentTypeOptions = [
  { label: "SLA", value: "SLA" },
  { label: "SPL IN", value: "SPL IN" },
  { label: "Customer", value: "Customer" },
  { label: "Others", value: "Others" },
];

const dispositionModeByOptions = [
  { label: "Team Member 1", value: "member_1" },
  { label: "Team Member 2", value: "member_2" },
  { label: "Team Member 3", value: "member_3" },
];

// ── Payload Builder ───────────────────────────────────────────────────────────
// Field names match the API body confirmed via Postman:
// { misCode, contactStatus, contactMode, paidDate, paidAmount, paidType }
const buildUpdatePayload = (formData, selectedType) => {
  if (selectedType === "PTP") {
    return {
      misCode: "PTP",
      contactStatus: formData.ptpContactStatus || undefined,
      contactMode: formData.ptpContactMode || undefined,
      paidDate: formData.ptpDate || undefined,
      paidAmount: formData.ptpAmount ? Number(formData.ptpAmount) : undefined,
      paidType: formData.ptpPaidType || undefined,
      remarks: formData.remarks || undefined,
    };
  }

  if (selectedType === "Paid") {
    return {
      misCode: "Paid",
      contactStatus: formData.paidContactStatus || undefined,
      contactMode: formData.paidContactMode || undefined,
      paidDate: formData.paidDate || undefined,
      paidAmount: formData.paidAmount ? Number(formData.paidAmount) : undefined,
      paidType: formData.modeOfPayment || undefined, // Mode of Payment → paidType per API
      receiptNumber: formData.receiptNumber || undefined,
      paymentType: formData.paymentType || undefined,
      dispositionModeBy: formData.dispositionModeBy || undefined,
      engagementType: formData.engagementType || undefined,
      paidContactNumber: formData.paidContactNumber || undefined,
      paidContactNumber2: formData.paidContactNumber2 || undefined,
      remarks: formData.remarks || undefined,
    };
  }

  // Fallback — only remarks
  return {
    remarks: formData.remarks || undefined,
  };
};

const amountNonNegativeRule = (label) => (val) => {
  const s = String(val ?? "").trim();
  if (!s) return true;
  const n = Number(s);
  return !Number.isNaN(n) && n >= 0
    ? true
    : `${label} must be a valid non-negative number`;
};

// ── Component ─────────────────────────────────────────────────────────────────
const UpdateStatusForm = ({ mode = "create" }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams(); // customer/case _id from the route

  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    shouldUnregister: true,
    defaultValues: {
      misCode: "",
      remarks: "",
      // PTP fields
      ptpContactStatus: "",
      ptpContactMode: "",
      ptpDate: "",
      ptpAmount: "",
      ptpPaidType: "",
      // Paid fields
      paidContactStatus: "",
      paidContactMode: "",
      paidDate: "",
      paidAmount: "",
      modeOfPayment: "",
      receiptNumber: "",
      paidType: "",
      paymentType: "",
      paidContactNumber: "",
      dispositionModeBy: "",
      engagementType: "",
      paidContactNumber2: "",
    },
  });

  // Pre-fill on edit / view
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && state?.data) {
      reset(state.data);
      if (state.data.misCode) setSelectedType(state.data.misCode);
    }
  }, [mode, state, reset]);

  const handleBack = () => navigate(-1);

  // ── Submit Handler ──────────────────────────────────────────────────────────
  const handleFormSubmit = async (formData) => {
    // Resolve the record id: prefer route param, fall back to location state
    const recordId = id ?? state?.data?._id ?? state?.data?.id;

    if (!recordId) {
      toast.error("Customer record not found");
      return;
    }

    const payload = buildUpdatePayload(formData, selectedType);

    setSubmitLoading(true);
    try {
      const response = await axiosInstance.put(
        CUSTOMER_ENDPOINTS.UPDATE(recordId),
        payload,
      );

      if (response.data?.success) {
        toast.success(response.data?.message || "Status updated successfully");
        navigate(-1);
      } else {
        toast.error(response.data?.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Update status error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update status";
      toast.error(typeof msg === "string" ? msg : "Failed to update status");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Field Configs ───────────────────────────────────────────────────────────
  const misCodeFields = [
    {
      name: "misCode",
      label: "Select MIS Code",
      type: "select",
      placeholder: "Select MIS Code",
      col: 4,
      options: misCodeOptions,
      onChange: (val) => {
        setSelectedType(val);
        setValue("misCode", val);
      },
      required: true,
    },
    {
      name: "remarks",
      label: "Remarks",
      type: "text",
      placeholder: "Enter Remarks",
      col: 8,
    },
  ];

  const ptpDetailsFields = [
    {
      name: "ptpContactStatus",
      label: "Contact Status",
      type: "select",
      placeholder: "Select Contact Status",
      col: 4,
      options: contactStatusOptions,
      required: true,
    },
    {
      name: "ptpContactMode",
      label: "Contact Mode",
      type: "text",
      placeholder: "Enter Contact Mode",
      col: 4,
      required: true,
    },
    {
      name: "ptpDate",
      label: "PTP Date",
      type: "date",
      col: 4,
      required: true,
    },
    {
      name: "ptpAmount",
      label: "PTP Amount",
      type: "text",
      placeholder: "Enter PTP Amount",
      col: 4,
      required: true,
      validate: amountNonNegativeRule("PTP Amount"),
    },
    {
      name: "ptpPaidType",
      label: "Paid Type",
      type: "select",
      placeholder: "Select Paid Type",
      col: 4,
      options: modeOfPaymentOptions, // Cash, Cheque, etc. — maps to paidType in API
      required: true,
    },
  ];

  const paidDetailsFields = [
    {
      name: "paidContactStatus",
      label: "Contact Status",
      type: "select",
      placeholder: "Select Contact Status",
      col: 4,
      options: contactStatusOptions,
      required: true,
    },
    {
      name: "paidContactMode",
      label: "Contact Mode",
      type: "text",
      placeholder: "Enter Contact Mode",
      col: 4,
      required: true,
    },
    {
      name: "paidDate",
      label: "Paid Date",
      type: "date",
      col: 4,
      required: true,
    },
    {
      name: "paidAmount",
      label: "Paid Amount",
      type: "text",
      placeholder: "Enter Paid Amount",
      col: 4,
      required: true,
      validate: amountNonNegativeRule("Paid Amount"),
    },
    {
      name: "modeOfPayment",
      label: "Mode of Payment",
      type: "select",
      placeholder: "Select Mode of Payment",
      col: 4,
      options: modeOfPaymentOptions,
      required: true,
    },
    {
      name: "receiptNumber",
      label: "Receipt Number",
      type: "text",
      placeholder: "Enter Receipt Number",
      col: 4,
      required: true,
    },
    {
      name: "paidType",
      label: "Paid Type",
      type: "select",
      placeholder: "Select Paid Type",
      col: 4,
      options: paidTypeOptions,
      required: true,
    },
    {
      name: "paymentType",
      label: "Payment Type",
      type: "select",
      placeholder: "Select Payment Type",
      col: 4,
      options: paymentTypeOptions,
      required: true,
    },
    {
      name: "paidContactNumber",
      label: "Paid Contact Number",
      type: "tel",
      placeholder: "Enter Paid Contact Number",
      col: 4,
      required: true,
      validate: (val) =>
        !val || /^[6-9]\d*$/.test(val)
          ? true
          : "Contact number must start with 6, 7, 8, or 9",
    },
    {
      name: "dispositionModeBy",
      label: "Disposition Made By",
      type: "select",
      placeholder: "Select Disposition Mode",
      col: 4,
      options: dispositionModeByOptions,
      required: true,
    },
    {
      name: "engagementType",
      label: "Engagement Type",
      type: "checkbox-group",
      col: 4,
      required: true,
    },
    {
      name: "paidContactNumber2",
      label: "Paid Contact Number 2",
      type: "tel",
      placeholder: "Enter Paid Contact Number",
      col: 4,
      validate: (val) =>
        !val || /^[6-9]\d*$/.test(val)
          ? true
          : "Contact number must start with 6, 7, 8, or 9",
    },
  ];

  // ── Field Renderer ──────────────────────────────────────────────────────────
  const renderField = (field, fieldConfig) => {
    const { type, placeholder, options, onChange } = fieldConfig;

    switch (type) {
      case "select":
        return (
          <SelectInput
            {...field}
            options={options || []}
            placeholder={placeholder}
            disabled={mode === "view"}
            onChange={(val) => {
              field.onChange(val);
              onChange?.(val);
            }}
          />
        );
      case "date":
        return <FilterDatePicker {...field} disabled={mode === "view"} />;
      case "checkbox-group":
        return (
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={field.value === "retain"}
                onChange={() => field.onChange("retain")}
                disabled={mode === "view"}
              />
              <span className="checkbox-option">Retain</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={field.value === "non-retain"}
                onChange={() => field.onChange("non-retain")}
                disabled={mode === "view"}
              />
              <span className="checkbox-option">Non - Retain</span>
            </label>
          </div>
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

  const getFieldRules = (fieldConfig) => ({
    required: fieldConfig.required
      ? `${fieldConfig.label} is required`
      : false,
    validate: fieldConfig.validate,
  });

  const renderFieldGroup = (fields) =>
    fields.map((fieldConfig) => (
      <Col
        xxl={fieldConfig.col}
        xl={fieldConfig.col}
        lg={fieldConfig.col}
        key={fieldConfig.name}
      >
        <div className="input-container">
          <label className="form-label">
            {fieldConfig.label}
            {fieldConfig.required && <span className="required">*</span>}
          </label>
          <Controller
            name={fieldConfig.name}
            control={control}
            rules={getFieldRules(fieldConfig)}
            render={({ field }) => renderField(field, fieldConfig)}
          />
          {errors[fieldConfig.name] && (
            <span className="error-message">
              {errors[fieldConfig.name]?.message}
            </span>
          )}
        </div>
      </Col>
    ));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section className="update-status-form-container">
      <div className="page-header-container">
        <div className="page-title-wrap">
          <div className="title-breadcrumb-group">
            <div className="title-with-back">
              <BackButton onClick={handleBack} />
              <h4 className="mb-0">Update Status</h4>
            </div>
          </div>
        </div>
        <div className="page-header-actions">
          <Button variant="secondary" size="lg" onClick={handleBack}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            type="submit"
            form="update-status-form"
            disabled={submitLoading}
          >
            {submitLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <form
        id="update-status-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="mt-4 update-status-form-content"
      >
        {/* MIS Code Section */}
        <div className="form-section">
          <h4>MIS Code</h4>
          <Row className="form-group">{renderFieldGroup(misCodeFields)}</Row>
        </div>

        {/* PTP Details Section */}
        {selectedType === "PTP" && (
          <div className="form-section">
            <h4>PTP Details</h4>
            <Row className="form-group">
              {renderFieldGroup(ptpDetailsFields)}
            </Row>
          </div>
        )}

        {/* Paid Details Section */}
        {selectedType === "Paid" && (
          <div className="form-section">
            <h4>Paid Details</h4>
            <Row className="form-group">
              {renderFieldGroup(paidDetailsFields)}
            </Row>
          </div>
        )}
      </form>
    </section>
  );
};

export default UpdateStatusForm;
