
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import toast from "react-hot-toast";

import Button from "@/components/Button/Button";
import PreLoader from "@/components/PreLoader/PreLoader";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import BackButton from "@/components/BackButton/BackButton";
import SelectInput from "@/components/SelectInput/SelectInput";
import { ROLE_NAME_OPTIONS, normalizeRoleNameValue } from "@/constants/roles";
import { fetchRoleByIdApi, createRoleApi, updateRoleApi } from "@/features/roles/roleApi";

import "./RoleForm.scss";

const ROLE_MODULES = [
  {
    id: "masterModuleAccess",
    name: "Master Module Access",
    description: "All module",
    permissions: ["Create", "Edit", "View", "Delete"],
  },
  {
    id: "campaignManagement",
    name: "Campaign management",
    description: "Campaign module",
    permissions: ["Create", "Edit", "View", "Assign User", "Change status", "Overdue Rules", "Delete"],
  },
  {
    id: "caseUploadAllocation",
    name: "Case Upload & allocation",
    description: "Case allows",
    permissions: ["Upload", "Update", "Delete", "Assign", "View"],
  },
  {
    id: "incentiveModule",
    name: "Incentive Module",
    description: "Approval Allows",
    permissions: ["Upload", "Edit", "View", "Audit log access"],
  },
  {
    id: "targetModule",
    name: "Target Module",
    description: "Approval Allows",
    permissions: ["Create", "Edit", "View", "Audit log access"],
  },
  {
    id: "teleCallerOperation",
    name: "Tele caller Operation",
    description: "Operation Allows",
    permissions: ["View", "Update", "Add Remarks", "Update MIS", "Call Customer", "Modify allocation"],
  },
  {
    id: "reportDashboard",
    name: "Report & dashboard",
    description: "Report & Dashboard Allows",
    permissions: ["Dashboard", "View Reports", "Export Report", "Delete"],
  },
  {
    id: "approvalSpecialControl",
    name: "Approval & Special Control",
    description: "Approval Allows",
    permissions: ["Campaign approval", "Escalation approval", "Overdue deadline", "Audit log access", "KnowledgeBaseAccess"],
  },
];

const SCOPES = ["Global", "Team", "Self"];

/**
 * Converts a permission display name to a camelCase action key.
 * Examples:
 *   "View"               → "view"
 *   "Audit log access"   → "auditLogAccess"
 *   "Campaign approval"  → "campaignApproval"
 *   "knowledge base access" → "knowledgeBaseAccess"
 */
const toActionKey = (permName) => {
  return permName
    .trim()
    .split(/\s+/)
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
};

