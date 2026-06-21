
import { Controller, useForm } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { useEffect, useState } from "react";
import PreLoader from "@/components/PreLoader/PreLoader";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import SelectInput from "@/components/SelectInput/SelectInput";
import { FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";
import { fetchRolesApi } from "@/features/roles/roleApi";
import { createUserApi, updateUserApi, fetchUserByIdApi } from "@/features/users/userApi";
import "./UserForm.scss";
import axiosInstance from "@/utils/axiosInstance";
import USER_ENDPOINTS from "@/api/endpoints/userEndpoints";
import { normalizeRoleNameValue, isTeamLeaderRoleName } from "@/constants/roles";

const PASSWORD_RULES = [
  { id: "minLength", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "uppercase", label: "At least 1 uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number",    label: "At least 1 number",          test: (v) => /[0-9]/.test(v) },
  { id: "symbol",    label: "At least 1 special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const getRefId = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") return String(ref._id ?? ref.id ?? "");
  return String(ref);
};

const OPTIONAL_REF_FIELDS = ["managerId", "assistantManagerId", "teamLeaderId"];

const sanitizeUserPayload = (data) => {
  const payload = {
    ...data,
    email: data.mailId,
    roleId: getRefId(data.roleId) || undefined,
  };

  if (data.newPassword) {
    payload.password = data.newPassword;
  }

  delete payload.newPassword;
  delete payload.confirmPassword;
  delete payload.mailId;

  OPTIONAL_REF_FIELDS.forEach((field) => {
    const id = getRefId(payload[field]);
    if (id) {
      payload[field] = id;
    } else {
      delete payload[field];
    }
  });

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  return payload;
};

const validatePassword = (value, isRequired) => {
  if (!value) {
    return isRequired ? "Password is required" : true;
  }
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(value)) return rule.label;
  }
  return true;
};

