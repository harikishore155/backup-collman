
import { useOutletContext } from "react-router-dom";
import PreLoader from "@/components/PreLoader/PreLoader";
import "./DetailsTab.scss";

const formatAssignee = (ref) => {
  if (ref == null || ref === "") return "—";
  if (typeof ref === "object") {
    return String(
      ref.name ?? ref.full_name ?? ref.username ?? ref.email ?? ref._id ?? "—",
    );
  }
  return String(ref);
};

const strVal = (v, empty = "—") => {
  if (v == null || v === "") return empty;
  return String(v);
};

const fmtCurrency = (v) => {
  if (v == null || v === "" || v === 0) return "₹0";
  return `₹${Number(v).toLocaleString("en-IN")}`;
};

const fmtPercent = (v) => {
  if (v == null || v === "") return "—";
  return `${Number(v).toFixed(2)}%`;
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const formatTypeLabel = (type) => {
  const t = String(type ?? "").toLowerCase();
  if (t === "REC" || t === "rec") return "REC";
  if (t === "BKT") return "BKT";
  return strVal(type);
};

const typeBadgeClass = (type) => {
  const t = String(type ?? "").toLowerCase();
  if (t === "recovery" || t === "rec") return "rec";
  return "bkt";
};

/* ─── sub-components ─── */

const DetailItem = ({ label, value, valueClass = "" }) => (
  <div className="detail-item">
    <span className="label">{label}</span>
    <span className={`value ${valueClass}`}>{value}</span>
  </div>
);

const MetricCard = ({ label, value, sub }) => (
  <div className="metric-card">
    <span className="metric-value">{value}</span>
    <span className="metric-label">{label}</span>
    {sub && <span className="metric-sub">{sub}</span>}
  </div>
);

/* ─── main component ─── */

const DetailsTab = () => {
  const { campaign, loading } = useOutletContext() ?? {};

  if (loading && !campaign) return <PreLoader />;

  if (!campaign) {
    return (
      <div className="details-tab-content card-container">
        <p className="text-muted mb-0">No allocation details available.</p>
      </div>
    );
  }

  const typeRaw = campaign.type ?? campaign.campaign_type ?? "";

  /* resolve nested ids */
  const clientName =
    typeof campaign.clientId === "object"
      ? (campaign.clientId?.bankName ?? campaign.clientId?.name ?? "—")
      : strVal(campaign.clientId);

  const productName =
    typeof campaign.productId === "object"
      ? (campaign.productId?.productName ?? campaign.productId?.name ?? "—")
      : strVal(campaign.productId);

  const productCode =
    typeof campaign.productId === "object"
      ? (campaign.productId?.code ?? "")
      : "";

  return (
    <div className="details-tab-content">

      {/* ── Section 1: Campaign Info ── */}
      <div className="details-section card-container">
        <h6 className="section-title">Campaign Info</h6>
        <div className="details-grid">
          <DetailItem label="Campaign ID" value={strVal(campaign.campaignId ?? campaign.campaign_id)} />
          <DetailItem label="Client" value={clientName} />
          <DetailItem label="Product" value={productCode ? `${productName} (${productCode})` : productName} />
          <DetailItem label="Branch" value={strVal(campaign.branch)} />
          <DetailItem label="Month / Year" value={strVal(campaign.monthYear ?? campaign.month_year)} />
          <DetailItem label="Allocation Type" value={strVal(campaign.allocationType ?? campaign.allocation_type)} />
          <DetailItem
            label="Type"
            value={
              <span className={`type-badge ${typeBadgeClass(typeRaw)}`}>
                {formatTypeLabel(typeRaw)}
              </span>
            }
          />
          <DetailItem label="Allocated Date" value={fmtDate(campaign.allocatedDate ?? campaign.allocated_date)} />
          <DetailItem label="Closing Date" value={fmtDate(campaign.allocationClosingDate ?? campaign.allocation_closing_date)} />
          <DetailItem label="Working Days" value={strVal(campaign.workingDays ?? campaign.working_days)} />
          <DetailItem label="Cycle" value={strVal(campaign.cycle)} />
          <DetailItem label="Lot No" value={strVal(campaign.lotNo ?? campaign.lot_no)} />
          <DetailItem label="Calling Type" value={strVal(campaign.callingType ?? campaign.calling_type)} />
          <DetailItem label="BKT / REC Type" value={strVal(campaign.bktOrRecType ?? campaign.bkt_or_rec_type)} />
          <DetailItem label="Approval Status" value={strVal(campaign.approvalStatus ?? campaign.approval_status)} />
        </div>
      </div>

      {/* ── Section 2: Targets ── */}
      <div className="details-section card-container">
        <h6 className="section-title">Targets</h6>
        <div className="details-grid">
          <DetailItem label="Resolution Target %" value={fmtPercent(campaign.resolutionTarget ?? campaign.resolution_target ?? campaign.resTarget)} />
          <DetailItem label="NRRB Target %" value={fmtPercent(campaign.nrrbTarget ?? campaign.nrrb_target)} />
          <DetailItem label="CE Target %" value={fmtPercent(campaign.ceTarget ?? campaign.ce_target ?? campaign.ceTargetBkt)} />
          <DetailItem label="Target Value" value={fmtCurrency(campaign.targetValue)} />
          <DetailItem label="To-Go Value" value={fmtCurrency(campaign.toGoValue)} />
        </div>
      </div>

      {/* ── Section 3: Performance Metrics ── */}
      <div className="details-section card-container">
        <h6 className="section-title">Performance Metrics</h6>
        <div className="metrics-row">
          <MetricCard label="RES %" value={fmtPercent(campaign.resPercent)} sub={`To Go: ${fmtPercent(campaign.resToGoPercent)}`} />
          <MetricCard label="NR RB %" value={fmtPercent(campaign.nrRbPercent)} sub={`To Go: ${fmtPercent(campaign.nrRbToGoPercent)}`} />
          <MetricCard label="CE %" value={fmtPercent(campaign.cePercentage)} />
          <MetricCard label="NR %" value={fmtPercent(campaign.nrPercentageNr)} />
          <MetricCard label="RB %" value={fmtPercent(campaign.rbPercentage)} />
          <MetricCard label="RF %" value={fmtPercent(campaign.rfPercentage)} />
          <MetricCard label="ST %" value={fmtPercent(campaign.stPercentage)} />
          <MetricCard label="Contact %" value={fmtPercent(campaign.contactPercent)} />
          <MetricCard label="Non-Contact %" value={fmtPercent(campaign.nonContactPercent)} />
          <MetricCard label="CWIP %" value={fmtPercent(campaign.cwipPercent)} />
          <MetricCard label="RTP %" value={fmtPercent(campaign.rtpPercent)} />
          <MetricCard label="SKIP %" value={fmtPercent(campaign.skipPercent)} />
          <MetricCard label="VTAG %" value={fmtPercent(campaign.vtagPercent)} />
        </div>
      </div>

      {/* ── Section 4: Portfolio Overview ── */}
      <div className="details-section card-container">
        <h6 className="section-title">Portfolio Overview</h6>
        <div className="details-grid">
          <DetailItem label="No. of Customers" value={strVal(campaign.noOfCustomers)} />
          <DetailItem label="Total POS" value={fmtCurrency(campaign.totalPos)} />
          <DetailItem label="Total Collected (CE)" value={fmtCurrency(campaign.totalCollectedCe)} />
          <DetailItem label="Total Norm POS Value" value={fmtCurrency(campaign.totalNormPosValue)} />
          <DetailItem label="Total RB POS Value" value={fmtCurrency(campaign.totalRbPosValue)} />
          <DetailItem label="Total RF POS Value" value={fmtCurrency(campaign.totalRfPosValue)} />
          <DetailItem label="Total ST POS Value" value={fmtCurrency(campaign.totalStPosValue)} />
          <DetailItem label="Total PTP Value" value={fmtCurrency(campaign.totalPtpValue)} />
          <DetailItem label="RES POS Value" value={fmtCurrency(campaign.resPosValue ?? campaign.res_pos_value)} />
          <DetailItem label="NR RB POS Value" value={fmtCurrency(campaign.nrRbPosValue ?? campaign.nr_rb_pos_value)} />
          <DetailItem label="Total TOS" value={fmtCurrency(campaign.totalTos1 ?? campaign.totalTos2)} />
          <DetailItem label="Total SKIP Value" value={fmtCurrency(campaign.totalSkipValue1 ?? campaign.totalSkipValue3)} />
        </div>
      </div>

      {/* ── Section 5: Contact Breakdown ── */}
      <div className="details-section card-container">
        <h6 className="section-title">Contact Breakdown</h6>
        <div className="details-grid">
          <DetailItem label="Total Contact Value" value={fmtCurrency(campaign.totalContactValue)} />
          <DetailItem label="Total Non-Contact Value" value={fmtCurrency(campaign.totalNonContactValue)} />
          <DetailItem label="Total CWIP Value" value={fmtCurrency(campaign.totalCwipValue)} />
          <DetailItem label="Total VTAG Value" value={fmtCurrency(campaign.totalVtagValue)} />
          <DetailItem label="Total Paid Amount" value={fmtCurrency(campaign.totalPaidAmount)} />
          <DetailItem label="PTP POS Value" value={fmtCurrency(campaign.ptpPosValue)} />
          <DetailItem label="Projection Value" value={fmtCurrency(campaign.projectionValue)} />
          <DetailItem label="Blank Contact Status" value={fmtCurrency(campaign.blankContactStatus)} />
          <DetailItem label="Blank Dispo" value={fmtCurrency(campaign.blankDispo)} />
        </div>
      </div>

      {/* ── Section 6: Assignments ── */}
      <div className="details-section card-container">
        <h6 className="section-title">Assign To</h6>
        <div className="details-grid">
          <div className="detail-item">
            <span className="label">Team Leader</span>
            <span className="assignee-badge">
              {formatAssignee(campaign.teamLeader ?? campaign.teamLeaderId ?? campaign.team_leader_id)}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Manager</span>
            <span className="assignee-badge">
              {formatAssignee(campaign.manager ?? campaign.managerId ?? campaign.manager_id)}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Assistant Manager</span>
            <span className="assignee-badge">
              {formatAssignee(campaign.assistantManager ?? campaign.assistantManagerId ?? campaign.assistant_manager_id)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DetailsTab;