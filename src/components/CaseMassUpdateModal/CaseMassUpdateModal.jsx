import { useEffect, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import toast from "react-hot-toast";
import Button from "@/components/Button/Button";
import DataTable from "@/components/DataTable/DataTable";
import SelectInput from "@/components/SelectInput/SelectInput";
import {
  massUpdateCasesApi,
  previewCaseMassUpdateApi,
} from "@/features/caseUploads/caseUploadApi";
import { fetchMisCodesApi } from "@/features/misCodes/misCodeApi";
import { fetchUsersApi } from "@/features/users/userApi";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import "./CaseMassUpdateModal.scss";

const FIELD_CONFIG = [
  { key: "teamLeaderId", label: "Team Leader", type: "teamLeader" },
  { key: "telecallerId", label: "Telecaller", type: "telecaller" },
  { key: "allocationStatus", label: "Allocation Status", type: "text" },
  { key: "misCodeId", label: "MIS Code", type: "misCode" },
  { key: "retain", label: "Retain", type: "boolean" },
  { key: "mainStatus", label: "Main Status", type: "text" },
  { key: "isEscalated", label: "Is Escalated", type: "boolean" },
];

const BOOLEAN_OPTIONS = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

const getUserLabel = (user) =>
  String(
    user?.name ??
      user?.fullName ??
      user?.full_name ??
      user?.employeeName ??
      user?.employee_name ??
      user?.employeeId ??
      user?.email ??
      user?._id ??
      "",
  );

const getUserRole = (user) =>
  String(
    user?.roleId?.name ??
      user?.role?.name ??
      user?.role_name ??
      user?.role ??
      user?.designation ??
      "",
  )
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const getValidationMessage = (data, fallback) => {
  const validation = data?.errors ?? data?.validationErrors ?? data?.details;

  if (Array.isArray(validation) && validation.length) {
    return validation
      .map((item) => item?.message ?? item?.msg ?? String(item))
      .join(", ");
  }
  if (validation && typeof validation === "object") {
    return Object.values(validation)
      .flat()
      .map((item) => item?.message ?? item?.msg ?? String(item))
      .join(", ");
  }
  return data?.message ?? data?.error ?? fallback;
};

const getErrorMessage = (error, fallback) =>
  getValidationMessage(
    error?.response?.data,
    error?.message ?? fallback,
  );

const readPreview = (data, fallbackUpdates) => {
  const payload = data?.data && !Array.isArray(data.data) ? data.data : data;
  return {
    matchingCount: Number(
      payload?.matchingCount ?? payload?.matchedCount ?? payload?.count ?? 0,
    ),
    sampleCases:
      payload?.sampleCases ?? payload?.sample_cases ?? payload?.cases ?? [],
    requestedUpdates:
      payload?.requestedUpdates ??
      payload?.requested_updates ??
      payload?.updates ??
      fallbackUpdates,
  };
};

const CaseMassUpdateModal = ({
  show,
  onClose,
  selectedCaseIds = [],
  filters = {},
  onSuccess,
}) => {
  const [enabledFields, setEnabledFields] = useState({});
  const [values, setValues] = useState({});
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [teamLeaderOptions, setTeamLeaderOptions] = useState([]);
  const [telecallerOptions, setTelecallerOptions] = useState([]);
  const [misCodeOptions, setMisCodeOptions] = useState([]);

  useEffect(() => {
    if (!show) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabledFields({});
    setValues({});
    setPreview(null);

    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        const [usersResult, misCodesResult] = await Promise.allSettled([
          fetchUsersApi(),
          fetchMisCodesApi(),
        ]);
        if (misCodesResult.status === "rejected") throw misCodesResult.reason;

        const usersData = usersResult.status === "fulfilled" ? usersResult.value : {};
        const misCodesData = misCodesResult.value;
        const { rows: users } = extractListPayload(usersData);
        const { rows: misCodes } = extractListPayload(misCodesData);
        const toUserOption = (user) => ({
          value: String(user?._id ?? user?.id ?? ""),
          label: getUserLabel(user),
        });
        const toTelecallerOption = (user) => ({
          value: String(
            user?.employeeId ?? user?.employee_id ?? user?.UID ?? user?._id ?? user?.id,
          ),
          label: getUserLabel(user),
        });
        const validUsers = users.filter((user) => user?._id ?? user?.id);
        const teamLeaders = validUsers.filter((user) =>
          ["teamleader", "tl"].includes(getUserRole(user)),
        );
        const telecallers = validUsers.filter((user) =>
          ["telecaller", "tc", "teammember", "employee"].includes(
            getUserRole(user),
          ),
        );

        setTeamLeaderOptions(
          (teamLeaders.length ? teamLeaders : validUsers).map(toUserOption),
        );
        setTelecallerOptions(
          (telecallers.length ? telecallers : validUsers).map(toTelecallerOption),
        );
        setMisCodeOptions(
          misCodes
            .filter((item) => item?._id ?? item?.id)
            .map((item) => ({
              value: String(item._id ?? item.id),
              label: String(
                item.misCode ??
                  item.mis_code ??
                  item.name ??
                  item.code ??
                  item._id,
              ),
            })),
        );
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load update options"));
      } finally {
        setOptionsLoading(false);
      }
    };

    loadOptions();
  }, [show]);

  const updates = useMemo(
    () =>
      FIELD_CONFIG.reduce((result, field) => {
        if (!enabledFields[field.key]) return result;
        const value = values[field.key];
        if (field.type === "boolean") {
          if (value !== "") result[field.key] = value === "true";
        } else if (value != null && String(value).trim() !== "") {
          result[field.key] = value;
        }
        return result;
      }, {}),
    [enabledFields, values],
  );

  const buildPayload = () => ({
    ...(selectedCaseIds.length ? { selectedCaseIds, filters: {} } : { filters }),
    updates,
  });

  const handleFieldToggle = (key) => {
    setEnabledFields((current) => ({ ...current, [key]: !current[key] }));
    setPreview(null);
  };

  const handleValueChange = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setPreview(null);
  };

  const handlePreview = async () => {
    if (!Object.keys(updates).length) {
      toast.error("Select at least one update field");
      return;
    }

    try {
      setPreviewLoading(true);
      const data = await previewCaseMassUpdateApi(buildPayload());
      if (isApiFailure(data)) {
        toast.error(getValidationMessage(data, "Failed to preview mass update"));
        return;
      }
      const nextPreview = readPreview(data, updates);
      setPreview(nextPreview);
      if (!nextPreview.matchingCount) toast.error("No matching cases found");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to preview mass update"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview || submitLoading) return;

    try {
      setSubmitLoading(true);
      const data = await massUpdateCasesApi({
        ...buildPayload(),
        expectedCount: preview.matchingCount,
        confirm: true,
      });
      if (isApiFailure(data)) {
        toast.error(getValidationMessage(data, "Failed to update cases"));
        return;
      }

      const result = data?.data && !Array.isArray(data.data) ? data.data : data;
      const matchedCount = Number(
        result?.matchedCount ?? result?.matchingCount ?? preview.matchingCount,
      );
      const modifiedCount = Number(
        result?.modifiedCount ?? result?.updatedCount ?? matchedCount,
      );
      toast.success(
        `Mass update complete: ${matchedCount} matched, ${modifiedCount} modified`,
      );
      onSuccess?.({ matchedCount, modifiedCount });
    } catch (error) {
      if (error?.response?.status === 409) {
        setPreview(null);
        toast.error("Matching cases changed. Please preview again.");
      } else {
        toast.error(getErrorMessage(error, "Failed to update cases"));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const getOptions = (type) => {
    if (type === "teamLeader") return teamLeaderOptions;
    if (type === "telecaller") return telecallerOptions;
    if (type === "misCode") return misCodeOptions;
    return BOOLEAN_OPTIONS;
  };

  const sampleColumns = [
    {
      key: "_id",
      title: "Case ID",
      render: (_, row) => row._id ?? row.id ?? "-",
    },
    {
      key: "customer",
      title: "Customer",
      render: (_, row) =>
        row.customerName ?? row.customer_name ?? row.name ?? "-",
    },
    {
      key: "account",
      title: "Account No",
      render: (_, row) =>
        row.accountNumber ?? row.account_number ?? row.accountNo ?? "-",
    },
  ];

  return (
    <Modal
      show={show}
      onHide={submitLoading ? undefined : onClose}
      centered
      size="lg"
      backdrop={submitLoading ? "static" : true}
      backdropClassName="case-mass-update-backdrop"
      className="case-mass-update-modal"
      contentClassName="modal-zoom"
      enforceFocus={false}
    >
      <Modal.Header closeButton={!submitLoading}>
        <Modal.Title>Mass Update Cases</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!preview ? (
          <>
            <div className="mass-update-scope">
              {selectedCaseIds.length
                ? `${selectedCaseIds.length} selected case(s)`
                : "Cases matching the applied filters"}
            </div>

            <div className="mass-update-fields">
              {FIELD_CONFIG.map((field) => {
                const enabled = Boolean(enabledFields[field.key]);
                return (
                  <div className="mass-update-field" key={field.key}>
                    <label className="mass-update-enable">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleFieldToggle(field.key)}
                        disabled={previewLoading || submitLoading}
                      />
                      <span>Update {field.label}</span>
                    </label>

                    {field.type === "text" ? (
                      <input
                        className="mass-update-text-input"
                        value={values[field.key] ?? ""}
                        placeholder={`Enter ${field.label}`}
                        onChange={(event) =>
                          handleValueChange(field.key, event.target.value)
                        }
                        disabled={!enabled || previewLoading || submitLoading}
                      />
                    ) : (
                      <SelectInput
                        value={values[field.key] ?? ""}
                        options={getOptions(field.type)}
                        placeholder={
                          optionsLoading ? "Loading..." : `Select ${field.label}`
                        }
                        onChange={(value) => handleValueChange(field.key, value)}
                        disabled={
                          !enabled ||
                          optionsLoading ||
                          previewLoading ||
                          submitLoading
                        }
                        className="mb-0"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mass-update-confirmation">
            <div className="mass-update-warning">
              This action will update {preview.matchingCount} cases.
            </div>
            <div className="mass-update-summary">
              <div>
                <span>Matching Cases</span>
                <strong>{preview.matchingCount}</strong>
              </div>
              <div>
                <span>Requested Updates</span>
                <strong>{Object.keys(preview.requestedUpdates).length}</strong>
              </div>
            </div>
            <div className="requested-updates">
              {Object.entries(preview.requestedUpdates).map(([key, value]) => (
                <span key={key}>
                  <strong>{key}:</strong> {String(value)}
                </span>
              ))}
            </div>
            <h6>Sample Cases</h6>
            <DataTable
              rowKey="_id"
              columns={sampleColumns}
              data={preview.sampleCases.slice(0, 5)}
              emptyMessage="No sample cases returned"
            />
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {preview ? (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setPreview(null)}
              disabled={submitLoading}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={submitLoading || preview.matchingCount === 0}
            >
              {submitLoading ? "Updating..." : "Confirm Mass Update"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={previewLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handlePreview}
              disabled={previewLoading || !Object.keys(updates).length}
            >
              {previewLoading ? "Previewing..." : "Preview Update"}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CaseMassUpdateModal;
