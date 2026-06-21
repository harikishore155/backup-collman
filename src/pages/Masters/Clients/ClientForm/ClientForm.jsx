import { Controller, useForm } from "react-hook-form";
import BackButton from "@/components/BackButton/BackButton";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import Button from "@/components/Button/Button";
import { useEffect, useState, useCallback } from "react";
import PreLoader from "@/components/PreLoader/PreLoader";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import SelectInput from "@/components/SelectInput/SelectInput";
import toast from "react-hot-toast";
import {
  createClientApi,
  updateClientApi,
  fetchClientByIdApi,
  updateClientStatusApi,
} from "@/features/clients/clientApi";
import { fetchUsersApi } from "@/features/users/userApi";
import { extractListPayload } from "@/utils/apiHelpers";
import { isTeamLeaderRoleName } from "@/constants/roles";
import "./ClientForm.scss";

const getUserRoleName = (u) => {
  if (!u || typeof u !== "object") return "";
  if (typeof u.roleId === "object" && u.roleId?.name != null)
    return String(u.roleId.name);
  return String(u.role_name ?? u.role ?? "");
};

const toIdList = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (item == null) return "";
      if (typeof item === "object")
        return String(item._id ?? item.id ?? item.user_id ?? "");
      return String(item);
    })
    .filter(Boolean);
};

const normalizeClientForForm = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const statusRaw = raw.status ?? raw.is_active ?? raw.active;
  const statusBool =
    typeof statusRaw === "boolean"
      ? statusRaw
      : String(statusRaw).toLowerCase() === "active";

  return {
    bankName: raw.bankName ?? raw.bank_name ?? raw.client_name ?? "",
    bankCode:
      raw.bankCode ?? raw.bank_code ?? raw.code ?? raw.client_code ?? "",
    status: statusBool,
    teams: toIdList(raw.teams ?? raw.team_ids ?? []),
    users: toIdList(raw.users ?? raw.user_ids ?? raw.assigned_users ?? []),
  };
};

const pickClientRecordFromBody = (body) => {
  if (!body || typeof body !== "object") return null;
  const inner = body.data ?? body.client ?? body.result;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner;
  if (body._id || body.id) return body;
  return null;
};

