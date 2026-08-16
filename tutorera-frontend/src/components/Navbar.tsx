"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ChevronDown, BookOpen, User, LogOut, LayoutDashboard, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { Bell } from "lucide-react";

const C = {
  primary: '#1a1a2e',
  accent: '#2563eb',
  highlight: '#e94560',
};

const subjectsMenu = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Computer Science", "Economics", "View All Subjects"];
const levelsMenu = ["Primary School", "Middle School", "Matriculation", "O-Levels", "Intermediate / FSc", "A-Levels", "University Level", "Test Preparation", "View All Levels"];
const coverageMenu = ["Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar", "Quetta", "Online (Pakistan-wide)", "View All Cities"];

type DropdownKey = "subjects" | "levels" | "coverage" | "user" | null;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [mobileExpanded, setMobileExpanded] = useState<DropdownKey>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    setActiveDropdown(null);
    router.push("/");
  };

  const dropdowns = [
    { key: "subjects" as DropdownKey, label: "Subjects", items: subjectsMenu },
    { key: "levels" as DropdownKey, label: "Levels", items: levelsMenu },
    { key: "coverage" as DropdownKey, label: "Coverage", items: coverageMenu },
  ];

  return (
    <nav ref={navRef} style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <BookOpen size={26} color={C.accent} />
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: C.primary }}>
              TUTORERA<span style={{ color: C.highlight }}>®</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden-mobile">
            <Link href="/" style={{ padding: '0.5rem 0.75rem', color: C.primary, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', borderRadius: '0.4rem' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              Home
            </Link>
            <Link href="/tutors" style={{ padding: '0.5rem 0.75rem', color: C.primary, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', borderRadius: '0.4rem' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              Find a Tutor
            </Link>
            <Link href="/become-a-tutor"
              style={{ padding: '0.5rem 0.75rem', color: C.primary, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', borderRadius: '0.4rem' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              Become a Tutor
            </Link>

            {dropdowns.map(({ key, label, items }) => (
              <div key={key as string} style={{ position: 'relative' }}>
                <button onClick={() => setActiveDropdown(activeDropdown === key ? null : key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.75rem', color: C.primary, background: activeDropdown === key ? '#f3f4f6' : 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', borderRadius: '0.4rem' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  onMouseLeave={e => { if (activeDropdown !== key) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  {label}
                  <ChevronDown size={14} style={{ transform: activeDropdown === key ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                </button>
                {activeDropdown === key && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '200px', zIndex: 100, overflow: 'hidden' }}>
                    {items.map((item, idx) => (
                      <Link key={item} href={`/${key}`} onClick={() => setActiveDropdown(null)}
                        style={{ display: 'block', padding: '0.6rem 1rem', fontSize: '0.875rem', textDecoration: 'none', color: idx === items.length - 1 ? C.accent : C.primary, fontWeight: idx === items.length - 1 ? '600' : '400', borderTop: idx === items.length - 1 ? '1px solid #e5e7eb' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        {item}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Auth Area */}
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="hidden-mobile">
  {user ? (
    <>
      {/* Notification Bell */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            setActiveDropdown(null);
          }}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: '4px', right: '4px', width: '16px', height: '16px', backgroundColor: '#e94560', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '800', color: 'white' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.875rem', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', width: '320px', zIndex: 100, overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.9rem' }}>
                Notifications {unreadCount > 0 && <span style={{ color: '#e94560' }}>({unreadCount})</span>}
              </p>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent, fontSize: '0.75rem', fontWeight: '600' }}>
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Bell size={28} color="#d1d5db" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No notifications yet</p>
                </div>
              ) : notifications.map(notif => (
                <div key={notif._id}
                  onClick={() => { markAsRead(notif._id); setShowNotifications(false); if (notif.link) window.location.href = notif.link; }}
                  style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f9fafb', cursor: 'pointer', backgroundColor: notif.isRead ? 'white' : '#f0f7ff' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = notif.isRead ? 'white' : '#f0f7ff')}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: notif.type === 'verification' ? '#f0fdf4' : notif.type === 'bid' ? '#eff6ff' : notif.type === 'booking' ? '#fdf4ff' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>
                      {notif.type === 'verification' ? '🛡️' : notif.type === 'bid' ? '📬' : notif.type === 'booking' ? '📅' : notif.type === 'payment' ? '💰' : '🔔'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.82rem', marginBottom: '0.2rem' }}>{notif.title}</p>
                      <p style={{ color: '#6b7280', fontSize: '0.78rem', lineHeight: '1.4' }}>{notif.message}</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                        {new Date(notif.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div style={{ width: '8px', height: '8px', backgroundColor: C.accent, borderRadius: '50%', flexShrink: 0, marginTop: '4px' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Dropdown */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setActiveDropdown(activeDropdown === 'user' ? null : 'user'); setShowNotifications(false); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', border: '1.5px solid #e5e7eb', borderRadius: '2rem', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: C.primary }}>
          <div style={{ width: '28px', height: '28px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: '700', overflow: 'hidden' }}>
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : user.name.charAt(0).toUpperCase()}
          </div>
          {user.name.split(' ')[0]}
          <ChevronDown size={14} />
        </button>

                {activeDropdown === 'user' && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '180px', zIndex: 100, overflow: 'hidden' }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '700', color: C.primary }}>{user.name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize' }}>{user.role}</p>
                    </div>
                    {user.role === "admin" && (
                      <Link href="/admin" onClick={() => setActiveDropdown(null)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.875rem', textDecoration: 'none', color: '#7c3aed', fontWeight: '600', backgroundColor: '#f5f3ff' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ede9fe')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f5f3ff')}>
                      ⚙️ Admin Panel
                      </Link>
                    )}
                    {user.role !== "admin" && (
                      <Link href="/dashboard" onClick={() => setActiveDropdown(null)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.875rem', textDecoration: 'none', color: C.primary }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    )}
                    <Link href="/profile" onClick={() => setActiveDropdown(null)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.875rem', textDecoration: 'none', color: C.primary }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <User size={15} /> Profile
                    </Link>
                    {user.role !== "admin" && (
                      <Link href="/chat" onClick={() => setActiveDropdown(null)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.875rem', textDecoration: 'none', color: C.primary }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <MessageSquare size={15} /> Messages
                      </Link>
                    )}
                    {user.role !== "admin" && (
                      <Link href="/referral" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.875rem', textDecoration: 'none', color: C.primary }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        🎁 Refer & Earn
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.875rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderTop: '1px solid #f3f4f6' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
              </>
            ) : (
              <>
                <Link href="/login" style={{ padding: '0.5rem 1rem', color: C.primary, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', borderRadius: '0.4rem' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  Log in
                </Link>
                <Link href="/register" style={{ padding: '0.5rem 1.25rem', backgroundColor: C.accent, color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', borderRadius: '0.5rem' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.accent)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, display: 'none' }} className="show-mobile">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>

    {/* Mobile Notification Banner */}
    {user && (
      <div style={{ backgroundColor: '#f0f7ff', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '0.75rem', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: notifications.filter(n => !n.isRead).length > 0 ? '0.75rem' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={16} color={C.accent} />
            <span style={{ fontWeight: '700', color: C.primary, fontSize: '0.875rem' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{ backgroundColor: '#e94560', color: 'white', fontSize: '0.65rem', fontWeight: '800', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent, fontSize: '0.75rem', fontWeight: '600' }}>
              Mark all read
            </button>
          )}
        </div>

        {/* Show last 3 notifications on mobile */}
        {notifications.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem 0' }}>No notifications yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            {notifications.slice(0, 5).map(notif => (
              <div key={notif._id}
                onClick={() => { markAsRead(notif._id); setIsOpen(false); if (notif.link) window.location.href = notif.link; }}
                style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: notif.isRead ? 'transparent' : 'white', cursor: 'pointer' }}>
                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>
                  {notif.type === 'verification' ? '🛡️' : notif.type === 'bid' ? '📬' : notif.type === 'booking' ? '📅' : notif.type === 'payment' ? '💰' : '🔔'}
                </span>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '700', color: C.primary }}>{notif.title}</p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.3' }}>{notif.message}</p>
                </div>
                {!notif.isRead && (
                  <div style={{ width: '7px', height: '7px', backgroundColor: C.accent, borderRadius: '50%', flexShrink: 0, marginTop: '4px' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )}
          <Link href="/" onClick={() => setIsOpen(false)} style={{ padding: '0.7rem 0', color: C.primary, textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', borderBottom: '1px solid #f3f4f6' }}>Home</Link>
          <Link href="/tutors" onClick={() => setIsOpen(false)} style={{ padding: '0.7rem 0', color: C.primary, textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', borderBottom: '1px solid #f3f4f6' }}>Find a Tutor</Link>
          <Link href="/become-a-tutor" onClick={() => setIsOpen(false)}
            style={{ padding: '0.7rem 0', color: C.primary, textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', borderBottom: '1px solid #f3f4f6' }}>
            Become a Tutor
          </Link>
          {dropdowns.map(({ key, label, items }) => (
            <div key={key as string}>
              <button onClick={() => setMobileExpanded(mobileExpanded === key ? null : key)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500', borderBottom: '1px solid #f3f4f6' }}>
                {label}
                <ChevronDown size={14} style={{ transform: mobileExpanded === key ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>
              {mobileExpanded === key && (
                <div style={{ paddingLeft: '1rem', paddingBottom: '0.5rem' }}>
                  {items.map((item) => (
                    <Link key={item} href={`/${key}`} onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '0.4rem 0', color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>{item}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {user ? (
            <>
           {user.role !== "admin" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.75rem' }}>
              <Link href="/dashboard" onClick={() => setIsOpen(false)}
                style={{ padding: '0.7rem', textAlign: 'center', border: `1px solid ${C.accent}`, color: C.accent, textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                Dashboard
              </Link>
              <Link href="/profile" onClick={() => setIsOpen(false)}
                style={{ padding: '0.7rem', textAlign: 'center', border: '1px solid #e5e7eb', color: C.primary, textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                My Profile
              </Link>
              <Link href="/chat" onClick={() => setActiveDropdown(null)}
                style={{ padding: '0.7rem', textAlign: 'center', border: '1px solid #e5e7eb', color: C.primary, textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                Messages
              </Link>
              <Link href="/referral" style={{ padding: '0.7rem', textAlign: 'center', border: '1px solid #e5e7eb', color: C.primary, textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                🎁 Refer & Earn
              </Link>
              <button onClick={handleLogout}
                style={{ padding: '0.7rem', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          )}

          {user.role === "admin" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.75rem' }}>
              <Link href="/admin" onClick={() => setIsOpen(false)}
                  style={{ padding: '0.7rem', textAlign: 'center', border: '1px solid #7c3aed', color: '#7c3aed', textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                ⚙️ Admin Panel
              </Link>
              <button onClick={handleLogout}
                style={{ padding: '0.7rem', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          )}
          </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem' }}>
              <Link href="/login" onClick={() => setIsOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '0.7rem', border: `1px solid ${C.primary}`, color: C.primary, textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Log in</Link>
              <Link href="/register" onClick={() => setIsOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '0.7rem', backgroundColor: C.accent, color: 'white', textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Sign Up</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } .show-mobile { display: block !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } }
      `}</style>
    </nav>
  );
}