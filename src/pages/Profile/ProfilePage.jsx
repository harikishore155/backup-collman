import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMail, FiPhone, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader/PageHeader";
import { fetchAuthMeApi } from "@/features/auth/authApi";
import { setAuthUser } from "@/features/auth/authSlice";
import "./ProfilePage.scss";

const text = (value) => (value == null || value === "" ? "-" : String(value));
const dateText = (value) => {
  if (!value) return "-";
  const next = new Date(value);
  if (Number.isNaN(next.getTime())) return text(value);
  return next.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const displayNameFromUser = (user) =>
  user?.name ||
  user?.full_name ||
  user?.user_name ||
  user?.username ||
  user?.email ||
  "User";

const roleText = (user) =>
  text(user?.roleId?.name || user?.role?.name || user?.role || user?.designation);

const avatarText = (user) => {
  const name = displayNameFromUser(user).trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
};

const Field = ({ label, value }) => (
  <div className="profile-field">
    <span className="profile-field__label">{label}</span>
    <span className="profile-field__value">{value}</span>
  </div>
);

const Section = ({ title, children }) => (
  <section className="profile-card">
    <h2 className="profile-card__title">{title}</h2>
    <div className="profile-card__grid">{children}</div>
  </section>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sessionUser = useSelector((state) => state.auth?.user);
  const sessionUserId = sessionUser?._id ?? sessionUser?.id ?? sessionUser?.user_id ?? "";
  const sessionUserRef = useRef(sessionUser);
  const [user, setUser] = useState(sessionUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionUserRef.current = sessionUser;
  }, [sessionUser]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await fetchAuthMeApi();
        const nextUser = response?.data ?? response?.user ?? response;
        const currentUser = sessionUserRef.current;
        const mergedUser = {
          ...(currentUser || {}),
          ...(nextUser || {}),
          role: nextUser?.roleId?.name || nextUser?.role || currentUser?.role || "",
        };
        setUser(mergedUser);
        dispatch(setAuthUser(mergedUser));
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [dispatch, sessionUserId]);

  if (loading && !user) {
    return (
      <section className="profile-page">
        <PageHeader title="My Profile" subtitle="View your account information" />
        <div className="profile-skeleton-stack">
          <div className="profile-skeleton profile-skeleton--hero" />
          <div className="profile-skeleton" />
          <div className="profile-skeleton" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="profile-page">
        <PageHeader title="My Profile" subtitle="View your account information" />
        <div className="profile-empty">Profile information is not available.</div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <PageHeader title="My Profile" subtitle="View your account information" />

      <div className="profile-topbar">
        <button type="button" className="profile-back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft size={15} />
          Back
        </button>

        <div className="profile-hero">
          <div className="profile-hero__avatar">{avatarText(user)}</div>
          <div className="profile-hero__details">
            <p className="profile-hero__name">{displayNameFromUser(user)}</p>
            <p className="profile-hero__sub">{roleText(user)}</p>
          </div>
        </div>
      </div>

      <Section title="Basic Information">
        <Field label="Full Name" value={text(displayNameFromUser(user))} />
        <Field label="Email" value={text(user.email)} />
        <Field label="Phone" value={text(user.phone || user.mobile || user.contactNumber)} />
        <Field label="Employee ID" value={text(user.employeeId || user.UID || user.user_id)} />
      </Section>

      <Section title="Role & Access">
        <Field label="Role" value={roleText(user)} />
        <Field label="Status" value={text(user.status || user.isActive || "Active")} />
        <Field label="Manager" value={text(user.managerId?.name || user.manager?.name || user.managerName)} />
        <Field label="Team Leader" value={text(user.teamLeaderId?.name || user.teamLeader?.name || user.teamLeaderName)} />
      </Section>

      <Section title="Additional Details">
        <Field label="Username" value={text(user.username || user.user_name)} />
        <Field label="Client" value={text(user.clientId?.bankName || user.clientId?.clientName || user.client?.bankName)} />
        <Field label="Created On" value={dateText(user.createdAt || user.created_at)} />
        <Field label="Last Updated" value={dateText(user.updatedAt || user.updated_at)} />
      </Section>

      <div className="profile-summary-card">
        <div className="profile-summary-card__item">
          <FiUser />
          <div>
            <strong>{text(roleText(user))}</strong>
            <span>Current role assignment</span>
          </div>
        </div>
        <div className="profile-summary-card__item">
          <FiMail />
          <div>
            <strong>{text(user.email)}</strong>
            <span>Primary email address</span>
          </div>
        </div>
        <div className="profile-summary-card__item">
          <FiPhone />
          <div>
            <strong>{text(user.phone || user.mobile || user.contactNumber)}</strong>
            <span>Primary contact number</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
