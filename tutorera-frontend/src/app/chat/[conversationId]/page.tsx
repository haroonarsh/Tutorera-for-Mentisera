"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { Send, ArrowLeft, Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { io, Socket } from "socket.io-client";

const C = {
  primary: '#1a1a2e',
  accent: '#2563eb',
  gray500: '#6b7280',
  gray50: '#f9fafb',
};

interface Message {
  _id: string;
  sender: { _id: string; name: string; avatar?: string; };
  content: string;
  isRead: boolean;
  wasFiltered?: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  student: { _id: string; name: string; avatar?: string; };
  tutor: { _id: string; name: string; avatar?: string; };
  booking: { amount: number | string; status: string; schedule: string; };
}

export default function ChatPage() {
  const { conversationId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Connect socket and join conversation room
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000",
      { auth: { token }, transports: ["websocket"] }
    );

    newSocket.on("connect", () => {
      newSocket.emit("join_conversation", conversationId, (res: { ok: boolean; error?: string }) => {
        if (!res.ok) {
          console.error("Failed to join conversation:", res.error);
        }
      });
    });

    // Receive new message
    newSocket.on("new_message", (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Typing indicator
    newSocket.on("user_typing", (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user._id) {
        setOtherUserTyping(data.isTyping);
      }
    });

    socketRef.current = newSocket;
    return () => {
      newSocket.emit("leave_conversation", conversationId);
      newSocket.disconnect();
    };
  }, [user, conversationId]);

  // Fetch conversation + messages
  useEffect(() => {
    if (!conversationId) return;

    api.get(`/chat/${conversationId}/messages`)
      .then(res => {
        setMessages(res.data.messages);
        setHasMore(res.data.pagination.page < res.data.pagination.pages);
        setCurrentPage(res.data.pagination.page);
        setTimeout(scrollToBottom, 100);
      })
      .catch(console.error);

    api.get("/chat/conversations")
      .then(res => {
        const conv = res.data.conversations.find((c: Conversation) => c._id === conversationId);
        if (conv) setConversation(conv);
      })
      .catch(console.error);
  }, [conversationId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit("typing", { conversationId, isTyping: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit("typing", { conversationId, isTyping: false });
    }, 1500);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    // Stop typing
    socketRef.current?.emit("typing", { conversationId, isTyping: false });
    setIsTyping(false);

    try {
      await api.post(`/chat/${conversationId}/messages`, { content });
    } catch {
      setNewMessage(content); // restore if failed
    } finally {
      setSending(false);
    }
  };

  const handleLoadOlder = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await api.get(`/chat/${conversationId}/messages?page=${nextPage}`);
      setMessages(prev => [...res.data.messages, ...prev]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
      setCurrentPage(res.data.pagination.page);
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherUser = user?.role === "student"
    ? conversation?.tutor
    : conversation?.student;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.gray50 }}>

      {/* Chat Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        <Link href="/dashboard"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: C.gray50, textDecoration: 'none', color: C.primary, border: '1px solid #e5e7eb' }}>
          <ArrowLeft size={18} />
        </Link>

        {/* Avatar */}
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1rem', flexShrink: 0, overflow: 'hidden' }}>
          {otherUser?.avatar ? (
            <img src={otherUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : otherUser?.name?.charAt(0) || "?"}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem' }}>{otherUser?.name || "Loading..."}</p>
          <p style={{ color: C.gray500, fontSize: '0.75rem' }}>
            {otherUserTyping ? (
              <span style={{ color: '#16a34a', fontStyle: 'italic' }}>typing...</span>
            ) : (
              <span style={{ textTransform: 'capitalize' }}>{user?.role === "student" ? "Tutor" : "Student"}</span>
            )}
          </p>
        </div>

        {/* Booking Info */}
        {conversation?.booking && (
          <div style={{ backgroundColor: C.gray50, border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: C.gray500 }}>Booking</p>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: C.primary }}>Rs. {(conversation.booking).amount?.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Safety Banner */}
      <div style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <Shield size={14} color="#d97706" />
        <p style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: '500' }}>
          For your safety, contact details (phone, WhatsApp, email) are not allowed in chat. Keep all communication on TUTORERA®.
        </p>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {hasMore && (
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <button onClick={handleLoadOlder} disabled={loadingMore}
              style={{ padding: '0.5rem 1.25rem', backgroundColor: 'white', color: C.accent, border: `1px solid ${C.accent}`, borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', cursor: loadingMore ? 'not-allowed' : 'pointer' }}>
              {loadingMore ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={24} color={C.accent} />
            </div>
            <p style={{ color: C.gray500, fontSize: '0.9rem', fontWeight: '600' }}>No messages yet</p>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender._id === user?._id;
            return (
              <div key={msg._id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '0.5rem', alignItems: 'flex-end' }}>
                {/* Avatar */}
                {!isMe && (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0, overflow: 'hidden' }}>
                    {msg.sender.avatar ? (
                      <img src={msg.sender.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : msg.sender.name?.charAt(0)}
                  </div>
                )}

                <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {/* Message Bubble */}
                  <div style={{ backgroundColor: isMe ? C.accent : 'white', color: isMe ? 'white' : C.primary, padding: '0.6rem 1rem', borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', fontSize: '0.875rem', lineHeight: '1.5', border: isMe ? 'none' : '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    {msg.content}
                  </div>

                  {/* Filtered warning */}
                  {msg.wasFiltered && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#d97706' }}>
                      <AlertTriangle size={11} />
                      Contact info was removed
                    </div>
                  )}

                  {/* Timestamp */}
                  <p style={{ fontSize: '0.68rem', color: '#9ca3af', padding: '0 0.25rem' }}>
                    {new Date(msg.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                    {isMe && <span style={{ marginLeft: '0.3rem' }}>{msg.isRead ? '✓✓' : '✓'}</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {otherUserTyping && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', flexShrink: 0 }}>
              {otherUser?.name?.charAt(0)}
            </div>
            <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '1rem 1rem 1rem 0.25rem', padding: '0.75rem 1rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%', animation: `bounce 1s infinite ${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb', padding: '1rem 1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', maxWidth: '900px', margin: '0 auto' }}>
          <textarea
            value={newMessage}
            onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Press Enter to send)"
            rows={1}
            style={{ flex: 1, padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '1.5rem', fontSize: '0.9rem', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5', maxHeight: '120px', overflowY: 'auto' }}
            onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            onInput={e => {
              const target = e.currentTarget;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            title="Send"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: !newMessage.trim() || sending ? '#e5e7eb' : C.accent, border: 'none', cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
            <Send size={18} color={!newMessage.trim() || sending ? '#9ca3af' : 'white'} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}