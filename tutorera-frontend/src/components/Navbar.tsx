"use client";

import Image from "next/image";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import s from "./Navbar.module.css";

// Flat top-nav aligned with the Student-First Marketplace spec (§5).
// Supporting depth (Home Tuition / Online Tuition / O Level / A Level / MDCAT /
// Pricing / Research / Guides) now lives in the footer (§51) and inside the
// destination pages themselves, not as mega menus off the top nav.
const primaryLinks = [
  // "Find Tuition" — the tuition-request marketplace landing where students
  // and parents start; points at the PK home-tuition hub since PK is the
  // primary market and /pk/[intent] renders that page.
  { label: "Find Tuition", href: "/pk/home-tuition" },
  { label: "Find Tutors", href: "/tutors" },
  { label: "Subjects", href: "/subjects" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Safety", href: "/safety" },
];

function notificationIcon(type: string) {
  if (type === "verification") return "🛡️";
  if (type === "bid") return "📬";
  if (type === "booking") return "📅";
  if (type === "payment") return "💰";
  return "🔔";
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const { user, logout } = useAuth();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowAccountMenu(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowAccountMenu(false);
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const closeMenus = () => {
    setShowNotifications(false);
    setShowAccountMenu(false);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    closeMenus();
    router.replace("/");
  };

  const dashboardHref = user?.role === "admin"
    ? "/admin"
    : user?.role === "pending"
      ? "/select-role"
      : "/dashboard";
  const profileHref = user?.role === "pending" ? "/select-role" : "/profile";

  // Role-aware "For Tutors" slot on the top nav (§5): tutors see their
  // opportunities feed; everyone else sees the tutor acquisition page.
  const forTutorsHref = user?.role === "tutor" ? "/opportunities" : "/become-a-tutor";
  const forTutorsLabel = user?.role === "tutor" ? "Tuition Opportunities" : "For Tutors";

  return (
    <header ref={navRef} className={s.header}>
      <nav id="main-nav" className={s.nav} aria-label="Main navigation">
        <BrandLogo className={s.logo} imageClassName={s.logoImage} priority />

        {/* Desktop main links — flat per spec §5 */}
        <div className={s.desktopNav}>
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className={s.navLink} onClick={closeMenus}>
              {link.label}
            </Link>
          ))}
          <Link href={forTutorsHref} className={s.navLink} onClick={closeMenus}>
            {forTutorsLabel}
          </Link>
        </div>

        {/* Actions / CTA */}
        <div className={s.desktopActions}>
          <Link
            href="/post-tuition-request"
            className={s.primaryCta}
          >
            <PlusCircle size={16} />
            <span>Post Requirement</span>
          </Link>

          {user ? (
            <>
              <div className={s.notifications}>
                <button
                  type="button"
                  className={s.iconButton}
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                  aria-expanded={showNotifications}
                  onClick={() => { setShowNotifications(!showNotifications); setShowAccountMenu(false); }}
                >
                  <Bell size={20} aria-hidden="true" />
                  {unreadCount > 0 && <span className={s.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className={s.notificationPanel} role="dialog" aria-label="Notifications">
                    <div className={s.notificationHead}>
                      <strong>Notifications</strong>
                      {unreadCount > 0 && <button type="button" onClick={markAllAsRead}>Mark all read</button>}
                    </div>
                    <div className={s.notificationList}>
                      {notifications.length === 0 ? (
                        <p className={s.emptyState}>No notifications yet</p>
                      ) : notifications.slice(0, 8).map((notif) => (
                        <button
                          key={notif._id}
                          type="button"
                          className={notif.isRead ? s.notificationItem : `${s.notificationItem} ${s.unread}`}
                          onClick={() => { markAsRead(notif._id); closeMenus(); if (notif.link) router.push(notif.link); }}
                        >
                          <span aria-hidden="true">{notificationIcon(notif.type)}</span>
                          <span><strong>{notif.title}</strong><em>{notif.message}</em></span>
                        </button>
                      ))}
                    </div>
                    <Link href="/notifications" onClick={closeMenus} className={s.panelFooterLink}>
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>

              <div className={s.accountMenu}>
                <button
                  type="button"
                  className={s.accountButton}
                  aria-label="Account menu"
                  aria-expanded={showAccountMenu}
                  aria-controls="account-menu"
                  onClick={() => { setShowAccountMenu((open) => !open); setShowNotifications(false); }}
                >
                  <span className={s.avatar}>
                    {user.avatar ? <Image src={user.avatar} alt="" width={32} height={32} unoptimized /> : user.name.charAt(0).toUpperCase()}
                  </span>
                  <span>{user.name.split(" ")[0]}</span>
                </button>
                {showAccountMenu && (
                  <div id="account-menu" className={s.accountLinks}>
                    <Link href={dashboardHref} onClick={closeMenus}>
                      <LayoutDashboard size={16} /> {user.role === "student" || user.role === "parent" ? "My Learning" : "Dashboard"}
                    </Link>
                    <Link href={profileHref} onClick={closeMenus}><User size={16} /> {user.role === "pending" ? "Select role" : "Profile"}</Link>
                    {user.role !== "admin" && user.role !== "pending" && <Link href="/chat" onClick={closeMenus}><MessageSquare size={16} /> Messages</Link>}
                    <button type="button" onClick={handleLogout}><LogOut size={16} /> Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className={s.loginLink}>Log in</Link>
              <Link href="/register" className={s.signupLink}>Sign up</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={s.mobileToggle}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </nav>

      {isOpen && (
        <div className={s.mobilePanel}>
          {/* Mobile top action — Post Requirement is priority §6 */}
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
            <Link
              href="/post-tuition-request"
              onClick={closeMenus}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: "#0329b2",
                color: "white",
                padding: "0.85rem",
                borderRadius: "0.5rem",
                fontWeight: 800,
                fontSize: "0.95rem",
                textDecoration: "none",
                minHeight: 48,
              }}
            >
              <PlusCircle size={18} /> Post Requirement
            </Link>
          </div>

          {/* Spec §6 mobile order — wrapped in .mobileGroup so its
              already-defined `a` selector styles rows uniformly. */}
          <div className={s.mobileGroup}>
            <Link href="/tutors" onClick={closeMenus}>Find Tutors</Link>
            <Link href="/pk/home-tuition" onClick={closeMenus}>Home Tuition</Link>
            <Link href="/pk/online-tuition" onClick={closeMenus}>Online Tuition</Link>
            <Link href="/subjects" onClick={closeMenus}>Subjects</Link>
            <Link href="/how-it-works" onClick={closeMenus}>How It Works</Link>
            <Link href="/safety" onClick={closeMenus}>Safety</Link>
            <Link href={forTutorsHref} onClick={closeMenus}>{forTutorsLabel}</Link>
          </div>

          <div className={s.mobileActions}>
            {user ? (
              <>
                <Link href={dashboardHref} onClick={closeMenus}>
                  {user.role === "student" || user.role === "parent" ? "My Learning" : "Dashboard"}
                </Link>
                <Link href="/notifications" onClick={closeMenus}>Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}</Link>
                <button type="button" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeMenus}>Log in</Link>
                <Link href="/register" onClick={closeMenus}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