const UserForm = ({ mode = "create", onSubmit }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [managerOptions, setManagerOptions] = useState([]);
  const [assistantManagerOptions, setAssistantManagerOptions] = useState([]);
  const [teamLeaderOptions, setTeamLeaderOptions] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      UID: "",
      name: "",
      contactNumber: "",
      gender: "",
      branch: "",
      designation: "",
      mailId: "",
      currentAddress: "",
      roleId: "",
      managerId: "",
      assistantManagerId: "",
      teamLeader: "",
      bankIdCardNumber: "",
      status: "active",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const watchedPassword = watch("newPassword");

  useEffect(() => {
    const loadData = async () => {
      try {
        setFetchingData(true);
        const rolesData = await fetchRolesApi();
        if (rolesData?.success) {
          const roleOptions = rolesData.data.map((role) => ({
            label: role.name,
            value: role._id,
          }));
          setRoles(roleOptions);
        }

        // fetch users and build role-based select options
        try {
          const usersRes = await axiosInstance.get(USER_ENDPOINTS.LIST);
          const users = usersRes?.data?.data ?? usersRes?.data ?? [];
          const mapUser = (u) => ({ value: u._id, label: u.name ?? u.email ?? u.employeeId ?? u.UID ?? u._id });

          const managers = [];
          const ams = [];
          const tls = [];

          users.forEach((u) => {
            const roleName = u?.roleId?.name ?? u?.designation ?? "";
            const norm = normalizeRoleNameValue(roleName);
            const opt = mapUser(u);
            if (isTeamLeaderRoleName(roleName) || norm === "tl") tls.push(opt);
            else if (norm === "manager") managers.push(opt);
            else if (norm === "assistantManager" || norm === "assistantmanager" || /assistant/.test(String(roleName).toLowerCase())) ams.push(opt);
          });

          setManagerOptions(managers);
          setAssistantManagerOptions(ams);
          setTeamLeaderOptions(tls);
        } catch (uErr) {
          console.error("Failed to fetch users for user form", uErr);
        }

        if ((mode === "edit" || mode === "view") && id) {
          const userData = await fetchUserByIdApi(id);
          if (userData?.success) {
            const user = userData.data;
            reset({
              ...user,
              mailId: user.email || user.mailId || "",
              roleId: getRefId(user.roleId),
              managerId: getRefId(user.managerId ?? user.manager),
              assistantManagerId: getRefId(user.assistantManagerId ?? user.assistantManager),
              teamLeaderId: getRefId(user.teamLeaderId ?? user.teamLeader),
              newPassword: "",
              confirmPassword: "",
              status: user.status || "active",
            });
          }
        } else if (state?.user) {
          reset(state.user);
        }
      } catch (error) {
        console.error("Failed to load form data", error);
        toast.error("Failed to load necessary data");
      } finally {
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
console.log("Submitting form with data:", data);
    try {
      setLoading(true);
      const payload = sanitizeUserPayload(data);

      let response;
      if (mode === "edit") {
        response = await updateUserApi(id, payload);
      } else {
        response = await createUserApi(payload);
      }

      if (response.success) {
        toast.success(
          mode === "edit" ? "User updated successfully" : "User created successfully",
        );
        navigate("/masters/users");
      } else {
        toast.error(response.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Form submission error", error);
      toast.error(error?.response?.data?.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const userDetailsFields = [
    { name: "UID", label: "Employee ID", type: "select", placeholder: "Select User ID", col: 4 },
    { name: "name", label: "Name", type: "text", placeholder: "Enter Name", required: true, col: 4 },
    { name: "contactNumber", label: "Contact Number", type: "text", placeholder: "Enter Contact Number", required: true, col: 4 },
    {
      name: "gender", label: "Gender", type: "select", placeholder: "Select Gender", required: true, col: 4,
      options: [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
        { label: "Other", value: "Other" },
      ],
    },
    { name: "branch", label: "Branch", type: "text", placeholder: "Enter Branch", required: true, col: 4 },
    { name: "designation", label: "Designation", type: "text", placeholder: "Enter Designation", required: true, col: 4 },
    { name: "mailId", label: "Mail ID", type: "text", placeholder: "Enter Mail ID", required: true, col: 4 },
    { name: "currentAddress", label: "Current Address", type: "text", placeholder: "Enter Current Address", required: true, col: 8 },
    { name: "bankIdCardNumber", label: "Bank ID Card Number", type: "text", placeholder: "Enter Bank ID Card Number", required: true, col: 4 },
  ];

  const roleDetailsFields = [
    { name: "roleId", label: "Role", type: "select", placeholder: "Select Role", required: true, options: roles, col: 4 },
    { name: "managerId", label: "Manager", type: "select", placeholder: "Select Manager", options: managerOptions, col: 4 },
    { name: "assistantManagerId", label: "Assistant Manager", type: "select", placeholder: "Select Assistant Manager", options: assistantManagerOptions, col: 4 },
    { name: "teamLeaderId", label: "Team Leader", type: "select", placeholder: "Select Team Leader", options: teamLeaderOptions, col: 4 },
    { name: "status", label: "Status", type: "toggle", col: 4 },
  ];

  const passwordFields = [
    {
      name: "newPassword",
      label: mode === "edit" ? "New Password" : "Password",
      type: "password",
      placeholder: mode === "edit" ? "Enter New Password" : "Enter Password",
      required: mode === "create",
      col: 4,
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      placeholder: "Re-enter Password",
      required: mode === "create",
      col: 4,
    },
  ];

  if (fetchingData) return <PreLoader />;
  if (loading) return <PreLoader />;

  const renderField = (field, { name, label, type, placeholder, required, options }) => {
    switch (type) {
      case "toggle":
        return (
          <div className="toggle-wrapper">
            <IOSSwitch
              checked={field.value === "active"}
              onChange={(e) => field.onChange(e.target.checked ? "active" : "inactive")}
              disabled={mode === "view"}
            />
            <span className="toggle-status-label">
              {field.value === "active" ? "Active" : "Inactive"}
            </span>
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

      case "password": {
        const isConfirm = name === "confirmPassword";
        const isVisible = isConfirm ? showConfirmPassword : showPassword;
        const setVisible = isConfirm ? setShowConfirmPassword : setShowPassword;
        return (
          <div className="password-input-wrapper">
            <input
              {...field}
              type={isVisible ? "text" : "password"}
              className="form-input"
              placeholder={placeholder}
              disabled={mode === "view"}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setVisible(!isVisible)}
              disabled={mode === "view"}
            >
              {isVisible ? <FiEye /> : <FiEyeOff />}
            </button>
          </div>
        );
      }

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

  const getPasswordRules = (name) => {
    if (name === "newPassword") {
      return {
        validate: (value) => validatePassword(value, mode === "create"),
      };
    }
    if (name === "confirmPassword") {
      return {
        validate: (value) => {
          if (!watchedPassword && !value) return true;
          if (!value && mode === "create") return "Confirm Password is required";
          if (value && value !== watchedPassword) return "Passwords do not match";
          return true;
        },
      };
    }
    return {};
  };

  const renderFieldGroup = (fields) =>
    fields.map((field) => (
      <Col xxl={field.col} xl={field.col} lg={field.col} key={field.name}>
        <div className="input-container">
          <label className="form-label">
            {field.label}{" "}
            {field.required && <span className="required">*</span>}
          </label>
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              ...(field.type === "password" ? getPasswordRules(field.name) : {}),
            }}
            render={({ field: controllerField }) => renderField(controllerField, field)}
          />
          {errors[field.name] && (
            <span className="error-message">{errors[field.name]?.message}</span>
          )}
        </div>
      </Col>
    ));

  return (
    <section className="user-form-container">
      <div className="page-header-container">
        <div className="page-title-wrap">
          <div className="title-breadcrumb-group">
            <div className="title-with-back">
              <BackButton onClick={handleBack} />
              <h4 className="mb-0">
                {mode === "edit" ? "Edit User" : mode === "view" ? "View User" : "Create User"}
              </h4>
            </div>
          </div>
        </div>

        <div className="page-header-actions">
          <Button variant="secondary" size="lg" onClick={handleBack}>Cancel</Button>
          <Button variant="primary" size="lg" type="submit" form="user-form">
            {mode === "edit" ? "Update" : "Save"}
          </Button>
        </div>
      </div>

      <form id="user-form" onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 user-form-content">
        <div className="form-section">
          <h4>Enter User Details</h4>
          <Row className="form-group">{renderFieldGroup(userDetailsFields)}</Row>
        </div>

        <div className="form-section">
          <h4>Role Details</h4>
          <Row className="form-group">{renderFieldGroup(roleDetailsFields)}</Row>
        </div>

        <div className="form-section">
          <h4>Password</h4>
          <Row className="form-group">{renderFieldGroup(passwordFields)}</Row>
        </div>
      </form>
    </section>
  );
};

export default UserForm;