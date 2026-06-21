import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PreLoader from "@/components/PreLoader/PreLoader";
import { fetchClientViewApi } from "@/features/clients/clientApi";
import "./UsersTab.scss";

const pickClientRecordFromBody = (body) => {
  if (!body || typeof body !== "object") return null;
  const inner = body.data ?? body.client ?? body.result;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner;
  if (body._id || body.id) return body;
  return null;
};

const looksLikeId = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return true;
  if (/^[a-f0-9]{24}$/i.test(text)) return true;
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      text,
    )
  )
    return true;
  return false;
};

const getClientName = (record) =>
  String(
    record?.bankName ??
      record?.bank_name ??
      record?.client_name ??
      record?.name ??
      "",
  ).trim();

const getDisplayName = (ref) => {
  if (ref == null || ref === "") return "";

  if (typeof ref === "object") {
    const name = String(
      ref.name ??
        ref.fullName ??
        ref.full_name ??
        ref.firstName ??
        ref.lastName ??
        ref.employeeName ??
        ref.employee_name ??
        ref.username ??
        ref.email ??
        "",
    ).trim();
    return looksLikeId(name) ? "" : name;
  }

  const text = String(ref).trim();
  return looksLikeId(text) ? "" : text;
};

const toRefList = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter((item) => item != null && item !== "");
  return [value];
};

const extractTeamLeaders = (record) => {
  const refs = [
    ...toRefList(record?.TL ?? record?.tl ?? record?.teamLeader ?? record?.team_leader),
    ...toRefList(record?.teams ?? record?.team_ids ?? []),
  ];

  return [...new Set(refs.map(getDisplayName).filter(Boolean))];
};

const UsersTab = () => {
  const { id: clientId } = useParams();
  const [clientName, setClientName] = useState("");
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsersTab = async () => {
      if (!clientId) {
        setClientName("");
        setTeamLeaders([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetchClientViewApi(clientId);

        if (response?.success === false) {
          toast.error(response?.message || "Failed to load client details");
          setClientName("");
          setTeamLeaders([]);
          return;
        }

        const record = pickClientRecordFromBody(response);
        if (!record) {
          toast.error(response?.message || "Failed to load client details");
          setClientName("");
          setTeamLeaders([]);
          return;
        }

        setClientName(getClientName(record));
        setTeamLeaders(extractTeamLeaders(record));
      } catch (error) {
        console.error("Failed to load client users tab:", error);
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load client details";
        toast.error(typeof msg === "string" ? msg : "Failed to load client details");
        setClientName("");
        setTeamLeaders([]);
      } finally {
        setLoading(false);
      }
    };

    void loadUsersTab();
  }, [clientId]);

  if (loading) {
    return <PreLoader />;
  }

  return (
    <div className="users-tab-content card-container">
      <div className="info-group">
        <label>Client Name:</label>
        <div className="tags-container">
          {clientName ? (
            <span className="tag">{clientName}</span>
          ) : (
            <span className="empty-text">—</span>
          )}
        </div>
      </div>

      <div className="info-group mt-4">
        <label>Team Leader:</label>
        <div className="tags-container">
          {teamLeaders.length ? (
            teamLeaders.map((leader) => (
              <span key={leader} className="tag">
                {leader}
              </span>
            ))
          ) : (
            <span className="empty-text">No team leader assigned</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersTab;
