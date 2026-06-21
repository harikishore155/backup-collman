import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchNotificationsApi,
  fetchUnreadNotificationCountApi,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from "./notificationApi";

const notificationId = (notification) =>
  String(
    notification?._id ??
      notification?.id ??
      notification?.notificationId ??
      notification?.notification_id ??
      "",
  );

const isUnread = (notification) => {
  if (typeof notification?.isRead === "boolean") return !notification.isRead;
  const status = String(notification?.status ?? notification?.readStatus ?? "")
    .trim()
    .toLowerCase();
  if (status) return status === "unread";
  if (notification?.readAt ?? notification?.read_at) return false;
  return true;
};

const normalizeNotification = (notification) => ({
  ...notification,
  _id: notificationId(notification),
});

const readListPayload = (response, limit = 20) => {
  const payload =
    response?.data && !Array.isArray(response.data) ? response.data : response;
  const rows =
    (Array.isArray(response?.data) && response.data) ||
    payload?.notifications ||
    payload?.rows ||
    payload?.results ||
    [];
  const pagination = payload?.pagination ?? payload?.meta ?? response?.pagination;
  const currentPage = Number(
    pagination?.page ?? pagination?.currentPage ?? payload?.page ?? 1,
  );
  const totalPages = Number(
    pagination?.totalPages ??
      pagination?.pages ??
      payload?.totalPages ??
      currentPage,
  );
  const explicitHasMore =
    pagination?.hasNextPage ?? payload?.hasMore ?? response?.hasMore;

  return {
    rows: rows.map(normalizeNotification).filter((item) => item._id),
    page: currentPage,
    hasMore:
      explicitHasMore ??
      (Number.isFinite(totalPages) && totalPages > currentPage
        ? true
        : rows.length >= limit),
    unreadCount: Number(
      payload?.unreadCount ?? response?.unreadCount ?? Number.NaN,
    ),
  };
};

const errorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

export const fetchNotificationsThunk = createAsyncThunk(
  "notifications/fetch",
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      return readListPayload(
        await fetchNotificationsApi({ page, limit }),
        limit,
      );
    } catch (error) {
      return rejectWithValue(errorMessage(error, "Failed to load notifications"));
    }
  },
);

export const fetchUnreadCountThunk = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchUnreadNotificationCountApi();
      const payload =
        response?.data && !Array.isArray(response.data) ? response.data : response;
      return Number(payload?.unreadCount ?? payload?.count ?? 0);
    } catch (error) {
      return rejectWithValue(errorMessage(error, "Failed to load unread count"));
    }
  },
);

export const markNotificationReadThunk = createAsyncThunk(
  "notifications/markRead",
  async (id, { rejectWithValue }) => {
    try {
      await markNotificationAsReadApi(id);
      return String(id);
    } catch (error) {
      return rejectWithValue(errorMessage(error, "Failed to mark notification read"));
    }
  },
);

export const markAllNotificationsReadThunk = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await markAllNotificationsAsReadApi();
      return true;
    } catch (error) {
      return rejectWithValue(errorMessage(error, "Failed to mark notifications read"));
    }
  },
);

const initialState = {
  items: [],
  unreadCount: 0,
  page: 0,
  hasMore: true,
  loading: false,
  loadingMore: false,
  markAllLoading: false,
  initialized: false,
  error: null,
};

const mergeNotifications = (current, incoming, prepend = false) => {
  const byId = new Map(current.map((item) => [notificationId(item), item]));
  incoming.forEach((item) => {
    const id = notificationId(item);
    if (id) byId.set(id, { ...byId.get(id), ...item, _id: id });
  });
  const incomingIds = new Set(incoming.map(notificationId));
  return prepend
    ? [...incoming.map((item) => byId.get(notificationId(item))), ...current.filter((item) => !incomingIds.has(notificationId(item)))]
    : [...current.filter((item) => !incomingIds.has(notificationId(item))), ...incoming.map((item) => byId.get(notificationId(item)))];
};

const markRead = (state, id) => {
  const item = state.items.find((notification) => notificationId(notification) === id);
  if (item && isUnread(item)) state.unreadCount = Math.max(0, state.unreadCount - 1);
  if (item) {
    item.status = "READ";
    item.readStatus = "READ";
    item.isRead = true;
  }
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    notificationReceived: (state, action) => {
      const notification = normalizeNotification(
        action.payload?.notification ?? action.payload,
      );
      if (!notification._id) return;
      const exists = state.items.some(
        (item) => notificationId(item) === notification._id,
      );
      state.items = mergeNotifications(state.items, [notification], true);
      if (!exists && isUnread(notification)) state.unreadCount += 1;
    },
    notificationReadFromSocket: (state, action) => {
      const id = notificationId(action.payload?.notification ?? action.payload);
      if (id) markRead(state, id);
    },
    notificationsReadAllFromSocket: (state) => {
      state.items.forEach((item) => {
        item.status = "READ";
        item.readStatus = "READ";
        item.isRead = true;
      });
      state.unreadCount = 0;
    },
    notificationUpdated: (state, action) => {
      const notification = normalizeNotification(action.payload);
      if (!notification._id) return;
      const current = state.items.find(
        (item) => notificationId(item) === notification._id,
      );
      if (current && isUnread(current) && !isUnread(notification)) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = mergeNotifications(state.items, [notification], true);
    },
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.pending, (state, action) => {
        const page = action.meta.arg?.page ?? 1;
        if (page > 1) state.loadingMore = true;
        else state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        const { rows, page, hasMore, unreadCount } = action.payload;
        state.items =
          page > 1
            ? mergeNotifications(state.items, rows)
            : mergeNotifications(state.items, rows, true);
        state.page = page;
        state.hasMore = hasMore;
        state.loading = false;
        state.loadingMore = false;
        state.initialized = true;
        if (Number.isFinite(unreadCount)) state.unreadCount = unreadCount;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.initialized = true;
        state.error = action.payload;
      })
      .addCase(fetchUnreadCountThunk.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        markRead(state, action.payload);
      })
      .addCase(markAllNotificationsReadThunk.pending, (state) => {
        state.markAllLoading = true;
      })
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.markAllLoading = false;
        notificationSlice.caseReducers.notificationsReadAllFromSocket(state);
      })
      .addCase(markAllNotificationsReadThunk.rejected, (state) => {
        state.markAllLoading = false;
      });
  },
});

export const {
  notificationReceived,
  notificationReadFromSocket,
  notificationsReadAllFromSocket,
  notificationUpdated,
  resetNotifications,
} = notificationSlice.actions;

export { isUnread, notificationId };
export default notificationSlice.reducer;
