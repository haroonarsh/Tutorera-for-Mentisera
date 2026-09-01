"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, BriefcaseBusiness, ChevronDown, GraduationCap, LayoutDashboard, LogOut, Menu, MessageSquare, Search, ShieldCheck, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import s from "./Navbar.module.css";

type MegaKey = "students" | "tutors" | "resources" | null;

const megaMenus = [
  {
    key: "students" as MegaKey,
    label: "For students",
    eyebrow: "Find learning support",
    title: "Start with your need, then compare tutor offers.",
    icon: GraduationCap,
    featured: { label: "Post a tuition request", href: "/dashboard?tab=requests", desc: "Set subject, schedule, mode, and proposed rate." },
    groups: [
      { title: "Discover tutors", links: [
        { label: "Browse tutors", href: "/tutors", desc: "Search verified tutor profiles." },
        { label: "Tutors by city", href: "/locations", desc: "Explore coverage across Pakistan." },
        { label: "Subjects", href: "/subjects", desc: "Maths, sciences, languages, skills." },
        { label: "Levels", href: "/levels", desc: "Matric, FSc, O/A-Level, university." },
      ] },
      { title: "Choose safely", links: [
        { label: "How offers work", href: "/how-tutor-offers-work", desc: "Understand offers, counters, and booking." },
        { label: "Services", href: "/services", desc: "Review tutoring services and PKR pricing." },
        { label: "Parent guide", href: "/help/for-parents", desc: "Practical help for families." },
        { label: "First-session guarantee", href: "/first-session-guarantee", desc: "Know what happens after booking." },
        { label: "Pricing", href: "/pricing", desc: "Platform pricing and fee clarity." },
      ] },
    ],
  },
  {
    key: "tutors" as MegaKey,
    label: "For tutors",
    eyebrow: "Grow professionally",
    title: "Find real requests and send relevant tutor offers.",
    icon: BriefcaseBusiness,
    featured: { label: "Become a tutor", href: "/become-a-tutor", desc: "Create your profile and start receiving demand." },
    groups: [
      { title: "Tutor marketplace", links: [
        { label: "Browse open requests", href: "/browse-requests", desc: "See student demand and send offers." },
        { label: "Tutor guide", href: "/help/for-tutors", desc: "How to work well on TUTORERA." },
        { label: "Earnings", href: "/earnings", desc: "Understand tutor earning flow." },
        { label: "Verification standards", href: "/tutor-verification-standards", desc: "Build credibility with verification." },
      ] },
      { title: "Quality expectations", links: [
        { label: "Tutor screening policy", href: "/tutor-screening-policy", desc: "How profiles are reviewed." },
        { label: "Academic standards", href: "/academic-standards", desc: "Teaching and conduct standards." },
        { label: "Safety policy", href: "/safety-policy", desc: "Platform safety expectations." },
        { label: "Review policy", href: "/review-policy", desc: "How reviews should be used." },
      ] },
    ],
  },
  {
    key: "resources" as MegaKey,
    label: "Resources",
    eyebrow: "Learn and verify",
    title: "Policies, research, and help pages in one place.",
    icon: ShieldCheck,
    featured: { label: "Help center", href: "/help", desc: "Find answers for students, parents, and tutors." },
    groups: [
      { title: "Guides and research", links: [
        { label: "Blog", href: "/blog", desc: "Practical education guides." },
        { label: "Pakistan tutoring rates", href: "/research/pakistan-tutoring-rates", desc: "Original tutoring-rate research." },
        { label: "Research methodology", href: "/research-methodology", desc: "How research pages are produced." },
        { label: "How it works", href: "/how-it-works", desc: "Platform overview." },
        { label: "How payments work", href: "/payment-process", desc: "Checkout, PKR totals, and verification." },
      ] },
      { title: "Company and trust", links: [
        { label: "About", href: "/about", desc: "TUTORERA and MENTISERA." },
        { label: "Business model", href: "/business-model", desc: "Marketplace role and operations." },
        { label: "Payment gateway information", href: "/payment-gateway-information", desc: "Merchant-review information." },
        { label: "Coverage", href: "/coverage", desc: "Where TUTORERA operates." },
        { label: "Contact", href: "/contact", desc: "Reach the support team." },
        { label: "Complaint process", href: "/complaint-process", desc: "Report and escalation route." },
      ] },
    ],
  },
];

