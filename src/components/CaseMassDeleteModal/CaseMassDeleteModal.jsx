import { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import toast from "react-hot-toast";
import Button from "@/components/Button/Button";
import DataTable from "@/components/DataTable/DataTable";
import {
  massDeleteCasesApi,
  previewCaseMassDeleteApi,
} from "@/features/caseUploads/caseUploadApi";
import { isApiFailure } from "@/utils/apiHelpers";
import "./CaseMassDeleteModal.scss";

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
  getValidationMessage(error?.response?.data, error?.message ?? fallback);

const readPreview = (data) => {
  const payload = data?.data && !Array.isArray(data.data) ? data.data : data;
  return {
    matchingCount: Number(
      payload?.matchingCount ?? payload?.matchedCount ?? payload?.count ?? 0,
    ),
    sampleCount: Number(payload?.sampleCount ?? payload?.sample_count ?? 0),
    sampleCases:
      payload?.sampleCases ?? payload?.sample_cases ?? payload?.cases ?? [],
  };
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

const CaseMassDeleteModal = ({
  show,
  onClose,
  selectedCaseIds = [],
  filters = {},
  onSuccess,
}) => {
  const [preview, setPreview] = useState(null);
  const [confirmation, setConfirmation] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasScope =
    selectedCaseIds.length > 0 || Object.keys(filters ?? {}).length > 0;

  useEffect(() => {
    if (!show) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(null);
    setConfirmation("");
  }, [show]);

  const buildScope = () => ({
    filters,
    selectedCaseIds,
  });

  const handlePreview = async () => {
    if (!hasScope) {
      toast.error("Select at least one case or apply a filter");
      return;
    }
    if (selectedCaseIds.length > 5000) {
      toast.error("A maximum of 5000 selected cases can be deleted at once");
      return;
    }

    try {
      setPreviewLoading(true);
      const data = await previewCaseMassDeleteApi(buildScope());
      if (isApiFailure(data)) {
        toast.error(getValidationMessage(data, "Failed to preview mass delete"));
        return;
      }

      const nextPreview = readPreview(data);
      setPreview(nextPreview);
      setConfirmation("");
      if (!nextPreview.matchingCount) toast.error("No matching cases found");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to preview mass delete"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview  || deleteLoading) return;

    try {
      setDeleteLoading(true);
      const data = await massDeleteCasesApi({
        ...buildScope(),
        confirm: true,
        expectedCount: preview.matchingCount,
      });
      if (isApiFailure(data)) {
        toast.error(getValidationMessage(data, "Failed to delete cases"));
        return;
      }

      const result = data?.data && !Array.isArray(data.data) ? data.data : data;
      const deletedCount = Number(
        result?.deletedCount ?? result?.deleted_count ?? preview.matchingCount,
      );
      toast.success(
        result?.message ?? `${deletedCount} case(s) deleted successfully`,
      );
      onSuccess?.({ deletedCount });
    } catch (error) {
      if (error?.response?.status === 409) {
        setPreview(null);
        setConfirmation("");
        toast.error("Matching cases changed. Please preview again.");
      } else {
        toast.error(getErrorMessage(error, "Failed to delete cases"));
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={deleteLoading ? undefined : onClose}
      centered
      size="lg"
      backdrop={deleteLoading ? "static" : true}
      backdropClassName="case-mass-delete-backdrop"
      className="case-mass-delete-modal"
      contentClassName="modal-zoom"
    >
      <Modal.Header closeButton={!deleteLoading}>
        <Modal.Title>Mass Delete Cases</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!preview ? (
          <>
            <div className="mass-delete-danger">
              This permanently deletes cases and cannot be undone.
            </div>
            <div className="mass-delete-scope">
              {selectedCaseIds.length
                ? `${selectedCaseIds.length} selected case(s)`
                : hasScope
                  ? "Cases matching the applied filters"
                  : "Select cases or apply filters before previewing"}
            </div>
          </>
        ) : (
          <div className="mass-delete-confirmation">
            <div className="mass-delete-danger">
              You are about to permanently delete {preview.matchingCount} cases.
              This action cannot be undone.
            </div>

            <div className="mass-delete-summary">
              <div>
                <span>Matching Cases</span>
                <strong>{preview.matchingCount}</strong>
              </div>
              <div>
                <span>Sample Cases</span>
                <strong>{preview.sampleCount || preview.sampleCases.length}</strong>
              </div>
            </div>

            <h6>Sample Cases</h6>
            <DataTable
              rowKey="_id"
              columns={sampleColumns}
              data={preview.sampleCases.slice(0, 10)}
              emptyMessage="No sample cases returned"
            />

            {/* <label className="mass-delete-type-confirmation">
              <span>
                Type <strong>DELETE</strong> to confirm
              </span>
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="DELETE"
                disabled={deleteLoading}
                autoComplete="off"
              />
            </label> */}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {preview ? (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setPreview(null);
                setConfirmation("");
              }}
              disabled={deleteLoading}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirm}
              disabled={
                deleteLoading ||
                preview.matchingCount === 0 
              }
            >
              {deleteLoading ? "Deleting..." : "Permanently Delete Cases"}
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
              variant="danger"
              size="md"
              onClick={handlePreview}
              disabled={!hasScope || previewLoading || selectedCaseIds.length > 5000}
            >
              {previewLoading ? "Previewing..." : "Preview Delete"}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CaseMassDeleteModal;