const RoleForm = ({ mode = "create" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === "edit");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      status: true,
      access: ROLE_MODULES.reduce((acc, module) => {
        acc[module.id] = {
          permissions: module.permissions.reduce((pAcc, p) => {
            pAcc[p] = false;
            return pAcc;
          }, {}),
          scope: "Global",
        };
        return acc;
      }, {}),
    },
  });

  useEffect(() => {
    if (mode === "edit" && id) {
      fetchRoleDetails();
    }
  }, [mode, id]);

  const fetchRoleDetails = async () => {
    try {
      setInitialLoading(true);
      const data = await fetchRoleByIdApi(id);
      if (data?.success) {
        const roleData = data.data;
        // Map API permissions array back to the form's access object.
        // Uses toActionKey() — must match exactly what onFormSubmit saves.
        const access = {};
        ROLE_MODULES.forEach((module) => {
          const apiModule = roleData.permissions?.find((p) => p.module === module.id);
          access[module.id] = {
            permissions: module.permissions.reduce((acc, perm) => {
              const actionKey = toActionKey(perm); // ← fixed: proper camelCase
            acc[perm] = apiModule?.actions?.[actionKey] ?? false;
              return acc;
            }, {}),
            scope: apiModule?.scope || "Global",
          };
        });

        reset({
          name: normalizeRoleNameValue(roleData.name),
          description: roleData.description || "",
          status: roleData.status?.toLowerCase() === "active",
          access,
        });
      }
    } catch (error) {
  
      toast.error("Failed to load role details");
    } finally {
      setInitialLoading(false);
    }
  };



  const handleBack = () => {
    navigate("/masters/roles");
  };

  const onFormSubmit = async (data) => {
    try {
      setLoading(true);

      const permissions = Object.entries(data.access).map(([moduleId, moduleData]) => {
        const actions = {};
        Object.entries(moduleData.permissions).forEach(([permName, value]) => {
          const actionKey = toActionKey(permName); // ← fixed: proper camelCase
          actions[actionKey] = value;
        });

        return {
          module: moduleId,
          scope: moduleData.scope,
          actions,
        };
      });

      const payload = {
        name: data.name,
        description: data.description,
        status: data.status ? "active" : "inactive",
        permissions,
      };

      let responseData;
      if (mode === "create") {
        responseData = await createRoleApi(payload);
      } else {
        responseData = await updateRoleApi(id, payload);
      }

      if (responseData?.success) {
        toast.success(responseData?.message || `Role ${mode === "create" ? "created" : "updated"} successfully`);
        navigate("/masters/roles");
      } else {
        toast.error(responseData?.message || "Something went wrong");
      }
    } catch (error) {
   
      toast.error(error?.response?.data?.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <PreLoader />;
  }

  return (
    <section className="role-form-container">
      <div className="page-header-container">
        <div className="page-title-wrap">
          <div className="title-breadcrumb-group">
            <div className="title-with-back">
              <BackButton onClick={handleBack} />
              <h4 className="mb-0">
                {mode === "edit" ? "Edit Role" : "Create Role"}
              </h4>
            </div>
          </div>
        </div>

        <div className="page-header-actions">
          <Button variant="secondary" size="lg" onClick={handleBack}>
            Cancel
          </Button>

          <Button variant="primary" size="lg" type="submit" form="role-form" loading={loading} disabled={loading}>
            {loading ? (mode === "edit" ? "Updating..." : "Saving...") : (mode === "edit" ? "Update" : "Save")}
          </Button>
        </div>
      </div>

      <form id="role-form" onSubmit={handleSubmit(onFormSubmit)} className="role-form-content">
        <div className="form-section">
          <h4>Enter Role Details</h4>
          <div className="form-group">
            <Row>
              <Col md={4}>
                <div className="input-container">
                  <label className="form-label">Role</label>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: "Role is required" }}
                    render={({ field }) => (
                      <SelectInput
                        {...field}
                        options={ROLE_NAME_OPTIONS}
                        placeholder="Select Role"
                      />
                    )}
                  />
                  {errors.name && <span className="error-text text-danger">{errors.name.message}</span>}
                </div>
              </Col>
              <Col md={4}>
                <div className="input-container">
                  <label className="form-label">Status</label>
                  <div className="toggle-wrapper">
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <IOSSwitch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      )}
                    />
                    <span className="toggle-status-label">Active</span>
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <div className="input-container">
                  <label className="form-label">Description</label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="form-input"
                        placeholder="Description"
                      />
                    )}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </div>

        <div className="form-section role-access-section">
          <h4>Role Access</h4>
          <div className="access-table-container">
            <table className="access-table">
              <tbody>
                {ROLE_MODULES.map((module) => (
                  <React.Fragment key={module.id}>
                    <tr className="module-header-row">
                      <th style={{ width: "250px" }}>{module.name}</th>
                      {module.permissions.map((permission) => (
                        <th key={permission} className="text-center" style={{ width: "100px" }}>
                          {permission}
                        </th>
                      ))}
                      {Array.from({ length: 7 - module.permissions.length }).map((_, i) => (
                        <th key={`empty-h-${i}`} style={{ width: "100px" }}></th>
                      ))}
                    </tr>
                    <tr className="module-row">
                      <td>
                        <span style={{ fontSize: "14px", color: "#6c757d" }}>{module.description}</span>
                      </td>
                      {module.permissions.map((permission) => (
                        <td key={permission} className="checkbox-cell">
                          <label className="checkbox-label">
                            <Controller
                              name={`access.${module.id}.permissions.${permission}`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={(e) => field.onChange(e.target.checked)}
                                />
                              )}
                            />
                            <span className="checkbox-option"></span>
                          </label>
                        </td>
                      ))}
                      {Array.from({ length: 7 - module.permissions.length }).map((_, i) => (
                        <td key={`empty-d-${i}`}></td>
                      ))}
                    </tr>
                    <tr className="scope-row">
                      <td colSpan={8}>
                        <div className="scope-container">
                          <span className="scope-label">Select Scope:</span>
                          <div className="scope-buttons">
                            <Controller
                              name={`access.${module.id}.scope`}
                              control={control}
                              render={({ field }) => (
                                <>
                                  {SCOPES.map((scope) => (
                                    <button
                                      key={scope}
                                      type="button"
                                      className={`scope-btn ${field.value === scope ? "active" : ""}`}
                                      onClick={() => field.onChange(scope)}
                                    >
                                      {scope}
                                    </button>
                                  ))}
                                </>
                              )}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </section>
  );
};

export default RoleForm;