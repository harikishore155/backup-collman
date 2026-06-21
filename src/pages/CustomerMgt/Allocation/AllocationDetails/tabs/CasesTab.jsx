import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import DataTable from "@/components/DataTable/DataTable";
import ListHeader from "@/components/ListHeader/ListHeader";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import { FiPhone, FiMail } from "react-icons/fi";
import Button from "@/components/Button/Button";
import ReplaceCaseUploadModal from "@/components/ReplaceCaseUploadModal/ReplaceCaseUploadModal";
import DeleteCaseUploadModal from "@/components/DeleteCaseUploadModal/DeleteCaseUploadModal";
import { fetchCampaignCustomerListApi } from "@/features/campaigns/campaignApi";
import { fetchRoleByIdApi } from "@/features/roles/roleApi";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import { buildListQueryParams } from "@/utils/listFilterHelpers";

const formatCurrency = (value) => {
  if (value == null || value === "") return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
};

const formatNumber = (value) => {
  if (value == null || value === "") return "—";
  return Number(value).toLocaleString("en-IN");
};

const formatPercent = (value) => {
  if (value == null || value === "") return "—";
  return `${Number(value)}%`;
};

const formatCampaignRef = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(
        ref.campaignId ??
        "",
    );
  }
  return String(ref);
};

const readCampaignObjectId = (raw) => {
  const ref = raw?.campaignId ?? raw?.campaign_id ?? raw?.campaign;
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(ref._id ?? ref.id ?? "");
  }
  return String(ref);
};

const readObjectId = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "object") return String(value._id ?? value.id ?? "");
  return String(value);
};

const readDeletePermission = (permissions) => {
  if (!Array.isArray(permissions)) return null;
  const modulePermission = permissions.find(
    (item) =>
      String(item?.module ?? item?.moduleId ?? item?.name ?? "")
        .toLowerCase()
        .replace(/[\s_-]+/g, "") === "caseuploadallocation",
  );
  if (!modulePermission) return null;

  const actions =
    modulePermission.actions ??
    modulePermission.permissions ??
    modulePermission.access ??
    {};
  if (Array.isArray(actions)) {
    return actions.some(
      (action) =>
        String(
          typeof action === "object"
            ? action?.name ?? action?.permission ?? action?.action
            : action,
        ).toLowerCase() === "delete" &&
        (typeof action !== "object" || action?.enabled !== false),
    );
  }
  return Boolean(actions?.delete ?? actions?.Delete);
};

const readEmbeddedDeletePermission = (user) => {
  for (const permissions of [
    user?.permissions,
    user?.roleId?.permissions,
    user?.role?.permissions,
  ]) {
    const result = readDeletePermission(permissions);
    if (result != null) return result;
  }
  return null;
};

const mapCaseRow = (raw, index) => ({
  _id: raw?._id ?? `row_${index}`,
  name: raw?.customerName ?? raw?.customer_name ?? "—",
  contact: {
    phone: raw?.contactNumber ?? raw?.customerMobile ?? raw?.phone ?? "—",
    email: raw?.email ?? "—",
  },
  accountNo: raw?.accountNumber ?? raw?.accountId ?? raw?.account_no ?? "—",
  campaignId:
    formatCampaignRef(raw?.campaignId ?? raw?.campaign_id ?? raw?.campaign) || "—",
  clientName: raw?.clientId?.bankName ?? "—",
  product: raw?.productId?.productName ?? "—",
  branch: raw?.branchName ?? "—",
  district: raw?.district ?? "—",
  collType: raw?.collType ?? "—",
  dpd: raw?.dpd ?? "—",
  dpdSeg: raw?.dpdSeg ?? "—",
  outstandingAmt: formatCurrency(raw?.outstandingAmount ?? raw?.outstanding_amount),
  outstandingInterest: formatCurrency(raw?.outstandingInterest),
  outstandingPrincipal: formatCurrency(raw?.outstandingPrincipal),
  disbursedAmount: formatCurrency(raw?.disbursedAmount),
  pos: raw?.pos != null ? formatNumber(raw.pos) : "—",
  tos: raw?.tos != null ? formatNumber(raw.tos) : "—",
  oneMonthEmi: raw?.oneMonthEmi != null ? formatCurrency(raw.oneMonthEmi) : "—",
  waiverPercent: raw?.waiverPercent != null ? formatPercent(raw.waiverPercent) : "—",
  tenure: raw?.tenure ?? "—",
  totalInstallment: raw?.totalInstallment ?? "—",
  installmentPaid: raw?.installmentPaid ?? "—",
  pendingEmi: raw?.pendingEmi ?? "—",
  teamLead: raw?.teamLeaderId?.name ?? "—",
  status: String(raw?.status ?? raw?.case_status ?? raw?.caseStatus ?? ""),
  campaignObjectId: readCampaignObjectId(raw),
  raw,
});

