import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  fetchNotificationsThunk,
  fetchUnreadCountThunk,
  notificationReadFromSocket,
  notificationReceived,
  notificationsReadAllFromSocket,
  notificationId,
  resetNotifications,
} from "@/features/notifications/notificationSlice";

const socketUrl = () => {
  const configured = import.meta.env.VITE_SOCKET_URL;
  if (configured) return configured;
  return String(import.meta.env.VITE_BASE_URL ?? "").replace(/\/api\/v1\/?$/, "");
};

const NotificationSocket = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth || {});
  const userId = user?._id ?? user?.id ?? user?.user_id ?? "";
  const notifications = useSelector((state) => state.notifications.items);
  const knownIds = useRef(new Set());

  useEffect(() => {
    knownIds.current = new Set(notifications.map(notificationId).filter(Boolean));
  }, [notifications]);

  useEffect(() => {
    if (!token || !userId) {
      dispatch(resetNotifications());
      return undefined;
    }

    dispatch(fetchNotificationsThunk({ page: 1, limit: 20 }));
    dispatch(fetchUnreadCountThunk());

    const socket = io(socketUrl(), {
      auth: { token },
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    const handleNew = (payload) => {
      const notification = payload?.notification ?? payload?.data ?? payload;
      const id = notificationId(notification);
      if (id && knownIds.current.has(id)) return;
      if (id) knownIds.current.add(id);
      dispatch(notificationReceived(notification));
      toast(notification?.title || notification?.message || "New notification");
    };
    const handleRead = (payload) => dispatch(notificationReadFromSocket(payload));
    const handleReadAll = () => dispatch(notificationsReadAllFromSocket());
    const handleConnectError = (error) => {
      console.warn("Notification socket connection failed:", error?.message);
    };

    socket.on("notification:new", handleNew);
    socket.on("notification:read", handleRead);
    socket.on("notification:read-all", handleReadAll);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("notification:new", handleNew);
      socket.off("notification:read", handleRead);
      socket.off("notification:read-all", handleReadAll);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [dispatch, token, userId]);

  return null;
};

export default NotificationSocket;
