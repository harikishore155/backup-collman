import { Controller, useForm } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useLocation } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { useEffect, useState } from "react";
import PreLoader from "@/components/PreLoader/PreLoader";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import SelectInput from "@/components/SelectInput/SelectInput";
import "./IncentiveForm.scss";

const IncentiveForm = ({ mode = "create", onSubmit }) => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      location: "",
      salaryType: "",
      employeeId: "",
      name: "",
      md: "",
      asstManager: "",
      tl: "",
      designation: "",
      month: "",
      bankName: "",
      dpd1: "",
      dpd2: "",
      basic: "",
      collection: "",
      percentage: "",
      incentive: "",
      specialIncentive: "",
      ta: "",
      oos: "",
      alreadyPaid: "",
      legal: "",
      dra: "",
      pv: "",
      advancePenalty: "",
      netPay: "",
      target1: "",
      tlCollection1: "",
      target2: "",
      tlCollection2: "",
      resPercentage: "",
      remarks: "",
      taMarks: "",
      status: true,
    },
  });

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && state?.incentive) {
      reset(state.incentive);
    }
  }, [mode, state, reset]);

  const handleBack = () => {
    navigate(-1);
  };

  const employeeDetailsFields = [
    { name: "location", label: "Location", type: "text", placeholder: "Enter Location", col: 4 },
    { name: "salaryType", label: "Salary Type", type: "text", placeholder: "Enter Salary Type", col: 4 },
    { name: "employeeId", label: "EMP ID", type: "select", placeholder: "Select EMP ID", col: 4 },
    { name: "name", label: "Name", type: "text", placeholder: "Enter Name", col: 4 },
    { name: "md", label: "MD", type: "select", placeholder: "Select MD", col: 4 },
    { name: "asstManager", label: "Asst Manager", type: "select", placeholder: "Select Asst Manager", col: 4 },
    { name: "tl", label: "TL", type: "text", placeholder: "Enter TL", col: 4 },
    { name: "designation", label: "Designation", type: "select", placeholder: "Select Designation", col: 4 },
    { name: "month", label: "Month", type: "select", placeholder: "Select Month", col: 4 },
  ];

  const bankDetailsFields = [
    { name: "bankName", label: "Bank Name", type: "select", placeholder: "Select Bank Name", col: 4 },
    { name: "dpd1", label: "DPD", type: "select", placeholder: "Select DPD", col: 4 },
    { name: "dpd2", label: "DPD", type: "select", placeholder: "Select DPD", col: 4 },
    { name: "basic", label: "Basic", type: "select", placeholder: "Select Basic", col: 4 },
    { name: "collection", label: "Collection", type: "select", placeholder: "Select Collection", col: 4 },
    { name: "percentage", label: "%", type: "select", placeholder: "Select %", col: 4 },
    { name: "incentive", label: "Incentive", type: "select", placeholder: "Select Incentive", col: 4 },
    { name: "specialIncentive", label: "Special Incentive", type: "select", placeholder: "Select Special Incentive", col: 4 },
    { name: "ta", label: "TA", type: "select", placeholder: "Select TA", col: 4 },
    { name: "oos", label: "OOS", type: "select", placeholder: "Select OOS", col: 4 },
    { name: "alreadyPaid", label: "Already Paid", type: "select", placeholder: "Select Already Paid", col: 4 },
    { name: "legal", label: "Legal", type: "select", placeholder: "Select Legal", col: 4 },
    { name: "dra", label: "DRA", type: "select", placeholder: "Select DRA", col: 4 },
    { name: "pv", label: "PV", type: "select", placeholder: "Select PV", col: 4 },
    { name: "advancePenalty", label: "Advance/Penalty", type: "select", placeholder: "Select Advance/Penalty", col: 4 },
    { name: "netPay", label: "Net Pay", type: "select", placeholder: "Select Net Pay", col: 4 },
    { name: "target1", label: "Target", type: "select", placeholder: "Select Target", col: 4 },
    { name: "tlCollection1", label: "TL Collection", type: "select", placeholder: "Select TL Collection", col: 4 },
    { name: "target2", label: "Target", type: "select", placeholder: "Select Target", col: 4 },
    { name: "tlCollection2", label: "TL Collection", type: "select", placeholder: "Select TL Collection", col: 4 },
    { name: "resPercentage", label: "RES%", type: "select", placeholder: "Select RES%", col: 4 },
    { name: "remarks", label: "Remarks", type: "select", placeholder: "Select Remarks", col: 4 },
    { name: "taMarks", label: "TA Marks", type: "select", placeholder: "Select TA Marks", col: 4 },
  ];

  if (loading) {
    return <PreLoader />;
  }

  const renderField = (field, { name, label, type, placeholder, required, options }) => {
    switch (type) {
      case "toggle":
        return (
          <div className="toggle-wrapper">
            <IOSSwitch
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              disabled={mode === "view"}
            />
            <span className="toggle-status-label">{field.value ? "Active" : "Inactive"}</span>
          </div>
        );
      case "select":
        return (
          <SelectInput
            {...field}
            options={options || []}
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
    <section className="incentive-form-container">
      <div className="page-header-container">
        <div className="page-title-wrap">
          <div className="title-breadcrumb-group">
            <div className="title-with-back">
              <BackButton onClick={handleBack} />
              <h4 className="mb-0">
                Incentive
              </h4>
            </div>
            <div className="breadcrumb-text">
                Home / Incentive / {mode === "edit" ? "Edit" : mode === "view" ? "View" : "Edit"}
            </div>
          </div>
        </div>

        <div className="page-header-actions">
          <Button variant="secondary" size="lg" onClick={handleBack}>
            Cancel
          </Button>

          <Button variant="primary" size="lg" type="submit" form="incentive-form">
            {mode === "edit" ? "Update" : "Save"}
          </Button>
        </div>
      </div>

      <form id="incentive-form" onSubmit={handleSubmit((data) => onSubmit?.(data, false))} className="mt-4 incentive-form-content">
        <div className="form-section">
          <h4>Employee Details</h4>
          <Row className="form-group">
            {employeeDetailsFields.map((field) => (
              <Col xxl={field.col} xl={field.col} lg={field.col} key={field.name}>
                <div className="input-container">
                  <label className="form-label">
                    {field.label} {field.required && <span className="required">*</span>}
                  </label>
                  <Controller
                    name={field.name}
                    control={control}
                    rules={{ required: field.required ? `${field.label} is required` : false }}
                    render={({ field: controllerField }) => renderField(controllerField, field)}
                  />
                  {errors[field.name] && <span className="error-message">{errors[field.name]?.message}</span>}
                </div>
              </Col>
            ))}
          </Row>
        </div>

        <div className="form-section">
          <h4>Bank Details</h4>
          <Row className="form-group">
            {bankDetailsFields.map((field) => (
              <Col xxl={field.col} xl={field.col} lg={field.col} key={field.name}>
                <div className="input-container">
                  <label className="form-label">
                    {field.label} {field.required && <span className="required">*</span>}
                  </label>
                  <Controller
                    name={field.name}
                    control={control}
                    rules={{ required: field.required ? `${field.label} is required` : false }}
                    render={({ field: controllerField }) => renderField(controllerField, field)}
                  />
                  {errors[field.name] && <span className="error-message">{errors[field.name]?.message}</span>}
                </div>
              </Col>
            ))}
            <Col xxl={4} xl={4} lg={4}>
                <div className="input-container">
                  <label className="form-label">Status</label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => renderField(field, { type: "toggle" })}
                  />
                </div>
            </Col>
          </Row>
        </div>
      </form>
    </section>
  );
};

export default IncentiveForm;
