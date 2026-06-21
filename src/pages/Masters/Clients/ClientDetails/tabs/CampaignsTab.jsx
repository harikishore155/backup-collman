import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";
import CAMPAIGN_ENDPOINTS from "@/api/endpoints/campaignEndpoints";
import DataTable from "@/components/DataTable/DataTable";
import ListHeader from "@/components/ListHeader/ListHeader";
import FilterBar from "@/components/FilterBar/FilterBar";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import CustomPagination from "@/components/CustomPagination/CustomPagination";
import { toListStatus } from "@/utils/formatters";
import { extractListPayload } from "@/utils/apiHelpers";
import {
  applyAdvancedFilters,
  matchesStatusFilters,
} from "@/utils/listFilterHelpers";
import {
  buildCampaignsFilterConfig,
  CAMPAIGN_FILTER_RULES,
} from "@/config/listFilterConfigs";

const formatProductRef = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(
      ref.productName ??
        ref.product_name ??
        ref.name ??
        ref.code ??
        ref.productCode ??
        "",
    );
  }
  return String(ref);
};

const formatBranchRef = (ref) => {
  if (ref == null || ref === "") return "";
  if (typeof ref === "object") {
    return String(ref.branch ?? ref.branch_name ?? ref.name ?? ref.code ?? "");
  }
  return String(ref);
};

const renderCampaignChip = (value, modifier = "") => (
  <span className={`table-field-chip ${modifier}`.trim()}>
    {value == null || value === "" ? "â€”" : value}
  </span>
);

const mapCampaignRow = (raw, index) => {
  const _id = raw?._id ?? raw?.id ?? raw?.uuid ?? `row_${index}`;
  const campaignId =
    raw?.campaignId ??
    raw?.campaign_id ??
    raw?.code ??
    raw?.campaign_code ??
    _id;
  const branch = formatBranchRef(
    raw?.branch ?? raw?.branch_id ?? raw?.branchId ?? raw?.branch_name,
  );
  const product = formatProductRef(
    raw?.product ?? raw?.product_id ?? raw?.productId ?? raw?.product_name,
  );
  const type = String(
    raw?.type ?? raw?.campaign_type ?? raw?.campaignType ?? "",
  ).toUpperCase();
  const status = toListStatus(raw?.status ?? raw?.is_active ?? raw?.active);

  return {
    _id: String(_id),
    campaignId: String(campaignId),
    branch,
    product,
    type,
    status,
  };
};

const CampaignsTab = () => {
  const navigate = useNavigate();
  const { id: clientId } = useParams();
  const [campaigns, setCampaigns] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [filters, setFilters] = useState({});
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchCampaigns = async () => {
    if (!clientId) {
      setCampaigns([]);
      setListLoading(false);
      return;
    }

    try {
      setListLoading(true);

      const response = await axiosInstance.get(
        CAMPAIGN_ENDPOINTS.LIST_BY_CLIENT(clientId),
      );
      const data = response.data;

      if (data?.success === false) {
        toast.error(data?.message || data?.error || "Failed to load campaigns");
        setCampaigns([]);
        return;
      }

      const { rows } = extractListPayload(data);
      setCampaigns(rows.map(mapCampaignRow));
    } catch (error) {
      console.error("Failed to fetch campaigns", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load campaigns";
      toast.error(typeof msg === "string" ? msg : "Failed to load campaigns");
      setCampaigns([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [clientId]);

  const campaignColumns = [
    { key: "sno", title: "S.No", dataIndex: "sno" },
    {
      key: "campaignId",
      title: "Campaign ID",
      render: (_, record) => renderCampaignChip(record.campaignId, "campaign"),
    },
    {
      key: "branch",
      title: "Branch",
      render: (_, record) => renderCampaignChip(record.branch, "branch"),
    },
    {
      key: "product",
      title: "Product",
      render: (_, record) => renderCampaignChip(record.product, "product"),
    },
    {
      key: "type",
      title: "Type",
      render: (_, record) => (
        <span className={`type-badge ${record.type?.toLowerCase()}`}>
          {record.type || "—"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_, record) => (
        <span className={`status-badge ${record.status?.toLowerCase()}`}>
          {record.status}
        </span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (_, record) => (
        <MoreIcon
          onView={() =>
            navigate(`/customer-mgt/allocation/view/${record._id}`)
          }
          onEdit={() => navigate(`edit/${record._id}`)}
        />
      ),
    },
  ];

  const filterConfig = useMemo(
    () => buildCampaignsFilterConfig(campaigns),
    [campaigns],
  );

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPageNo(1);
  };

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return campaigns.filter((item) => {
      const matchesStatus = matchesStatusFilters(
        filterStatus,
        filters.status,
        item.status,
      );
      const matchesSearch =
        !normalizedSearch ||
        [item.campaignId, item.branch, item.product, item.type].some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );
      const matchesAdvanced = applyAdvancedFilters(
        item,
        filters,
        CAMPAIGN_FILTER_RULES,
      );

      return matchesStatus && matchesSearch && matchesAdvanced;
    });
  }, [campaigns, filterStatus, searchTerm, filters]);

  const totalCount = filteredCampaigns.length;
  const paginatedCampaigns = useMemo(() => {
    return filteredCampaigns
      .slice((pageNo - 1) * rowsPerPage, pageNo * rowsPerPage)
      .map((item, index) => ({
        ...item,
        sno: (pageNo - 1) * rowsPerPage + index + 1,
      }));
  }, [filteredCampaigns, pageNo, rowsPerPage]);

  return (
    <div className="campaigns-tab-content">
      <ListHeader
        className="campaigns-list-header"
        selectValue={filterStatus}
        selectOptions={[
          { value: "All", label: "All" },
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ]}
        onSelectChange={(value) => {
          setFilterStatus(value);
          setPageNo(1);
        }}
        searchValue={searchTerm}
        onSearchChange={(event) => {
          setSearchTerm(event.target.value);
          setPageNo(1);
        }}
        searchPlaceholder="Search..."
        onSearch={() => setPageNo(1)}
        onFiltersClick={(e) => setFilterAnchor(e.currentTarget)}
        filterLabel="Filters"
        showSearchButton={true}
      />

      <FilterBar
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        config={filterConfig}
        filters={filters}
        onApply={handleApplyFilters}
        showButton={false}
      />

      <DataTable
        rowKey="_id"
        columns={campaignColumns}
        data={paginatedCampaigns}
        className="campaigns-table"
        wrapperClassName="campaigns-table-wrapper"
        loading={listLoading}
      />

      <CustomPagination
        pageNo={pageNo}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPageNo}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPageNo(1);
        }}
      />
    </div>
  );
};

export default CampaignsTab;
