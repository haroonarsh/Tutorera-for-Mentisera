"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";
import api from "@/lib/axios";
import { useAppGuard } from "@/hooks/useAppGuard";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

interface Conversation {
  _id: string;
  student: { _id: string; name: string; avatar?: string; };
  tutor: { _id: string; name: string; avatar?: string; };
  booking: { amount: number; status: string; };
  lastMessage: string;
  lastMessageAt: string;
  studentUnread: number;
  tutorUnread: number;
}

export default function ChatListPage() {
  const { user, loading } = useAuth();
  const guardStatus = useAppGuard();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    api.get("/chat/conversations")
      .then(res => setConversations(res.data.conversations))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, []);

  if (guardStatus !== "ok") return null;

  if (loading || fetching) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.gray50 }}>
      <div style={{ backgroundColor: C.primary, padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '800' }}>Messages</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Your conversations with {user?.role === "student" ? "tutors" : "students"}</p>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {conversations.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '4rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <MessageSquare size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: C.primary, fontWeight: '700', marginBottom: '0.5rem' }}>No conversations yet</h3>
            <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {user?.role === "student"
                ? "Accept a tutor's bid to start chatting."
                : "Wait for a student to accept your bid."}
            </p>
            <Link href="/dashboard"
              style={{ display: 'inline-block', backgroundColor: C.accent, color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem' }}>
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {conversations.map(conv => {
              const otherUser = user?.role === "student" ? conv.tutor : conv.student;
              const unreadCount = user?.role === "student" ? conv.studentUnread : conv.tutorUnread;

              return (
                <Link key={conv._id} href={`/chat/${conv._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.25rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1.1rem', overflow: 'hidden' }}>
                        {otherUser?.avatar ? (
                          <img src={otherUser.avatar} alt={otherUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : otherUser?.name?.charAt(0)}
                      </div>
                      {unreadCount > 0 && (
                        <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '18px', height: '18px', backgroundColor: '#e94560', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '800', color: 'white' }}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <p style={{ fontWeight: unreadCount > 0 ? '800' : '600', color: C.primary, fontSize: '0.95rem' }}>{otherUser?.name}</p>
                        <p style={{ fontSize: '0.72rem', color: '#9ca3af', flexShrink: 0 }}>
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" }) : ""}
                        </p>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: unreadCount > 0 ? C.primary : C.gray500, fontWeight: unreadCount > 0 ? '600' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>

                    <ArrowRight size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}