const quickLinks = [
  { label: "Find tutors", href: "/tutors", icon: Search },
  { label: "Post request", href: "/dashboard?tab=requests", icon: MessageSquare },
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
  const [activeMega, setActiveMega] = useState<MegaKey>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const { user, logout } = useAuth();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setActiveMega(null);
        setShowNotifications(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMega(null);
        setShowNotifications(false);
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
    setActiveMega(null);
    setShowNotifications(false);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    closeMenus();
    router.push("/");
  };

  return (
    <header ref={navRef} className={s.header}>
      <nav className={s.nav} aria-label="Main navigation">
        <Link href="/" className={s.logo} onClick={closeMenus} aria-label="TUTORERA home">
          <BookOpen size={26} aria-hidden="true" />
          <span>TUTORERA<em>®</em></span>
        </Link>

        <div className={s.desktopNav}>
          {megaMenus.map((menu) => {
            const Icon = menu.icon;
            const open = activeMega === menu.key;
            return (
              <div key={menu.key} className={s.megaWrap}>
                <button type="button" className={s.navButton} aria-expanded={open} aria-controls={`${menu.key}-mega-menu`} onClick={() => { setActiveMega(open ? null : menu.key); setShowNotifications(false); }}>
                  {menu.label}
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
                {open && (
                  <div id={`${menu.key}-mega-menu`} className={s.megaPanel}>
                    <div className={s.megaFeature}>
                      <Icon size={28} aria-hidden="true" />
                      <p>{menu.eyebrow}</p>
                      <h2>{menu.title}</h2>
                      <Link href={menu.featured.href} onClick={closeMenus}>
                        <strong>{menu.featured.label}</strong>
                        <span>{menu.featured.desc}</span>
                      </Link>
                    </div>
                    <div className={s.megaColumns}>
                      {menu.groups.map((group) => (
                        <section key={group.title} aria-labelledby={`${menu.key}-${group.title.replace(/\s+/g, "-")}`}>
                          <h3 id={`${menu.key}-${group.title.replace(/\s+/g, "-")}`}>{group.title}</h3>
                          {group.links.map((link) => (
                            <Link key={link.href} href={link.href} onClick={closeMenus} className={s.megaLink}>
                              <strong>{link.label}</strong>
                              <span>{link.desc}</span>
                            </Link>
                          ))}
                        </section>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={s.desktopActions}>
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className={s.quickLink}><Icon size={16} aria-hidden="true" />{item.label}</Link>;
          })}
          {user ? (
            <>
              <div className={s.notifications}>
                <button type="button" className={s.iconButton} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={showNotifications} onClick={() => { setShowNotifications(!showNotifications); setActiveMega(null); }}>
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
                        <button key={notif._id} type="button" className={notif.isRead ? s.notificationItem : `${s.notificationItem} ${s.unread}`} onClick={() => { markAsRead(notif._id); closeMenus(); if (notif.link) router.push(notif.link); }}>
                          <span aria-hidden="true">{notificationIcon(notif.type)}</span>
                          <span><strong>{notif.title}</strong><em>{notif.message}</em></span>
                        </button>
                      ))}
                    </div>
                    <Link href="/notifications" onClick={closeMenus} className={s.panelFooterLink}>View all notifications</Link>
                  </div>
                )}
              </div>
              <div className={s.accountMenu}>
                <button type="button" className={s.accountButton} aria-label="Account menu">
                  <span className={s.avatar}>{user.avatar ? <Image src={user.avatar} alt="" width={32} height={32} /> : user.name.charAt(0).toUpperCase()}</span>
                  <span>{user.name.split(" ")[0]}</span>
                </button>
                <div className={s.accountLinks}>
                  <Link href={user.role === "admin" ? "/admin" : "/dashboard"} onClick={closeMenus}><LayoutDashboard size={16} /> Dashboard</Link>
                  <Link href="/profile" onClick={closeMenus}><User size={16} /> Profile</Link>
                  {user.role !== "admin" && <Link href="/chat" onClick={closeMenus}><MessageSquare size={16} /> Messages</Link>}
                  <button type="button" onClick={handleLogout}><LogOut size={16} /> Logout</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className={s.loginLink}>Log in</Link>
              <Link href="/register" className={s.signupLink}>Sign up</Link>
            </>
          )}
        </div>

        <button type="button" className={s.mobileToggle} aria-label={isOpen ? "Close menu" : "Open menu"} aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </nav>

      {isOpen && (
        <div className={s.mobilePanel}>
          {megaMenus.map((menu) => (
            <details key={menu.key} className={s.mobileGroup}>
              <summary>{menu.label}</summary>
              <Link href={menu.featured.href} onClick={closeMenus}>{menu.featured.label}</Link>
              {menu.groups.flatMap((group) => group.links).map((link) => (
                <Link key={link.href} href={link.href} onClick={closeMenus}>{link.label}</Link>
              ))}
            </details>
          ))}
          <div className={s.mobileActions}>
            {user ? (
              <>
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"} onClick={closeMenus}>Dashboard</Link>
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
