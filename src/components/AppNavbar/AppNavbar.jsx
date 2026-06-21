import { useMemo, useState, useRef, useLayoutEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  IoCheckmarkOutline,
  IoCloseOutline,
  IoNotificationsOutline,
} from "react-icons/io5";
import { IoIosArrowDown } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { FiUser } from "react-icons/fi";
import {
  AppBar,
  CircularProgress,
  Divider,
  Grow,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { APPBAR_CONFIG } from "@/config/appbarConfig";
import { hasRolePermission } from "@/utils/rolePermissionHelpers";
import LogoutModal from "@/components/LogoutModal/LogoutModal";
import {
  actionNotificationApi,
} from "@/features/notifications/notificationApi";
import {
  fetchNotificationsThunk,
  isUnread,
  markAllNotificationsReadThunk,
  markNotificationReadThunk,
  notificationUpdated,
} from "@/features/notifications/notificationSlice";
import loginLogo from "../../assets/images/logo/main_logo.svg";
import "./AppNavbar.scss";

const avatarFromUser = (user) => {
  const raw =
    user?.name ||
    user?.full_name ||
    user?.user_name ||
    user?.username ||
    user?.email ||
    "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "?";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const first = words[0].replace(/[^a-zA-Z]/g, "").charAt(0);
    const last = words[words.length - 1].replace(/[^a-zA-Z]/g, "").charAt(0);
    if (first && last) return `${first}${last}`.toUpperCase();
  }

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
  if (letters.length === 1) return letters.toUpperCase();
  if (trimmed.length >= 2) return trimmed.slice(0, 2).toUpperCase();
  return "?";
};

const displayNameFromUser = (user) =>
  user?.name ||
  user?.full_name ||
  user?.user_name ||
  user?.username ||
  user?.email ||
  "User";

const roleLabelFromUser = (user) => {
  const raw = user?.roleId?.name || user?.role || "";
  if (!raw) return "";
  const str = String(raw);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const notificationDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const detailLabel = (key) =>
  String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const detailValue = (key, value) => {
  if (value == null || value === "") return "";
  if (/At$|Date$|allocatedDate|allocationClosingDate/i.test(key)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    }
  }
  return String(value);
};

const notificationDetails = (notification) => {
  const details = notification?.details;
  if (!details || typeof details !== "object" || Array.isArray(details)) return [];
  return Object.entries(details)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => ({
      key,
      label: detailLabel(key),
      value: detailValue(key, value),
    }));
};

const relatedCampaignId = (notification) =>
  notification?.details?.campaignObjectId ??
  notification?.details?.campaignMongoId ??
  notification?.details?.campaignId ??
  notification?.campaignObjectId ??
  notification?.recordId ??
  notification?.entityId ??
  "";

const isCampaignNotification = (notification) =>
  String(notification?.module ?? notification?.recordType ?? "")
    .toLowerCase()
    .includes("campaign");

const canAccessNavItem = (user, item) =>
  !item.access || hasRolePermission(user, item.access.module, item.access.action);

const filterNavItemsByAccess = (items, user) =>
  items
    .map((item) => {
      const children = item.children?.filter((child) =>
        canAccessNavItem(user, child),
      );

      if (item.children) {
        return children.length ? { ...item, children } : null;
      }

      return canAccessNavItem(user, item) ? item : null;
    })
    .filter(Boolean);

const AppNavbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [visibleNavCount, setVisibleNavCount] = useState(APPBAR_CONFIG.length);
  const [anchorEl, setAnchorEl] = useState(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notificationActionId, setNotificationActionId] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navRef = useRef(null);
  const navLinkRefs = useRef([]);
  const itemWidths = useRef([]);
  const { user } = useSelector((state) => state.auth);
  const navItems = useMemo(() => filterNavItemsByAccess(APPBAR_CONFIG, user), [user]);
  const {
    items: notifications,
    unreadCount,
    page: notificationPage,
    hasMore: hasMoreNotifications,
    loading: notificationsLoading,
    loadingMore: notificationsLoadingMore,
    markAllLoading,
    error: notificationError,
  } = useSelector((state) => state.notifications);

  const avatarLabel = avatarFromUser(user);
  const displayName = displayNameFromUser(user);
  const userEmail = user?.email || "";
  const userRole = roleLabelFromUser(user);
  const profileOpen = Boolean(profileAnchorEl);
  const notificationOpen = Boolean(notificationAnchorEl);
  const hiddenNavItems = navItems.slice(visibleNavCount);
  const hasOverflow = hiddenNavItems.length > 0;

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleProfileOpen = (event) => setProfileAnchorEl(event.currentTarget);
  const handleProfileClose = () => setProfileAnchorEl(null);
  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
    dispatch(fetchNotificationsThunk({ page: 1, limit: 20 }));
  };
  const handleNotificationClose = () => setNotificationAnchorEl(null);
  const handleNotificationRead = async (notification) => {
    if (isUnread(notification)) {
      const result = await dispatch(markNotificationReadThunk(notification._id));
      if (markNotificationReadThunk.rejected.match(result)) {
        toast.error(result.payload || "Unable to mark notification as read");
        return;
      }
    }

    if (isCampaignNotification(notification)) {
      const campaignId = relatedCampaignId(notification);
      if (campaignId) {
        handleNotificationClose();
        navigate(`/customer-mgt/allocation/view/${campaignId}`);
      }
    }
  };
  const handleMarkAllRead = async () => {
    const result = await dispatch(markAllNotificationsReadThunk());
    if (markAllNotificationsReadThunk.rejected.match(result)) {
      toast.error(result.payload || "Unable to mark notifications as read");
    }
  };
  const handleNotificationAction = async (event, notification, action) => {
    event.stopPropagation();
    setNotificationActionId(notification._id);
    try {
      await actionNotificationApi(notification._id, action);
      toast.success(
        action === "approved"
          ? "Campaign approved successfully"
          : "Campaign rejected successfully",
      );
      dispatch(
        notificationUpdated({
          ...notification,
          actionStatus: action.toUpperCase(),
          status: "READ",
          isRead: true,
        }),
      );
      dispatch(fetchNotificationsThunk({ page: 1, limit: 20 }));
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to update notification",
      );
    } finally {
      setNotificationActionId(null);
    }
  };
  const handleLogoutClick = () => {
    handleProfileClose();
    setShowLogoutModal(true);
  };
  const handleProfileNavigate = () => {
    handleProfileClose();
    navigate("/profile");
  };
  const handleDropdownOpen = (event, path) => {
    setDropdownAnchorEl(event.currentTarget);
    setActiveDropdown(path);
  };
  const handleDropdownClose = () => {
    setDropdownAnchorEl(null);
    setActiveDropdown(null);
  };

  const updateVisibleNavCount = () => {
    const navEl = navRef.current;
    if (!navEl) return;

    const availableWidth = navEl.clientWidth;
    if (availableWidth === 0) return;

    // Update stored widths for currently visible items
    navLinkRefs.current.forEach((linkEl, index) => {
      if (linkEl) {
        const width = linkEl.offsetWidth;
        if (width > 0) {
          itemWidths.current[index] = width;
        }
      }
    });

    const moreButtonWidth = 44;
    const gap = 5;
    let usedWidth = 0;
    let count = 0;

    for (let i = 0; i < navItems.length; i++) {
      const width = itemWidths.current[i] || 100; // Fallback for unmeasured items
      const itemFullWidth = width + (i > 0 ? gap : 0);

      // If this is not the last item, we must check if it fits along with the "More" button
      // that might be needed for the remaining items.
      const isLastItem = i === navItems.length - 1;
      const requiredWidth = isLastItem
        ? usedWidth + itemFullWidth
        : usedWidth + itemFullWidth + moreButtonWidth + gap;

      if (requiredWidth <= availableWidth) {
        usedWidth += itemFullWidth;
        count = i + 1;
      } else {
        break;
      }
    }

    if (count === navItems.length - 1) {
      const lastItemWidth =
        (itemWidths.current[navItems.length - 1] || 100) + gap;
      if (usedWidth + lastItemWidth <= availableWidth) {
        count = navItems.length;
      }
    }

    setVisibleNavCount(count);
  };

  useLayoutEffect(() => {
    itemWidths.current = [];
    updateVisibleNavCount();
    const navEl = navRef.current;
    const observer = new ResizeObserver(() => updateVisibleNavCount());
    if (navEl) observer.observe(navEl);
    window.addEventListener("resize", updateVisibleNavCount);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateVisibleNavCount);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navItems.length]);

  return (
    <AppBar position="sticky" elevation={0} className="app-navbar">
      <div className="navbar-container">
        <img src={loginLogo} alt="collman logo" className="login-logo" />

        <nav ref={navRef} className="navbar-primary-nav">
          {navItems.slice(0, visibleNavCount).map(
            ({ title, icon: Icon, path, children }, index) =>
              children ? (
                <div key={path} className="navbar-nav-dropdown-wrapper">
                  <button
                    type="button"
                    className={`navbar-nav-link navbar-nav-dropdown-btn${activeDropdown === path ? " is-open" : ""}`}
                    aria-label={title}
                    aria-haspopup="menu"
                    aria-expanded={activeDropdown === path}
                    onClick={(event) => handleDropdownOpen(event, path)}
                    ref={(element) => {
                      navLinkRefs.current[index] = element;
                    }}
                  >
                    <span className="navbar-nav-icon" aria-hidden>
                      <Icon />
                    </span>
                    <div className="d-flex align-items-end gap-1">
                      <span className="navbar-nav-title">{title}</span>
                      <IoIosArrowDown
                        className="navbar-nav-dropdown-icon"
                        aria-hidden
                      />
                    </div>
                  </button>
                  <Menu
                    className="navbar-dropdown-menu"
                    anchorEl={dropdownAnchorEl}
                    open={activeDropdown === path}
                    onClose={handleDropdownClose}
                    TransitionComponent={Grow}
                    transitionDuration={200}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                  >
                    {children.map(
                      ({
                        title: childTitle,
                        path: childPath,
                        icon: ChildIcon,
                      }) => (
                        <MenuItem
                          key={childPath}
                          component={NavLink}
                          to={`/${childPath}`}
                          onClick={handleDropdownClose}
                          className="navbar-child-icon"
                        >
                          <span>{ChildIcon && <ChildIcon />}</span>
                          {childTitle}
                        </MenuItem>
                      ),
                    )}
                  </Menu>
                </div>
              ) : (
                <NavLink
                  key={path}
                  to={`/${path}`}
                  className={({ isActive }) =>
                    `navbar-nav-link${isActive ? " is-active" : ""}`
                  }
                  aria-label={title}
                  ref={(element) => {
                    navLinkRefs.current[index] = element;
                  }}
                >
                  <span className="navbar-nav-icon" aria-hidden>
                    <Icon />
                  </span>
                  <span className="navbar-nav-title">{title}</span>
                </NavLink>
              ),
          )}

          {hasOverflow && (
            <>
              <IconButton
                size="small"
                aria-label="More navigation"
                onClick={handleMenuOpen}
                className="navbar-more-btn"
              >
                <MoreHorizIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                TransitionComponent={Grow}
                transitionDuration={200}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                className="navbar-dropdown-menu"
              >
                {hiddenNavItems
                  .flatMap((item) =>
                    item.children
                      ? item.children.map((child) => ({
                          title: child.title,
                          path: child.path,
                          icon: child.icon,
                        }))
                      : [item],
                  )
                  .map(({ title, icon: Icon, path }) => (
                    <MenuItem
                      key={path}
                      component={NavLink}
                      to={`/${path}`}
                      onClick={handleMenuClose}
                      className="navbar-child-icon"
                    >
                      {Icon && <Icon />}
                      {title}
                    </MenuItem>
                  ))}
              </Menu>
            </>
          )}
        </nav>

        <div className="navbar-icons">
          <button
            type="button"
            className={`navbar-icon-btn navbar-notification-btn${notificationOpen ? " is-open" : ""}`}
            aria-label="Notifications"
            aria-haspopup="menu"
            aria-expanded={notificationOpen}
            onClick={handleNotificationOpen}
          >
            <IoNotificationsOutline aria-hidden />
            {unreadCount > 0 && (
              <span className="navbar-notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <Menu
            className="navbar-notification-menu"
            anchorEl={notificationAnchorEl}
            open={notificationOpen}
            onClose={handleNotificationClose}
            TransitionComponent={Grow}
            transitionDuration={200}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <div className="navbar-notification-header">
              <div>
                <strong>Notifications</strong>
                <span>
                  {unreadCount > 0
                    ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                    : "You are all caught up"}
                </span>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markAllLoading}
                >
                  {markAllLoading ? "Marking..." : "Mark all as read"}
                </button>
              )}
            </div>
            <Divider />
            {notificationsLoading ? (
              <div className="navbar-notification-state">
                <CircularProgress size={24} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="navbar-notification-state">
                {notificationError ? (
                  <button
                    type="button"
                    className="navbar-notification-retry"
                    onClick={() =>
                      dispatch(fetchNotificationsThunk({ page: 1, limit: 20 }))
                    }
                  >
                    Unable to load notifications. Retry
                  </button>
                ) : (
                  "No notifications"
                )}
              </div>
            ) : (
              notifications.map((notification) => {
                const actionStatus = String(
                  notification.actionStatus || notification.action_status || "",
                ).toUpperCase();
                const isActionPending =
                  notification.recordType === "Campaign" &&
                  (!actionStatus || actionStatus === "PENDING");
                const isApproved = actionStatus === "APPROVED";
                const isRejected = actionStatus === "REJECTED";

                return (
                <div
                  key={notification._id}
                  className={`navbar-notification-item${isUnread(notification) ? " is-unread" : ""}${isApproved ? " is-approved" : ""}${isRejected ? " is-rejected" : ""}`}
                  onClick={() => handleNotificationRead(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleNotificationRead(notification);
                  }}
                >
                  <span className="navbar-notification-icon" aria-hidden>
                    <IoNotificationsOutline />
                  </span>
                  <span className="navbar-notification-content">
                    <span className="navbar-notification-meta">
                      <span className="navbar-notification-module">
                        {notification.module || notification.recordType || "Update"}
                      </span>
                      <small>
                        {notificationDate(
                          notification.createdAt ??
                            notification.created_at ??
                            notification.timestamp,
                        )}
                      </small>
                    </span>
                    <strong>{notification.title || notification.module}</strong>
                    <span className="navbar-notification-message">
                      {notification.message}
                    </span>
                    {notificationDetails(notification).length > 0 && (
                      <span className="navbar-notification-details">
                        {notificationDetails(notification).map((detail) => (
                          <span key={detail.key}>
                            <small>{detail.label}</small>
                            <strong>{detail.value}</strong>
                          </span>
                        ))}
                      </span>
                    )}
                    {isActionPending && (
                      <span className="navbar-notification-actions">
                        <button
                          type="button"
                          className="notification-action approve"
                          disabled={notificationActionId === notification._id}
                          onClick={(event) =>
                            handleNotificationAction(event, notification, "approved")
                          }
                        >
                          <IoCheckmarkOutline aria-hidden />
                          Approve
                        </button>
                        <button
                          type="button"
                          className="notification-action reject"
                          disabled={notificationActionId === notification._id}
                          onClick={(event) =>
                            handleNotificationAction(event, notification, "rejected")
                          }
                        >
                          <IoCloseOutline aria-hidden />
                          Reject
                        </button>
                      </span>
                    )}
                    {(isApproved || isRejected) && (
                      <span
                        className={`navbar-notification-action-status ${isApproved ? "approved" : "rejected"}`}
                      >
                        {isApproved ? (
                          <IoCheckmarkOutline aria-hidden />
                        ) : (
                          <IoCloseOutline aria-hidden />
                        )}
                        {isApproved ? "Approved" : "Rejected"}
                      </span>
                    )}
                  </span>
                </div>
                );
              })
            )}
            {!notificationsLoading && hasMoreNotifications && (
              <div className="navbar-notification-load-more">
                <button
                  type="button"
                  disabled={notificationsLoadingMore}
                  onClick={() =>
                    dispatch(
                      fetchNotificationsThunk({
                        page: notificationPage + 1,
                        limit: 20,
                      }),
                    )
                  }
                >
                  {notificationsLoadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </Menu>

          <button
            type="button"
            className={`navbar-user-avatar${profileOpen ? " is-open" : ""}`}
            aria-label="Account"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={handleProfileOpen}
          >
            {avatarLabel}
          </button>
          <Menu
            className="navbar-profile-menu"
            anchorEl={profileAnchorEl}
            open={profileOpen}
            onClose={handleProfileClose}
            TransitionComponent={Grow}
            transitionDuration={200}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <div
              className="navbar-profile-header"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="navbar-profile-avatar">{avatarLabel}</div>
              <div className="navbar-profile-details">
                <p className="navbar-profile-name">{displayName}</p>
                {userEmail && (
                  <p className="navbar-profile-email">{userEmail}</p>
                )}
                {userRole && (
                  <p className="navbar-profile-role">{userRole}</p>
                )}
              </div>
            </div>
            <Divider className="navbar-profile-divider" />
            <MenuItem
              onClick={handleProfileNavigate}
              className="navbar-profile-action"
            >
              <FiUser aria-hidden /> {" "}
              <span> My Profile</span>
            </MenuItem>
            <MenuItem
              onClick={handleLogoutClick}
              className="navbar-profile-logout"
            >
              <MdLogout aria-hidden />
              <span>Logout</span>
            </MenuItem>
          </Menu>
          <LogoutModal
            show={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
          />
        </div>
      </div>
    </AppBar>
  );
};

export default AppNavbar;
