import { useOutletContext } from "react-router-dom";
import PreLoader from "@/components/PreLoader/PreLoader";
import { mapApiTypeToForm } from "@/features/targets/targetMappers";

const formatAssignee = (ref) => {
  if (ref == null || ref === "") return null;
  if (typeof ref === "object") {
    return String(
      ref.name ?? ref.full_name ?? ref.username ?? ref.email ?? ref._id ?? "",
    ).trim();
  }
  return null;
};

const strVal = (value, empty = "—") => {
  if (value == null || value === "") return empty;
  return String(value);
};

const collectAssignees = (raw) => {
  const names = [];
  const singles = [
    raw?.employeeId,
    raw?.employee_id,
    raw?.employeeTc,
    raw?.employee_tc,
    raw?.bossId,
    raw?.boss_id,
    raw?.bossMd,
    raw?.boss_md,
    raw?.manager,
    raw?.assistantManagerId,
    raw?.assistant_manager_id,
    raw?.assistantManager,
    raw?.assistant_manager,
    raw?.teamLeaderId,
    raw?.team_leader_id,
    raw?.tl,
    raw?.teamLeader,
    raw?.team_leader,
  ];
  singles.forEach((ref) => {
    const name = formatAssignee(ref);
    if (name) names.push(name);
  });

  const list =
    raw?.assignTo ?? raw?.assign_to ?? raw?.assignedTo ?? raw?.assigned_to;
  if (Array.isArray(list)) {
    list.forEach((ref) => {
      const name = formatAssignee(ref);
      if (name) names.push(name);
    });
  }

  return [...new Set(names)];
};

const DetailsTab = () => {
  const { target, loading } = useOutletContext() ?? {};

  if (loading && !target) {
    return <PreLoader />;
  }

  if (!target) {
    return (
      <div className="details-tab-content">
        <p className="text-muted mb-0">No target details available.</p>
      </div>
    );
  }

  const assignees = collectAssignees(target);
  const typeLabel = mapApiTypeToForm(target?.type ?? target?.target_type);

  const typeTargetMeta = [
    { label: "Type:", value: typeLabel, isBadge: true },
    {
      label: "Product",
      value: strVal(
        target?.productName ??
          target?.product_name ??
          target?.productId?.productName ??
          target?.productId?.name ??
          target?.product?.productName ??
          target?.product?.name ??
          target?.product,
      ),
    },
    {
      label: "Collection Target",
      value: strVal(target?.collectionTarget ?? target?.collection_target),
    },
    {
      label: "Target Resolution %",
      value: strVal(
        target?.targetResolutionPercent ??
          target?.target_resolution_percent ??
          target?.resolutionPercentage ??
          target?.resolution_percentage,
      ),
    },
    {
      label: "NR/RB %",
      value: strVal(
        target?.rbNrTargetPercent ??
          target?.rb_nr_target_percent ??
          target?.nrrbPercentage ??
          target?.nrrb_percentage,
      ),
    },
    {
      label: "FOS",
      value: strVal(
        target?.fosCount ??
          target?.fos_count ??
          target?.fos ??
          target?.cePercentage ??
          target?.ce_percentage,
      ),
    },
    {
      label: "Target 01",
      value: strVal(
        target?.targetAmount ??
          target?.target_amount ??
          target?.target01 ??
          target?.target_01,
      ),
    },
    {
      label: "Target 02",
      value: strVal(
        target?.achievedCollection ??
          target?.achieved_collection ??
          target?.target02 ??
          target?.target_02,
      ),
    },
    { label: "Remarks", value: strVal(target?.remarks) },
  ];

  const basicMeta = [
    {
      label: "Entity",
      value: strVal(
        target?.entity ?? target?.targetName ?? target?.target_name,
      ),
    },
    {
      label: "Bank",
      value: strVal(
        target?.bankName ??
          target?.bank_name ??
          target?.clientId?.bankName ??
          target?.clientId?.name ??
          target?.bank?.bankName ??
          target?.client?.bankName ??
          target?.client,
      ),
    },
    {
      label: "Portfolio",
      value: strVal(
        target?.campaignId?.campaignId ??
          target?.campaignId?.campaignName ??
          target?.campaignId?.name ??
          target?.portfolio?.name ??
          target?.campaign?.campaignName ??
          target?.campaign,
      ),
    },
    { label: "Location", value: strVal(target?.location) },
    {
      label: "Branch",
      value: strVal(
        target?.branchName ?? target?.branch_name ?? target?.branch,
      ),
    },
  ];

  return (
    <div className="details-tab-content">
      <div className="details-section">
        <h6>Basic Target Setup:</h6>
        <div className="target-grid">
          {basicMeta.map((item) => (
            <div className="target-item" key={item.label}>
              <span className="label">{item.label}</span>
              <span className="value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="details-section">
        <h6>Assign To:</h6>
        <div className="details-item">
          <span className="label">Employee:</span>
          <div className="chip-list">
            {assignees.length > 0 ? (
              assignees.map((name) => (
                <span className="chip" key={name}>
                  {name}
                </span>
              ))
            ) : (
              <span className="value">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="details-section">
        <h6>Type &amp; Target:</h6>
        <div className="target-grid">
          {typeTargetMeta.map((item) => (
            <div className="target-item" key={item.label}>
              <span className="label">{item.label}</span>
              <span className={`value ${item.isBadge ? "type-badge" : ""}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailsTab;