const ClientForm = ({ mode = "create", onSubmit }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();

  const [fetchingData, setFetchingData] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [teamOptions, setTeamOptions] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bankName: "",
      bankCode: "",
      status: true,
      users: [],
      teams: [],
    },
  });

  const loadClientById = useCallback(
    async (clientId) => {
      if (!clientId) {
        toast.error("Client not found");
        return;
      }

      try {
        const data = await fetchClientByIdApi(clientId);
        if (data?.success === false) {
          toast.error(data?.message || "Failed to load client");
          return;
        }
        const record = pickClientRecordFromBody(data);
        const normalized = normalizeClientForForm(record);
        if (normalized) {
          reset(normalized);
        } else {
          toast.error(data?.message || "Failed to load client");
        }
      } catch (error) {
        console.error("Load client error:", error);
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load client";
        toast.error(typeof msg === "string" ? msg : "Failed to load client");
      }
    },
    [reset],
  );

  useEffect(() => {
    const loadData = async () => {
      setFetchingData(true);
      try {
        try {
          const usersData = await fetchUsersApi();
          if (usersData?.success !== false) {
            const { rows } = extractListPayload(usersData);
            setTeamOptions(
              rows
                .filter((u) => isTeamLeaderRoleName(getUserRoleName(u)))
                .map((u, index) => {
                  const value = String(u._id ?? u.id ?? u.user_id ?? "");
                  const label =
                    (u.name ?? u.full_name ?? u.username ?? u.email ?? "") ||
                    value ||
                    `TL ${index}`;
                  return { label, value };
                })
                .filter((o) => o.value),
            );
          }
        } catch {
          setTeamOptions([]);
        }

        if ((mode === "edit" || mode === "view") && id) {
          await loadClientById(id);
        } else {
          const fromState = normalizeClientForForm(state?.client);
          if (fromState) reset(fromState);
        }
      } catch (error) {
        console.error("Failed to load form data", error);
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load necessary data";
        toast.error(
          typeof msg === "string" ? msg : "Failed to load necessary data",
        );
      } finally {
        setFetchingData(false);
      }
    };

    void loadData();
  }, [mode, id, state?.client, reset, loadClientById]);

  const handleBack = () => {
    navigate(-1);
  };

  const buildPayload = (formData) => ({
    ...formData,
    status: formData.status ? "active" : "inactive",
  });

  const handleCreate = async (formData) => {
    setSubmitLoading(true);
    try {
      const payload = buildPayload(formData);
      const data = await createClientApi(payload);

      if (data?.success) {
        toast.success(data.message || "Client created successfully");
        if (typeof onSubmit === "function") {
          onSubmit(data);
        } else {
          navigate("/masters/clients");
        }
      } else {
        toast.error(data?.message || "Failed to create client");
      }
    } catch (error) {
      console.error("Create client error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create client";
      toast.error(typeof msg === "string" ? msg : "Failed to create client");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    const docId = id ?? state?.client?._id ?? state?.client?.id;
    if (!docId) {
      toast.error("Client not found");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = buildPayload(formData);
      const data = await updateClientApi(docId, payload);

      if (data?.success) {
        toast.success(data.message || "Client updated successfully");
        if (typeof onSubmit === "function") {
          onSubmit(data);
        } else {
          navigate("/masters/clients");
        }
      } else {
        toast.error(data?.message || "Failed to update client");
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update client";
      toast.error(typeof msg === "string" ? msg : "Failed to update client");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFormSubmit = (formData) => {
    if (mode === "edit") {
      void handleEdit(formData);
    } else {
      void handleCreate(formData);
    }
  };

  const clientDetailsFields = [
    {
      name: "bankName",
      label: "Bank Name",
      type: "text",
      placeholder: "Enter Bank Name",
      required: true,
    },
    {
      name: "bankCode",
      label: "Bank Code",
      type: "text",
      placeholder: "Enter Bank Code",
      required: true,
    },
    { name: "status", label: "Status", type: "toggle" },
  ];

  const accessFields = [
    {
      name: "TL",
      label: "Team Leaders (TL)",
      type: "multiselect",
      placeholder: "Select team leaders (TL)",
      options: teamOptions,
    },
  ];

  if (fetchingData) {
    return <PreLoader />;
  }

  const renderField = (
    field,
    { name, label, type, placeholder, required, options },
  ) => {
    switch (type) {
      case "toggle": {
        const docId = id ?? state?.client?._id ?? state?.client?.id;
        const isStatusField = name === "status";
        const statusBusy = isStatusField && (statusUpdating || submitLoading);

        const handleToggleChange = async (e) => {
          const next = e.target.checked;
          if (mode === "edit" && isStatusField && docId) {
            setStatusUpdating(true);
            try {
              const data = await updateClientStatusApi(docId, {
                status: next ? "active" : "inactive",
              });
              if (data?.success) {
                field.onChange(next);
                toast.success(data.message || "Status updated successfully");
              } else {
                toast.error(data?.message || "Failed to update status");
              }
            } catch (error) {
              console.error("Update status error:", error);
              const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to update status";
              toast.error(
                typeof msg === "string" ? msg : "Failed to update status",
              );
            } finally {
              setStatusUpdating(false);
            }
            return;
          }
          field.onChange(next);
        };

        return (
          <div className="toggle-wrapper">
            <IOSSwitch
              checked={field.value}
              onChange={handleToggleChange}
              disabled={mode === "view" || statusBusy}
            />
            <span className="toggle-status-label">
              {isStatusField && statusUpdating
                ? "Updating..."
                : isStatusField && submitLoading
                  ? "Saving..."
                  : field.value
                    ? "Active"
                    : "Inactive"}
            </span>
          </div>
        );
      }
      case "multiselect":
        return (
          <SelectInput
            {...field}
            multiple
            options={options}
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
    <section className="client-form-container">
      <div className="page-header-container">
        <div className="page-title-wrap">
          <BackButton onClick={handleBack} />
          <h4 className="mb-0">
            {mode === "edit"
              ? "Edit Client"
              : mode === "view"
                ? "View Client"
                : "Create Client"}
          </h4>
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
              form="client-form"
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

      <form id="client-form" onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="mt-4 client-form-container">
          <h4>Enter Client Details</h4>
          <Row className="form-group">
            {clientDetailsFields.map(
              ({ name, label, type, placeholder, required, options }) => (
                <Col xxl={4} xl={4} lg={4} key={name}>
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
        </div>

        <div className="mt-4 client-form-container">
          <h4>Access</h4>
          <Row className="form-group">
            {accessFields.map(({ name, label, type, placeholder, options }) => (
              <Col xxl={6} xl={6} lg={6} key={name}>
                <div className="input-container">
                  <label className="form-label">{label}</label>
                  <Controller
                    name={name}
                    control={control}
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
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </form>
    </section>
  );
};

export default ClientForm;
