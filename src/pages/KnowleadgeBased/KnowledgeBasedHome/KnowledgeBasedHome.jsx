import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./KnowledgeBasedHome.scss";
import Button from "../../../components/Button/Button";
import fileIcon from "../../../assets/icons/file-icon.svg";
import videoIcon from "../../../assets/icons/video-icon.svg";
import { HiPlus } from "react-icons/hi";
import { BsThreeDotsVertical } from "react-icons/bs";

import axiosInstance from "@/utils/axiosInstance";
import KNOWLEDGE_ENDPOINTS from "@/api/endpoints/knowledgeEndpoints";
import toast from "react-hot-toast";

// ── Constants ──────────────────────────────────────────────────────────────────
const QUICK_FILTERS = [
  { label: "Doc", value: "doc" },
  { label: "Videos", value: "videos" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const getFileName = (filePath) => {
  if (!filePath) return "—";
  return filePath.split("/").pop();
};

const getFileExtension = (filePath) => {
  if (!filePath) return "";
  return filePath.split(".").pop().toLowerCase();
};

// Derive display category from the actual file extension first, fallback to item.type
const getFileCategory = (item) => {
  const ext = getFileExtension(item.file);
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "aac", "ogg", "m4a"].includes(ext)) return "audio";
  if (["pdf", "doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  // fallback to stored type
  return item.type === "videos" ? "video" : "doc";
};

const BADGE_CONFIG = {
  video: { label: "VIDEO" },
  audio: { label: "AUDIO" },
  doc: { label: "DOC" },
  excel: { label: "EXCEL" },
};

// ── KbCard ─────────────────────────────────────────────────────────────────────
const KbCard = ({ item, onDelete, onDownload }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const category = getFileCategory(item);
  const isVideo = category === "video";
  const badge = BADGE_CONFIG[category] ?? BADGE_CONFIG.doc;

  const displayName = item.title || getFileName(item.file);
  const uploadedBy = item.uploadedBy?.name ?? "—";
  const assignedUser = item.users?.[0]?.name ?? "—";
  const date = formatDate(item.createdAt);

  return (
    <div className="kb-card">
      {/* Top row: icon + menu */}
      <div className="kb-card-top">
        <div className="kb-card-icon-wrap">
          <img
            src={isVideo ? videoIcon : fileIcon}
            alt={category}
            className="kb-card-icon"
          />
        </div>

        <div
          className="kb-card-menu"
          tabIndex={-1}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false);
          }}
        >
          <button
            type="button"
            className="kb-card-menu-trigger"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Card actions"
          >
            <BsThreeDotsVertical size={15} />
          </button>

          {menuOpen && (
            <ul className="kb-card-menu-list">
              <li
                className="kb-card-menu-item"
                onMouseDown={() => {
                  onDownload?.(item);
                  setMenuOpen(false);
                }}
              >
                Download
              </li>
              <li
                className="kb-card-menu-item kb-card-menu-item-danger"
                onMouseDown={() => {
                  onDelete?.(item._id);
                  setMenuOpen(false);
                }}
              >
                Delete
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="kb-card-name">{displayName}</p>

      {/* Meta */}
      <div className="kb-card-meta">
        <span className={`kb-card-type-badge kb-card-type-badge--${category}`}>
          {badge.label}
        </span>
        <span className="kb-card-meta-date">{date}</span>
      </div>

      {/* Note */}
      {item.note && (
        <p className="kb-card-note" title={item.note}>{item.note}</p>
      )}

      {/* Footer */}
      <div className="kb-card-footer">
        <span className="kb-card-footer-label">Assigned</span>
        <span className="kb-card-footer-value">{assignedUser}</span>
      </div>
      <div className="kb-card-footer">
        <span className="kb-card-footer-label">Uploaded by</span>
        <span className="kb-card-footer-value">{uploadedBy}</span>
      </div>
    </div>
  );
};

// ── KbCardSkeleton ─────────────────────────────────────────────────────────────
const KbCardSkeleton = () => (
  <div className="kb-card kb-card--skeleton">
    <div className="kb-card-top">
      <div className="kb-skeleton kb-skeleton--icon" />
    </div>
    <div className="kb-skeleton kb-skeleton--title" />
    <div className="kb-skeleton kb-skeleton--line" />
    <div className="kb-skeleton kb-skeleton--line kb-skeleton--line-short" />
  </div>
);

// ── KnowledgeBasedHome ─────────────────────────────────────────────────────────
const KnowledgeBasedHome = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickFilter, setQuickFilter] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const fetchKnowledgeBase = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(KNOWLEDGE_ENDPOINTS.GET_ALL);
      const data = res.data;
      if (data?.success) {
        setItems(data.data ?? []);
      } else {
        toast.error(data?.message || "Failed to load knowledge base");
      }
    } catch (err) {
      console.error("Failed to fetch knowledge base:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load knowledge base";
      toast.error(typeof msg === "string" ? msg : "Failed to load knowledge base");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKnowledgeBase(); }, []);

  const handleDelete = (id) =>
    setItems((prev) => prev.filter((i) => i._id !== id));

  const handleDownload = async (item) => {
    try {
      const res = await axiosInstance.get(KNOWLEDGE_ENDPOINTS.DOWNLOAD(item._id), {
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const fileName = item.file ? getFileName(item.file) : (item.title || "downloaded-file");
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("File downloaded successfully");
    } catch (err) {
      console.error("Failed to download file:", err);
      toast.error("Failed to download file");
    }
  };

  const filteredItems = items.filter((i) => {
    const matchesType =
      !quickFilter ||
      (quickFilter === "doc" && i.type === "doc") ||
      (quickFilter === "videos" && i.type === "videos");

    const matchesSearch =
      !searchValue.trim() ||
      i.title?.toLowerCase().includes(searchValue.toLowerCase()) ||
      i.note?.toLowerCase().includes(searchValue.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="kb-page">
      <div className="kb-container">

        <div className="kb-header">
          <div className="kb-header-left">
            <h4 className="kb-title">Knowledge Base</h4>
            <p className="kb-subtitle">
              Daily Call Reports track and review Knowledge base activity
            </p>
          </div>
          <div className="kb-header-right">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/knowledge-base/create")}
            >
              <HiPlus size={18} />
              Add New
            </Button>
          </div>
        </div>

        <div className="kb-filter-box">
          <div className="kb-filter-top">
            <div className="kb-search-wrap">
              <input
                className="kb-search-input"
                placeholder="Search by title or note…"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>

          <div className="kb-quick-filter-bar">
            <span className="kb-quick-filter-label">QUICK FILTER:</span>
            <div className="kb-quick-filter-chips">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`kb-quick-chip ${quickFilter === f.value ? "kb-quick-chip-active" : ""}`}
                  onClick={() =>
                    setQuickFilter((prev) => (prev === f.value ? "" : f.value))
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="kb-count-badge">
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="kb-card-container">
          {loading ? (
            <div className="kb-grid">
              {Array.from({ length: 5 }).map((_, i) => (
                <KbCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="kb-empty">
              <p className="kb-empty-text">No knowledge base entries found.</p>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/knowledge-base/create")}
              >
                <HiPlus size={16} /> Add New
              </Button>
            </div>
          ) : (
            <div className="kb-grid">
              {filteredItems.map((item) => (
                <KbCard
                  key={item._id}
                  item={item}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default KnowledgeBasedHome;