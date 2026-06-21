import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader/PageHeader";
import { fetchCustomerByIdApi, deleteCustomerApi } from "@/features/customers/customerApi";
import { isApiFailure } from "@/utils/apiHelpers";
import "./CustomerDetails.scss";
import Button from "@/components/Button/Button";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import DeleteModal from "@/components/DeleteModal/DeleteModal";


const fmt = {
  currency: (v) =>
    v == null || v === ""
      ? "—"
      : `₹${Number(v).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
  number: (v) =>
    v == null || v === "" ? "—" : Number(v).toLocaleString("en-IN"),
  percent: (v) =>
    v == null || v === "" ? "—" : `${Number(v).toFixed(2)}%`,
  date: (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d)
      ? "—"
      : d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  },
  text: (v) => (v == null || v === "" ? "—" : String(v)),
  bool: (v) => (v ? "Yes" : "No"),
};


const Field = ({ label, value, badge }) => (
  <div className="cd-field">
    <span className="cd-field__label">{label}</span>
    {badge ? (
      <span className="cd-field__badge">{value ?? "—"}</span>
    ) : (
      <span className="cd-field__value">{value ?? "—"}</span>
    )}
  </div>
);

// ── Section card ──────────────────────────────────────────────────────────────
const Section = ({ title, children, cols = 4 }) => (
  <div className="cd-card">
    <h2 className="cd-card__title">{title}</h2>
    <div className={`cd-card__grid cd-card__grid--cols-${cols}`}>{children}</div>
  </div>
);

// ── main ──────────────────────────────────────────────────────────────────────
const CustomerDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(
    location.state?.customer?._raw ?? null
  );
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomerByIdApi(id);
      if (isApiFailure(data)) {
        toast.error(data?.message || "Failed to load customer");
        return;
      }
      setCustomer(data?.data ?? data);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load customer"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const data = await deleteCustomerApi(id);
      if (isApiFailure(data)) {
        toast.error(data?.message || "Failed to delete customer");
        return;
      }
      toast.success(data?.message || "Customer deleted successfully");
      navigate("/customer-mgt/customers");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  // ── loading skeleton ────────────────────────────────────────────────────────
  if (loading && !customer) {
    return (
      <section className="cd-page">
        <PageHeader
          title="Customer Details"
          subtitle=""
          breadcrumbItems={[{ label: "Home" }, { label: "Customers" }, { label: "Details" }]}
        />
        <div className="cd-skeleton-stack">
          {[260, 180, 220, 160].map((h, i) => (
            <div key={i} className="cd-skeleton-card" style={{ height: h }} />
          ))}
        </div>
      </section>
    );
  }

  if (!customer) {
    return (
      <section className="cd-page">
        <div className="cd-empty">No customer data found.</div>
      </section>
    );
  }

  const c = customer;

  return (
    <section className="cd-page">
      <PageHeader
        title="Customer Details"
        subtitle="Full profile and loan information"
        breadcrumbItems={[
          { label: "Home" },
          {
            label: "Customers",
            onClick: () => navigate("/customer-mgt/customers"),
          },
          { label: c.customerName ?? "Details" },
        ]}
      />

      <div className="cd-topbar">
        <button className="cd-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft size={15} />
          Back
        </button>

        <div className="cd-topbar__name">
          <div className="cd-topbar__avatar">
            {(c.customerName ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="cd-topbar__fullname">{fmt.text(c.customerName)}</p>
            <p className="cd-topbar__sub">
              {fmt.text(c.contactNumber)}&nbsp;·&nbsp;
              {fmt.text(c.accountNumber)}
            </p>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="cd-topbar__actions">
          <Button
            variant="tertiary"
            size="md"
            className="update-btn"
            onClick={() =>
              navigate("/customer-mgt/allocation/update-status", {
                state: { data: { ...customer, _id: id } },
              })
            }
          >
            Update
          </Button>
          <MoreIcon
            onView={() => {}}
            onEdit={() =>
              navigate(`/customer-mgt/customers/edit/${id}`, {
                state: { customer, mode: "edit" },
              })
            }
            onDelete={() => setShowDeleteModal(true)}
          />
        </div>

        <div className="cd-topbar__badges">
          {c.allocationStatus && (
            <span className={`cd-status cd-status--${c.allocationStatus.toLowerCase()}`}>
              {c.allocationStatus}
            </span>
          )}
          {c.misCode && (
            <span className={`cd-status cd-status--${c.misCode.toLowerCase()}`}>
              {c.misCode}
            </span>
          )}
          {c.contactStatus && (
            <span className={`cd-status cd-status--${c.contactStatus.toLowerCase()}`}>
              {c.contactStatus}
            </span>
          )}
        </div>
      </div>

      <Section title="Account & Campaign Info">
        <Field label="Customer Name"   value={fmt.text(c.customerName)} />
        <Field label="Account Number"  value={fmt.text(c.accountNumber)} />
        <Field label="Account ID"      value={fmt.text(c.accountId)} />
        <Field label="Card No"         value={fmt.text(c.cardNo)} />
        <Field
          label="Campaign ID"
          value={
         fmt.text(c.campaignId?.campaignId)

          }
        />
        <Field label="Campaign Status" value={fmt.text(c.campaignId?.status)} />
        <Field label="MIS Code"        value={fmt.text(c.misCode)} />
        <Field label="Contact Number"  value={fmt.text(c.contactNumber)} />
      </Section>


      <Section title="Product & Location">
        <Field label="Product"    value={`${fmt.text(c.productId?.productName)} (${fmt.text(c.productId?.code)})`} />
        <Field label="Client"     value={c.clientId?.bankName ?? "—"} />
        <Field label="Branch"     value={fmt.text(c.branchName)} />
        <Field label="District"   value={fmt.text(c.district)} />

        <Field label="Coll Type"  value={fmt.text(c.collType)} badge />
        <Field label="Origin"     value={fmt.text(c.origin)} />
        <Field label="Vintage"    value={fmt.text(c.vintage)} />
        <Field label="Cycle"      value={fmt.text(c.cycle)} />

        <Field label="Residential Address" value={fmt.text(c.resAddress)} />
        <Field label="Office Address"      value={fmt.text(c.officeAddress) || "—"} />
        <Field label="PMT Address"         value={fmt.text(c.pmtAddress) || "—"} />
        <Field label="Occupation"          value={fmt.text(c.occupation)} />
      </Section>

      <Section title="DPD & Allocation">
        <Field label="DPD"               value={fmt.text(c.dpd)} />
        <Field label="DPD Segment"       value={fmt.text(c.dpdSeg)} />
        <Field label="Paid / Unpaid"     value={fmt.text(c.paidUnpaid)} />
        <Field label="Contact / No Contact" value={fmt.text(c.contactNoContact)} />

        <Field label="Team Leader"       value={fmt.text(c.teamLeaderId?.name)} />
        <Field label="TL Employee ID"    value={fmt.text(c.teamLeaderId?.employeeId)} />
        <Field label="Telecaller ID"     value={fmt.text(c.telecallerId)} />
        <Field label="Emp Name"          value={fmt.text(c.empName)} />

        <Field label="Apr TL Allocation" value={fmt.text(c.aprTlAllocation)} />
        <Field label="May TL Allocation" value={fmt.text(c.mayTlAllocation)} />
        <Field label="Old Feedback"      value={fmt.text(c.oldFeedback)} />
        <Field label="April CRM"         value={fmt.text(c.aprilCrm)} />

        <Field label="Retain / Fresh"    value={fmt.text(c.retainFresh)} badge />
        <Field label="Retain"            value={fmt.bool(c.retain)} />
        <Field label="Is Escalated"      value={fmt.bool(c.isEscalated)} />
        <Field label="Is STAB Case"      value={fmt.bool(c.isStabCase)} />
      </Section>

      <Section title="Financial Details">
        <Field label="Outstanding Amount"    value={fmt.currency(c.outstandingAmount)} />
        <Field label="Outstanding Interest"  value={fmt.currency(c.outstandingInterest)} />
        <Field label="Outstanding Principal" value={fmt.currency(c.outstandingPrincipal)} />
        <Field label="Disbursed Amount"      value={fmt.currency(c.disbursedAmount)} />

        <Field label="POS"               value={fmt.number(c.pos)} />
        <Field label="TOS"               value={fmt.number(c.tos)} />
        <Field label="Waiver %"          value={fmt.percent(c.waiverPercent)} />
        <Field label="1 Month EMI"       value={fmt.currency(c.oneMonthEmi)} />

        <Field label="EMI Amount"             value={fmt.currency(c.emiAmount)} />
        <Field label="Last Month Settlement"  value={fmt.currency(c.lastMonthSettlementAmount)} />
      </Section>


      <Section title="Installment & Dates">
        <Field label="Tenure"            value={fmt.text(c.tenure)} />
        <Field label="Total Installment" value={fmt.text(c.totalInstallment)} />
        <Field label="Installment Paid"  value={fmt.text(c.installmentPaid)} />
        <Field label="Pending EMI"       value={fmt.text(c.pendingEmi)} />

        <Field label="First Disbursement Date" value={fmt.date(c.firstDisbursementDate)} />
        <Field label="Installment Start Date"  value={fmt.date(c.installmentStartDate)} />
        <Field label="Maturity Date"           value={fmt.date(c.maturityDate)} />
        <Field label="Last Paid Date"          value={fmt.date(c.lastPaidDate)} />

        <Field label="Due Date"                value={fmt.date(c.dueDate)} />
      </Section>


      <Section title="Personal Info">
        <Field label="Date of Birth"  value={fmt.date(c.dateOfBirth)} />
        <Field label="Email"          value={fmt.text(c.email) || "—"} />
        <Field label="PAN Card"       value={fmt.text(c.panCard) || "—"} />
        <Field label="Loan Purpose"   value={fmt.text(c.loanPurpose)} />

        <Field label="Relation"       value={fmt.text(c.relation)} />
        <Field label="Relation ID"    value={fmt.text(c.relationId)} />
        <Field label="Group ID"       value={fmt.text(c.groupId)} />
        <Field label="Group Name"     value={fmt.text(c.groupName)} />
      </Section>

      <Section title="Audit" cols={4}>
        <Field label="Last Updated By" value={fmt.text(c.lastUpdatedBy?.name)} />
        <Field label="Employee ID"     value={fmt.text(c.lastUpdatedBy?.employeeId)} />
        <Field label="Last Updated At" value={fmt.date(c.lastUpdatedAt)} />
        <Field label="Created At"      value={fmt.date(c.createdAt)} />
      </Section>

      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleConfirmDelete}
        loading={deleteLoading}
      />
    </section>
  );
};

export default CustomerDetails;