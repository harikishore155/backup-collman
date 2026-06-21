import { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import toast from "react-hot-toast";
import Button from "@/components/Button/Button";
import DataTable from "@/components/DataTable/DataTable";
import {
  massDeleteCampaignsApi,
  previewCampaignMassDeleteApi,
} from "@/features/campaigns/campaignApi";
import { isApiFailure } from "@/utils/apiHelpers";
import "../CaseMassDeleteModal/CaseMassDeleteModal.scss";

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
    sampleCampaigns:
      payload?.sampleCampaigns ??
      payload?.sample_campaigns ??
      payload?.campaigns ??
      [],
  };
};

const sampleColumns = [
  {
    key: "campaignId",
    title: "Campaign ID",
    render: (_, row) =>
      row.campaignId ?? row.campaign_id ?? row.code ?? row._id ?? row.id ?? "-",
  },
  {
    key: "product",
    title: "Product",
    render: (_, row) =>
      row.productId?.productName ??
      row.product?.productName ??
      row.productName ??
      row.product_name ??
      "-",
  },
  {
    key: "status",
    title: "Status",
    render: (_, row) => row.status ?? "-",
  },
];

const CampaignMassDeleteModal = ({
  show,
  onClose,
  selectedCampaignIds = [],
  filters = {},
  onSuccess,
}) => {
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasScope =
    selectedCampaignIds.length > 0 || Object.keys(filters ?? {}).length > 0;

  useEffect(() => {
    if (!show) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(null);
  }, [show]);

  const buildScope = () => ({
    filters,
    selectedCampaignIds,
  });

  const handlePreview = async () => {
    if (!hasScope) {
      toast.error("Select at least one campaign or apply a filter");
      return;
    }

    try {
      setPreviewLoading(true);
      const data = await previewCampaignMassDeleteApi(buildScope());
      if (isApiFailure(data)) {
        toast.error(getValidationMessage(data, "Failed to preview mass delete"));
        return;
      }

      const nextPreview = readPreview(data);
      setPreview(nextPreview);
      if (!nextPreview.matchingCount) toast.error("No matching campaigns found");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to preview mass delete"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview || deleteLoading) return;

    try {
      setDeleteLoading(true);
      const data = await massDeleteCampaignsApi({
        ...buildScope(),
        confirm: true,
        expectedCount: preview.matchingCount,
      });
      if (isApiFailure(data)) {
        toast.error(getValidationMessage(data, "Failed to delete campaigns"));
        return;
      }

      const result = data?.data && !Array.isArray(data.data) ? data.data : data;
      const deletedCount = Number(
        result?.deletedCount ?? result?.deleted_count ?? preview.matchingCount,
      );
      toast.success(
        result?.message ?? `${deletedCount} campaign(s) deleted successfully`,
      );
      onSuccess?.({ deletedCount });
    } catch (error) {
      if (error?.response?.status === 409) {
        setPreview(null);
        toast.error("Matching campaigns changed. Please preview again.");
      } else {
        toast.error(getErrorMessage(error, "Failed to delete campaigns"));
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
        <Modal.Title>Mass Delete Campaigns</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!preview ? (
          <>
            <div className="mass-delete-danger">
              This permanently deletes campaigns and cannot be undone.
            </div>
            <div className="mass-delete-scope">
              {selectedCampaignIds.length
                ? `${selectedCampaignIds.length} selected campaign(s)`
                : hasScope
                  ? "Campaigns matching the applied filters"
                  : "Select campaigns or apply filters before previewing"}
            </div>
          </>
        ) : (
          <div className="mass-delete-confirmation">
            <div className="mass-delete-danger">
              You are about to permanently delete {preview.matchingCount}{" "}
              campaigns. This action cannot be undone.
            </div>

            <div className="mass-delete-summary">
              <div>
                <span>Matching Campaigns</span>
                <strong>{preview.matchingCount}</strong>
              </div>
              <div>
                <span>Sample Campaigns</span>
                <strong>
                  {preview.sampleCount || preview.sampleCampaigns.length}
                </strong>
              </div>
            </div>

            <h6>Sample Campaigns</h6>
            <DataTable
              rowKey="_id"
              columns={sampleColumns}
              data={preview.sampleCampaigns.slice(0, 10)}
              emptyMessage="No sample campaigns returned"
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
              disabled={deleteLoading}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirm}
              disabled={deleteLoading || preview.matchingCount === 0}
            >
              {deleteLoading ? "Deleting..." : "Permanently Delete Campaigns"}
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
              disabled={!hasScope || previewLoading}
            >
              {previewLoading ? "Previewing..." : "Preview Delete"}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CampaignMassDeleteModal;
