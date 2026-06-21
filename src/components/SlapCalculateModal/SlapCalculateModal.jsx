// 

import { useCallback, useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "@/components/Button/Button";
import SelectInput from "@/components/SelectInput/SelectInput";
import "./SlapCalculateModal.scss";
import axiosInstance from "@/utils/axiosInstance";
import INCENTIVE_ENDPOINTS from "@/api/endpoints/incentiveEndpoints";
import CAMPAIGN_ENDPOINTS from "@/api/endpoints/campaignEndpoints";
import { filterActiveCampaigns } from "@/features/campaigns/campaignApi";
import toast from "react-hot-toast";
import { LuLoader } from "react-icons/lu";

const typeOptions = [
  { value: "BKT", label: "BKT" },
  { value: "REC", label: "REC" },
];

const SlapCalculateModal = ({ show, onHide }) => {
  const [campaign, setCampaign]       = useState("");
  const [month, setMonth]             = useState("");
  const [bank, setBank]               = useState("");
  const [type, setType]               = useState("");
  const [calculating, setCalculating] = useState(false);

  const [campaignList, setCampaignList]         = useState([]);
  const [campaignOptions, setCampaignOptions]   = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res  = await axiosInstance.get(CAMPAIGN_ENDPOINTS.LIST, {
        params: { status: "active" },
      });
      const list = filterActiveCampaigns(res.data?.data ?? []);
      setCampaignList(list);
      setCampaignOptions(
        list.map((c) => ({ value: c._id, label: c.campaignId }))
      );
    } catch (error) {
      console.error("Fetch campaigns error:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) fetchCampaigns();
  }, [show, fetchCampaigns]);

  const handleCampaignChange = (selectedId) => {
    setCampaign(selectedId);
    const found = campaignList.find((c) => c._id === selectedId);
    if (!found) {
      setMonth("");
      setBank("");
      setType("");
      return;
    }
    setMonth(found.monthYear ?? "");
    setBank(found.clientId?.bankName ?? "");
    setType(found.type ?? "");
  };

  const handleCalculate = async () => {
    if (!campaign) {
      toast.error("Please select a campaign");
      return;
    }
    if (!month.trim()) {
      toast.error("Month could not be determined from the selected campaign");
      return;
    }
    if (!bank) {
      toast.error("Bank / Client could not be determined from the selected campaign");
      return;
    }
    if (!type) {
      toast.error("Please select a type");
      return;
    }

    setCalculating(true);
    try {
      const res  = await axiosInstance.post(
        INCENTIVE_ENDPOINTS.CALCULATE_INCENTIVE,
        { month, bank, type, campaign }
      );
      const data = res.data;

      if (data?.success) {
        const run = data?.data?.run;
        toast.success(
          `${data.message} — ${run?.processedEmployees ?? 0} employees processed, total collection: ${run?.totalCollection ?? 0}`
        );
        handleCancel();
      } else {
        toast.error(data?.message || "Calculation failed");
      }
    } catch (error) {
      console.error("Calculate error:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Calculation failed";
      toast.error(typeof msg === "string" ? msg : "Calculation failed");
    } finally {
      setCalculating(false);
    }
  };

  const handleCancel = () => {
    setCampaign("");
    setMonth("");
    setBank("");
    setType("");
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleCancel}
      centered
      className="slap-calculate-modal"
      backdropClassName="slap-calculate-backdrop"
      enforceFocus={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>Slab Calculate</Modal.Title>
      </Modal.Header>

      <Modal.Body>

        {/* Campaign */}
        <div className="form-field">
          <label className="field-label">Campaign</label>
          {campaignsLoading ? (
            <div className="campaigns-loading">
              <LuLoader className="loading-icon spin" />
              <span>Loading campaigns…</span>
            </div>
          ) : (
            <SelectInput
              value={campaign}
              options={campaignOptions}
              placeholder="Select Campaign"
              onChange={handleCampaignChange}
              disabled={calculating}
            />
          )}
        </div>

        {/* Month — auto-filled, read-only */}
        <div className="form-field">
          <label className="field-label">Month</label>
          <input
            type="text"
            placeholder="Auto-filled from campaign"
            className={`month-input ${month ? "auto-filled" : ""}`}
            value={month}
            readOnly
          />
        </div>

        {/* Bank / Client — auto-filled, read-only */}
        <div className="form-field">
          <label className="field-label">Bank / Client</label>
          <input
            type="text"
            placeholder="Auto-filled from campaign"
            className={`month-input ${bank ? "auto-filled" : ""}`}
            value={bank}
            readOnly
          />
        </div>

        {/* Type */}
        <div className="form-field">
          <label className="field-label">Type</label>
          <SelectInput
            value={type}
            options={typeOptions}
            placeholder="Select Type"
            onChange={setType}
            disabled={calculating}
          />
        </div>

      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleCancel}
          disabled={calculating}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleCalculate}
          disabled={calculating || campaignsLoading}
        >
          {calculating ? "Calculating..." : "Calculate"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SlapCalculateModal;
