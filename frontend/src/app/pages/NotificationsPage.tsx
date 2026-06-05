import { Bell, Package, DollarSign, AlertTriangle, CheckCircle, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { api, type Notification } from "../lib/api";

const iconForType = (type: string) => {
  if (type.includes("stock")) return { Icon: Package, color: "bg-destructive" };
  if (type.includes("payment") || type.includes("credit")) return { Icon: DollarSign, color: "bg-brand-green" };
  if (type.includes("bill")) return { Icon: Bell, color: "bg-primary" };
  return { Icon: AlertTriangle, color: "bg-warning" };
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

export default function NotificationsPage() {
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.notifications({ limit: 50 });
      setNotificationList(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotificationList((list) => list.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const markAllAsRead = async () => {
    await api.markAllNotificationsRead();
    setNotificationList((list) => list.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notificationList.filter((n) => !n.isRead).length;

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-brand-outline w-full sm:w-auto text-sm py-2.5"
          >
            <CheckCircle className="w-5 h-5" />
            Mark All Read
          </button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-bold">{notificationList.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Unread</p>
          <p className="text-2xl font-bold text-primary">{unreadCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Stock Alerts</p>
          <p className="text-2xl font-bold text-warning">
            {notificationList.filter((n) => n.type.includes("stock")).length}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {notificationList.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">No notifications</h3>
            <p className="text-muted-foreground">Notifications appear when stock is low or bills are created.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notificationList.map((notification, index) => {
              const { Icon, color } = iconForType(notification.type);
              return (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`p-6 hover:bg-accent/30 transition-colors ${!notification.isRead ? "bg-primary/5" : ""}`}
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold">{notification.title}</h3>
                            {!notification.isRead && <span className="w-2 h-2 bg-primary rounded-full" />}
                          </div>
                          <p className="text-muted-foreground">{notification.message}</p>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-1.5 hover:bg-accent rounded-lg transition-colors flex-shrink-0"
                            title="Mark as read"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{timeAgo(notification.createdAt)}</span>
                        {!notification.isRead && (
                          <button onClick={() => markAsRead(notification._id)} className="text-sm text-primary hover:underline">
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
