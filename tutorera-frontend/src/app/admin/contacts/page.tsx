"use client";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import api from "@/lib/axios";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb' };

interface Contact {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.get("/admin/contacts")
      .then(res => setContacts(res.data.contacts))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: C.primary }}>Contact Messages</h1>
        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>All messages submitted through the contact form.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ width: '36px', height: '36px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : contacts.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '4rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <MessageSquare size={40} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: C.gray500 }}>No messages yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {contacts.map(contact => (
            <div key={contact._id} style={{ backgroundColor: 'white', borderRadius: '0.875rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === contact._id ? null : contact._id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageSquare size={18} color={C.accent} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem' }}>{contact.name}</p>
                    <p style={{ color: C.gray500, fontSize: '0.8rem' }}>{contact.email} · {contact.phone}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '600', color: C.primary, fontSize: '0.875rem' }}>{contact.subject}</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{new Date(contact.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {expanded === contact._id && (
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #f3f4f6', backgroundColor: C.gray50 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Message</p>
                  <p style={{ color: C.primary, fontSize: '0.9rem', lineHeight: '1.7' }}>{contact.message}</p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                    <a href={`mailto:${contact.email}`}
                      style={{ padding: '0.5rem 1rem', backgroundColor: C.accent, color: 'white', borderRadius: '0.4rem', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '600' }}>
                      Reply via Email
                    </a>
                    {contact.phone && (
                      <a href={`https://wa.me/92${contact.phone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#16a34a', color: 'white', borderRadius: '0.4rem', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '600' }}>
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}