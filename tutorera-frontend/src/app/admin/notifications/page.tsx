"use client";
import { UI_COLORS, TEXT_COLORS } from "@/lib/brand";
import { useSocket } from "@/context/SocketContext";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

const C = UI_COLORS;

export default function AdminNotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const router = useRouter();

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: C.primary, margin: 0 }}>Notifications</h1>
          <p style={{ color: C.gray500, fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{ padding: "0.6rem 1.25rem", border: `1.5px solid ${C.border}`, borderRadius: "0.5rem", background: C.surface, cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: C.primary }}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ backgroundColor: C.surface, borderRadius: "0.875rem", border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${C.card}` }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: C.primary, margin: 0 }}>Recent Activity</h2>
        </div>
        {notifications.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Bell size={36} color={C.border} style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ color: C.gray500, fontWeight: 600, margin: 0 }}>No notifications yet</p>
            <p style={{ color: C.gray500, fontSize: "0.8rem", margin: "0.25rem 0 0" }}>New tutor applications and document resubmissions will appear here.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => { markAsRead(notif._id); if (notif.link) router.push(notif.link); }}
              style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${C.card}`, cursor: "pointer", backgroundColor: notif.isRead ? C.surface : C.accentLight, display: "flex", gap: "0.875rem", alignItems: "flex-start" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: notif.type === "verification" ? "#f0fdf4" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1rem" }}>
                {notif.type === "verification" ? "🛡️" : "🔔"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: notif.isRead ? 500 : 700, color: C.primary, fontSize: "0.875rem", margin: "0 0 0.2rem" }}>{notif.title}</p>
                <p style={{ color: TEXT_COLORS.secondary, fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>{notif.message}</p>
                <p style={{ color: C.gray500, fontSize: "0.72rem", margin: "0.3rem 0 0" }}>
                  {new Date(notif.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {!notif.isRead && <div style={{ width: 8, height: 8, backgroundColor: C.accent, borderRadius: "50%", flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
