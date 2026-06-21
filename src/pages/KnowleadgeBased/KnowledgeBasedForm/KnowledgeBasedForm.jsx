
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/Button/Button";
import SelectInput from "@/components/SelectInput/SelectInput";
import "./KnowledgeBasedForm.scss";

import { MdCloudUpload }     from "react-icons/md";
import { MdInsertDriveFile } from "react-icons/md";
import { MdCancel }          from "react-icons/md";

import axiosInstance from "@/utils/axiosInstance";
import KNOWLEDGE_ENDPOINTS from "@/api/endpoints/knowledgeEndpoints";
import toast from "react-hot-toast";

// ── Constants ──────────────────────────────────────────────────────────────────
const TYPE_OPTIONS = [
  { label: "Docs",   value: "doc"    },
  { label: "Videos", value: "videos" },
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Component ──────────────────────────────────────────────────────────────────
const KnowledgeBasedForm = () => {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [docType,  setDocType]  = useState("");
  const [title,    setTitle]    = useState("");
  const [note,     setNote]     = useState("");
  const [users,    setUsers]    = useState("");
  const [teams,    setTeams]    = useState("");
  const [file,     setFile]     = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Options ────────────────────────────────────────────────────────────────
  const [tlOptions,          setTlOptions]          = useState([]);
  const [telecallerOptions,  setTelecallerOptions]  = useState([]);
  const [usersLoading,       setUsersLoading]       = useState(false);

  // ── Submit state ───────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch users and filter by role/designation ─────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res  = await axiosInstance.get("/users");
        const data = res.data;
        const rows = data?.data ?? [];

        const tls = rows
          .filter(
            (u) =>
              u.roleId?.name?.toLowerCase() === "tl" ||
              u.designation?.toLowerCase() === "team leader" ||
              u.designation?.toLowerCase() === "tl"
          )
          .map((u) => ({
            value: u._id,
            label: `${u.name} (${u.employeeId})`,
          }));

        const telecallers = rows
          .filter(
            (u) =>
              u.roleId?.name?.toLowerCase() === "telecaller" ||
              u.designation?.toLowerCase() === "telecaller" ||
              u.designation?.toLowerCase() === "tellcaller"
          )
          .map((u) => ({
            value: u._id,
            label: `${u.name} (${u.employeeId})`,
            teamLeaderId: u.teamLeaderId?._id || null,
          }));

        setTlOptions(tls);
        setTelecallerOptions(telecallers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        toast.error("Failed to load users");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter telecallers based on selected TL (users)
  const filteredTelecallers = users
    ? telecallerOptions.filter((tc) => tc.teamLeaderId === users)
    : telecallerOptions;

  const handleTlChange = (val) => {
    setUsers(val);
    setTeams(""); // reset selected telecaller when TL changes
  };

  // ── File helpers ───────────────────────────────────────────────────────────
  const handleFile = (f) => {
    if (!f) return;
    if (f.size > MAX_SIZE) {
      toast.error("File exceeds 10 MB limit. Please upload a smaller file.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!docType)      { toast.error("Please select a document type"); return; }
    if (!title.trim()) { toast.error("Please enter a title");          return; }
    if (!users)        { toast.error("Please select a user");          return; }
    if (!file)         { toast.error("Please upload a file");          return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("type",  docType);
      formData.append("title", title.trim());
      formData.append("note",  note.trim());
      formData.append("users", users);
      if (teams) formData.append("team", teams);
      formData.append("file",  file);

      const res  = await axiosInstance.post(
        KNOWLEDGE_ENDPOINTS.UPLOAD,
        formData,
        { headers: { "Content-Type": undefined } },
      );

      const data = res.data;
      if (data?.success) {
        toast.success(data.message || "Knowledge base created successfully");
        navigate("/knowledge-base");
      } else {
        toast.error(data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Knowledge base upload error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        err?.message                 ||
        "Upload failed";
      toast.error(typeof msg === "string" ? msg : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="kbf-page">

      {/* ── Header ── */}
      <div className="kbf-header">
        <div className="kbf-header-left">
          <h4 className="kbf-title">Add New</h4>
          <p className="kbf-subtitle">Bring records into the CRM from a CSV file.</p>
        </div>
        <div className="kbf-header-right">
          <Button
            variant="custom"
            size="md"
            onClick={() => navigate("/knowledge-base")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleContinue}
            disabled={submitting || !docType || !title || !users || !file}
          >
            {submitting ? "Uploading…" : "Continue"}
          </Button>
        </div>
      </div>

      {/* ── Top Row: Documents + Assigns ── */}
      <div className="kbf-top-row">

        {/* Documents card */}
        <div className="kbf-card">
          <div className="kbf-card-head">
            <p className="kbf-card-head-title">Documents</p>
          </div>
          <div className="kbf-card-body">

            <div className="kbf-field">
              <label className="kbf-label">Type</label>
              <div className="kbf-type-chips">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`kbf-chip ${docType === opt.value ? "kbf-chip-active" : ""}`}
                    onClick={() => setDocType((p) => (p === opt.value ? "" : opt.value))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="kbf-field">
              <label className="kbf-label">Title</label>
              <input
                className="kbf-input"
                placeholder="Enter title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="kbf-field">
              <label className="kbf-label">Note / use case</label>
              <input
                className="kbf-input"
                placeholder="Enter note or use case"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* Assigns card */}
        <div className="kbf-card">
          <div className="kbf-card-head">
            <p className="kbf-card-head-title">Assigns</p>
          </div>
          <div className="kbf-card-body">

            <div className="kbf-field">
              <label className="kbf-label">Select User</label>
              <SelectInput
                placeholder={usersLoading ? "Loading…" : "Select user (TL)"}
                options={tlOptions}
                value={users}
                onChange={handleTlChange}
                disabled={usersLoading}
                searchable
              />
            </div>

            <div className="kbf-field">
              <label className="kbf-label">Select Telecaller</label>
              <SelectInput
                placeholder={usersLoading ? "Loading…" : "Select telecaller"}
                options={filteredTelecallers}
                value={teams}
                onChange={setTeams}
                disabled={usersLoading}
                searchable
              />
            </div>

          </div>
        </div>

      </div>

      {/* ── Upload File card ── */}
      <div className="kbf-card">
        <div className="kbf-card-head">
          <p className="kbf-card-head-title">Upload your file</p>
        </div>
        <div className="kbf-card-body">

          <div
            className={`kbf-upload-zone ${dragOver ? "kbf-upload-zone-drag" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
            <span className="kbf-upload-icon">
              <MdCloudUpload size={42} />
            </span>
            <p className="kbf-upload-text">
              Drag &amp; drop or{" "}
              <span className="kbf-upload-link">Browse file</span>
            </p>
            <p className="kbf-upload-hint">
              PDF, CSV, Excel, Word, Video (MP4 / MOV), Audio (MP3 / WAV) · Max 10 MB
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.pdf,.doc,.docx,.xls,.xlsx,.mp4,.mov,.avi,.webm,.mp3,.wav,.aac,.ogg,.m4a"
              hidden
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {file && (
            <div className="kbf-file-pill">
              <span className="kbf-file-pill-icon">
                <MdInsertDriveFile size={20} />
              </span>
              <div className="kbf-file-pill-info">
                <span className="kbf-file-pill-name">{file.name}</span>
                <small className="kbf-file-pill-meta">
                  {(file.size / 1024).toFixed(1)} KB
                </small>
              </div>
              <button
                className="kbf-file-pill-remove"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                <MdCancel size={18} />
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default KnowledgeBasedForm;