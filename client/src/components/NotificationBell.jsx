
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  MessageCircle,
  Heart,
  LoaderCircle,
  X,
} from "lucide-react";
import api from "../services/api";
import socket from "../services/socket";

const getBlogUrl = (notification) =>
  notification.blog?._id
    ? `/blogs/${notification.blog._id}`
    : null;

const NotificationBell = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get("/notifications");

        if (!active) return;

        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setError("");
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load notifications."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const handleNewNotification = (notification) => {
      if (!active) return;

      setNotifications((previous) => {
        if (
          previous.some((item) => item._id === notification._id)
        ) {
          return previous;
        }

        return [notification, ...previous].slice(0, 50);
      });

      setUnreadCount((previous) => previous + 1);
    };

    // Register the listener before connecting.
    socket.on("new-notification", handleNewNotification);

    if (!socket.connected) {
      socket.connect();
    }

    fetchNotifications();

    return () => {
      active = false;
      socket.off("new-notification", handleNewNotification);
    };
  }, []);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await api.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, isRead: true }))
      );

      setUnreadCount(0);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark notifications as read."
      );
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await api.patch(
          `/notifications/${notification._id}/read`
        );

        setNotifications((previous) =>
          previous.map((item) =>
            item._id === notification._id
              ? { ...item, isRead: true }
              : item
          )
        );

        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      setIsOpen(false);

      const blogUrl = getBlogUrl(notification);

      if (blogUrl) {
        navigate(blogUrl);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update this notification."
      );
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100"
      >
        <Bell size={19} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    Notifications
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {unreadCount} unread
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    title="Mark all as read"
                    className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCheck size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close"
                    className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {error && (
                <p className="px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="max-h-[380px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-500">
                    <LoaderCircle size={18} className="animate-spin" />
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                      <Bell size={22} className="text-neutral-500" />
                    </div>
                    <p className="font-medium text-neutral-800">
                      You're all caught up!
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      New likes and comments will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification._id}
                      onClick={() =>
                        handleNotificationClick(notification)
                      }
                      className={`flex w-full gap-3 border-b border-neutral-100 px-4 py-3 text-left transition hover:bg-neutral-50 ${
                        !notification.isRead ? "bg-blue-50/70" : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                        {notification.type === "like" ? (
                          <Heart
                            size={18}
                            className="text-rose-500"
                          />
                        ) : (
                          <MessageCircle
                            size={18}
                            className="text-blue-600"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-5 text-neutral-800">
                          <span className="font-semibold">
                            {notification.sender?.name || "Someone"}
                          </span>{" "}
                          {notification.message
                            ?.replace(
                              `${notification.sender?.name || ""} `,
                              ""
                            ) || "interacted with your blog."}
                        </p>

                        {notification.blog?.title && (
                          <p className="mt-1 truncate text-xs text-neutral-500">
                            {notification.blog.title}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-neutral-400">
                          {notification.createdAt
                            ? new Date(
                                notification.createdAt
                              ).toLocaleString()
                            : ""}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <span
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                          aria-label="Unread"
                        />
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-neutral-100 px-4 py-3">
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-neutral-700 hover:text-black"
                >
                  Explore blogs
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
