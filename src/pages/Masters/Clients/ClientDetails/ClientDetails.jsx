import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import MultiTabs from "@/components/MultiTabs/MultiTabs";
import IOSSwitch from "@/components/IOSSwitch/IOSSwitch";
import MoreIcon from "@/components/MoreIcon/MoreIcon";
import Breadcrumbs from "@/components/Breadcrumbs/Breadcrumbs";
import BackButton from "@/components/BackButton/BackButton";
import PreLoader from "@/components/PreLoader/PreLoader";
import toast from "react-hot-toast";
import {
  fetchClientViewApi,
  updateClientStatusApi,
  deleteClientApi,
} from "@/features/clients/clientApi";
import "./ClientDetails.scss";

const pickClientRecordFromBody = (body) => {
  if (!body || typeof body !== "object") return null;
  const inner = body.data ?? body.client ?? body.result;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner;
  if (body._id || body.id) return body;
  return null;
};

const ClientDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const loadClient = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await fetchClientViewApi(id);
        if (response?.success === false) {
          toast.error(response?.message || "Failed to fetch client details");
          setClient(null);
          return;
        }
        const record = pickClientRecordFromBody(response);
        if (!record) {
          toast.error(response?.message || "Failed to fetch client details");
          setClient(null);
          return;
        }
        setClient(record);
        const statusRaw = record.status ?? record.is_active ?? record.active;
        setStatus(
          statusRaw === true ||
            String(statusRaw).toLowerCase() === "active",
        );
      } catch (error) {
        console.error("Error fetching client:", error);
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to fetch client details";
        toast.error(typeof msg === "string" ? msg : "Failed to fetch client details");
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    void loadClient();
  }, [id]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.checked;
    try {
      setStatusLoading(true);
      const response = await updateClientStatusApi(id, {
        status: newStatus ? "active" : "inactive",
      });
      if (response?.success) {
        setStatus(newStatus);
        toast.success(response?.message || "Status updated successfully");
      } else {
        toast.error(response?.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update status";
      toast.error(typeof msg === "string" ? msg : "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      const response = await deleteClientApi(id);
      if (response?.success) {
        toast.success(response?.message || "Client deleted successfully");
        navigate("/masters/clients");
      } else {
        toast.error(response?.message || "Failed to delete client");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to delete client";
      toast.error(typeof msg === "string" ? msg : "Failed to delete client");
    }
  };

  const tabs = [
    { label: "Campaigns", path: "campaigns" },
    { label: "Users", path: "users" },
    { label: "Audit logs", path: "audit-logs" },
  ];

  if (loading) {
    return <PreLoader />;
  }

  if (!client) {
    return (
      <div className="client-details-page">
        <Breadcrumbs
          items={[
            { label: "Masters", link: "/masters" },
            { label: "Clients", link: "/masters/clients" },
            { label: "Details" },
          ]}
        />
        <div className="card-container">
          <div className="client-title-row">
            <BackButton />
            <span>Client not found</span>
          </div>
        </div>
      </div>
    );
  }

  const bankName =
    client.bankName ?? client.bank_name ?? client.client_name ?? "—";
  const code =
    client.bankCode ??
    client.bank_code ??
    client.code ??
    client.client_code ??
    "—";
  const clientApiId = String(client._id ?? client.id ?? id ?? "");

  return (
    <div className="client-details-page">
      <div className="client-details-header card-container">
        <div className="header-top">
          <div className="client-info">
            <div className="client-title-row">
              <BackButton />
              <h5>{bankName}</h5>
            </div>
            <div className="client-meta">
              <span>Client ID: {bankName || "—"}</span>
              <span>Code: {code}</span>
            </div>
          </div>

          <MoreIcon
            onEdit={() => navigate(`/masters/clients/edit/${id}`)}
            onDelete={handleDelete}
          />
        </div>

        <div className="header-status">
          <label>Status:</label>
          <div className="status-toggle">
            <IOSSwitch
              checked={status}
              onChange={handleStatusChange}
              disabled={statusLoading}
              color="success"
            />
            <span className={status ? "active" : "inactive"}>
              {status ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="client-details-content mt-2">
        <MultiTabs tabs={tabs} baseDepth={4} />

        <div className="tab-panel-container mt-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