const renderCaseChip = (value, modifier = "") => (
  <span className={`table-field-chip case-field-chip ${modifier}`.trim()}>
    {value == null || value === "" ? "—" : value}
  </span>
);

const CasesTab = () => {
  const navigate = useNavigate();
  const { id: campaignId } = useParams();
  const { refetchCampaign } = useOutletContext() ?? {};
  const { user } = useSelector((state) => state.auth || {});
  const [cases, setCases] = useState([]);
  const [totalCases, setTotalCases] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showDeleteUploadModal, setShowDeleteUploadModal] = useState(false);
  const [canDeleteUpload, setCanDeleteUpload] = useState(
    () => readEmbeddedDeletePermission(user) ?? false,
  );

  const fetchCases = useCallback(async () => {
    if (!campaignId) {
      setCases([]);
      setTotalCases(0);
      setListLoading(false);
      return;
    }

    try {
      setListLoading(true);
      const data = await fetchCampaignCustomerListApi(
        campaignId,
        buildListQueryParams({
          searchTerm,
          pageNo,
          rowsPerPage,
          withPagination: true,
        }),
      );

      if (isApiFailure(data)) {
        toast.error(data?.message || data?.error || "Failed to load cases");
        setCases([]);
        setTotalCases(0);
        return;
      }

      const { rows, total } = extractListPayload(data);
      setCases(
        rows
          .map(mapCaseRow)
          .filter((item) => item.campaignObjectId === String(campaignId)),
      );
      setTotalCases(total);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load cases";
      toast.error(typeof msg === "string" ? msg : "Failed to load cases");
      setCases([]);
      setTotalCases(0);
    } finally {
      setListLoading(false);
    }
  }, [campaignId, searchTerm, pageNo, rowsPerPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    const embeddedPermission = readEmbeddedDeletePermission(user);
    if (embeddedPermission != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanDeleteUpload(embeddedPermission);
      return;
    }

    const roleId = readObjectId(user?.roleId);
    if (!roleId) {
      setCanDeleteUpload(false);
      return;
    }

    let active = true;
    const loadPermission = async () => {
      try {
        const data = await fetchRoleByIdApi(roleId);
        const role = data?.data && !Array.isArray(data.data) ? data.data : data;
        if (active) {
          setCanDeleteUpload(readDeletePermission(role?.permissions) ?? false);
        }
      } catch {
        if (active) setCanDeleteUpload(false);
      }
    };

    loadPermission();
    return () => {
      active = false;
    };
  }, [user]);

  const columns = [
    {
      key: "sno",
      title: "S.No",
      dataIndex: "sno",
    },
    {
      key: "name",
      title: "Name",
      render: (_, record) => (
        <span className="case-name-link">{record.name}</span>
      ),
    },
    {
      key: "contact",
      title: "Contact",
      render: (_, record) => (
        <div className="contact-cell">
          <div className="contact-item">
            <FiPhone size={14} />
            <span className="case-phone-link">{record.contact.phone}</span>
          </div>
          <div className="contact-item email">
            <FiMail size={14} />
            <span>{record.contact.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "accountNo",
      title: "Account No",
      render: (_, record) => renderCaseChip(record.accountNo, "account"),
    },
    {
      key: "campaignId",
      title: "Campaign ID",
      render: (_, record) => renderCaseChip(record.campaignId, "campaign"),
    },
    {
      key: "client",
      title: "Client",
      render: (_, record) => renderCaseChip(record.clientName, "client"),
    },
    {
      key: "product",
      title: "Product",
      render: (_, record) => renderCaseChip(record.product, "product"),
    },
    {
      key: "branch",
      title: "Branch",
      render: (_, record) => renderCaseChip(record.branch, "branch"),
    },
    {
      key: "district",
      title: "District",
      render: (_, record) => renderCaseChip(record.district, "district"),
    },
    {
      key: "collType",
      title: "Coll Type",
      render: (_, record) => renderCaseChip(record.collType, "colltype"),
    },
    {
      key: "dpd",
      title: "DPD",
      render: (_, record) => renderCaseChip(record.dpd, "dpd"),
    },
    {
      key: "dpdSeg",
      title: "DPD Segment",
      render: (_, record) => renderCaseChip(record.dpdSeg, "dpd-seg"),
    },
    {
      key: "outstandingAmt",
      title: "Outstanding Amt",
      render: (_, record) => renderCaseChip(record.outstandingAmt, "money"),
    },
    {
      key: "outstandingInterest",
      title: "Outstanding Interest",
      render: (_, record) => renderCaseChip(record.outstandingInterest, "money"),
    },
    {
      key: "outstandingPrincipal",
      title: "Outstanding Principal",
      render: (_, record) => renderCaseChip(record.outstandingPrincipal, "money"),
    },
    {
      key: "disbursedAmount",
      title: "Disbursed Amt",
      render: (_, record) => renderCaseChip(record.disbursedAmount, "money"),
    },
    {
      key: "pos",
      title: "POS",
      render: (_, record) => renderCaseChip(record.pos, "pos"),
    },
    {
      key: "tos",
      title: "TOS",
      render: (_, record) => renderCaseChip(record.tos, "tos"),
    },
    {
      key: "oneMonthEmi",
      title: "1 Month EMI",
      render: (_, record) => renderCaseChip(record.oneMonthEmi, "money"),
    },
    {
      key: "waiverPercent",
      title: "Waiver %",
      render: (_, record) => renderCaseChip(record.waiverPercent, "percent"),
    },
    {
      key: "tenure",
      title: "Tenure",
      render: (_, record) => renderCaseChip(record.tenure, "tenure"),
    },
    {
      key: "totalInstallment",
      title: "Total Installment",
      render: (_, record) => renderCaseChip(record.totalInstallment, "installment"),
    },
    {
      key: "installmentPaid",
      title: "Installment Paid",
      render: (_, record) => renderCaseChip(record.installmentPaid, "installment"),
    },
    {
      key: "pendingEmi",
      title: "Pending EMI",
      render: (_, record) => renderCaseChip(record.pendingEmi, "installment"),
    },
    {
      key: "teamLead",
      title: "Team Lead",
      render: (_, record) => renderCaseChip(record.teamLead, "teamlead"),
    },
    {
      key: "action",
      title: "Action",
      render: (_, record) => (
        <div className="action-cell">
          <Button
            variant="tertiary"
            size="md"
            className="update-btn"
            onClick={() =>
              navigate("/customer-mgt/allocation/update-status", {
                state: { data: record.raw ?? record, caseId: record._id },
              })
            }
          >
            Update
          </Button>
        </div>
      ),
    },
    {
      key: "more",
      title: "",
      render: () => <MoreIcon />,
    },
  ];

  const filteredCases = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return cases;

    return cases.filter((item) =>
      [
        item.name,
        item.contact.phone,
        item.contact.email,
        item.accountNo,
        item.campaignId,
        item.clientName,
        item.product,
        item.branch,
        item.district,
        item.collType,
      ].some((value) => String(value).toLowerCase().includes(search)),
    );
  }, [cases, searchTerm]);

  const tableData = useMemo(
    () =>
      filteredCases.map((item, index) => ({
        ...item,
        sno: (pageNo - 1) * rowsPerPage + index + 1,
      })),
    [filteredCases, pageNo, rowsPerPage],
  );

  return (
    <div className="cases-tab-content">
      <div className="cases-tab-actions">
        <div>
          <h6>Campaign Cases</h6>
          <span>Replace the uploaded case file or manage individual cases.</span>
        </div>
        <div className="cases-upload-actions">
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowReplaceModal(true)}
          >
            Replace Upload
          </Button>
          {canDeleteUpload && (
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowDeleteUploadModal(true)}
            >
              Delete Upload
            </Button>
          )}
        </div>
      </div>

      <ListHeader
        searchValue={searchTerm}
        onSearchChange={(e) => {
          setSearchTerm(e.target.value);
          setPageNo(1);
        }}
        searchPlaceholder="Search..."
        showSearchButton={true}
        onSearch={() => setPageNo(1)}
        showSelect={false}
      />

      <DataTable
        rowKey="_id"
        columns={columns}
        data={tableData}
        className="cases-table"
        loading={listLoading}
      />

      <CustomPagination
        pageNo={pageNo}
        rowsPerPage={rowsPerPage}
        totalCount={totalCases}
        onPageChange={setPageNo}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPageNo(1);
        }}
      />

      <ReplaceCaseUploadModal
        show={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        initialCampaignId={campaignId}
        onSuccess={async () => {
          setShowReplaceModal(false);
          setPageNo(1);
          await fetchCases();
        }}
      />

      {canDeleteUpload && (
        <DeleteCaseUploadModal
          show={showDeleteUploadModal}
          onClose={() => setShowDeleteUploadModal(false)}
          initialCampaignId={campaignId}
          onSuccess={async () => {
            setPageNo(1);
            await Promise.all([fetchCases(), refetchCampaign?.()]);
          }}
        />
      )}
    </div>
  );
};

export default CasesTab;
