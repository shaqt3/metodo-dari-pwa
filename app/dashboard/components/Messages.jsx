"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fetchMembers, displayName, friendlyError } from "@/lib/data";
import { ErrorMsg, Loading } from "./ui";

function needsTableMsg(err) {
  return /does not exist|schema cache/i.test(err?.message || "")
    ? "Falta ejecutar V8_TODO_LO_NUEVO.sql en Supabase."
    : friendlyError(err);
}

function timeLabel(d) {
  const date = new Date(d);
  const today = new Date().toDateString() === date.toDateString();
  return today
    ? date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) +
        " " +
        date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

/* Conversación entre un socio y la entrenadora */
export function Chat({ memberId, myId, otherName = "tu entrenadora", height = 420 }) {
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const load = async () => {
    const { data, error: err } = await supabase
      .from("messages")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at");
    if (err) {
      setError(needsTableMsg(err));
      setMessages([]);
      return;
    }
    setMessages(data || []);
    // Marca como leídos los que me han enviado
    const unread = (data || []).filter((m) => m.sender_id !== myId && !m.read_at).map((m) => m.id);
    if (unread.length) {
      supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => {});
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [memberId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    const { error: err } = await supabase.from("messages").insert({ member_id: memberId, sender_id: myId, body });
    setSending(false);
    if (err) {
      setError(needsTableMsg(err));
      return;
    }
    setText("");
    load();
  };

  return (
    <div className="chat">
      <div className="chat-list" style={{ height }}>
        {messages === null && <Loading />}
        {messages && messages.length === 0 && !error && (
          <p className="chat-empty">Todavía no hay mensajes. Escribe a {otherName} 👋</p>
        )}
        {(messages || []).map((m) => (
          <div key={m.id} className={`chat-msg ${m.sender_id === myId ? "mine" : ""}`}>
            <div className="chat-bubble">{m.body}</div>
            <div className="chat-time">
              {timeLabel(m.created_at)}
              {m.sender_id === myId && m.read_at ? " · visto" : ""}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <ErrorMsg>{error}</ErrorMsg>
      <form className="chat-form" onSubmit={send}>
        <textarea
          className="input"
          rows={1}
          placeholder="Escribe un mensaje..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) send(e);
          }}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !text.trim()} aria-label="Enviar">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

/* Bandeja de la entrenadora: una conversación por socio */
export function TrainerInbox({ myId, initialMember }) {
  const [members, setMembers] = useState(null);
  const [summary, setSummary] = useState({});
  const [open, setOpen] = useState(initialMember || null);
  const [error, setError] = useState("");

  const load = async () => {
    const [m, { data, error: err }] = await Promise.all([
      fetchMembers().catch(() => []),
      supabase.from("messages").select("member_id, sender_id, body, created_at, read_at").order("created_at", { ascending: false }).limit(500),
    ]);
    if (err) setError(needsTableMsg(err));
    const sum = {};
    (data || []).forEach((msg) => {
      const s = (sum[msg.member_id] = sum[msg.member_id] || { last: null, unread: 0 });
      if (!s.last) s.last = msg;
      if (msg.sender_id !== myId && !msg.read_at) s.unread++;
    });
    setSummary(sum);
    setMembers(
      [...m].sort((a, b) => {
        const la = sum[a.id]?.last?.created_at || "";
        const lb = sum[b.id]?.last?.created_at || "";
        return lb.localeCompare(la);
      })
    );
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  if (open) {
    return (
      <div className="content-card">
        <button className="link-btn" onClick={() => { setOpen(null); load(); }} style={{ marginBottom: 10 }}>
          <ChevronLeft size={14} style={{ verticalAlign: "-2px" }} /> Todas las conversaciones
        </button>
        <h2 style={{ marginBottom: 10 }}>{displayName(open)}</h2>
        <Chat memberId={open.id} myId={myId} otherName={displayName(open).split(" ")[0]} />
      </div>
    );
  }

  return (
    <>
      <ErrorMsg>{error}</ErrorMsg>
      {members === null && <Loading />}
      {members && members.length === 0 && <p style={{ fontSize: 13 }}>Todavía no hay socios.</p>}
      <div className="member-list">
        {(members || []).map((m) => {
          const s = summary[m.id];
          return (
            <button key={m.id} className="member-card" onClick={() => setOpen(m)}>
              <div className="avatar-chip">{displayName(m).charAt(0).toUpperCase()}</div>
              <div className="member-card-body">
                <div className="member-card-name">
                  {displayName(m)}
                  {s?.unread > 0 && <span className="count-badge">{s.unread}</span>}
                </div>
                <div className="member-card-meta">
                  {s?.last ? `${s.last.sender_id === myId ? "Tú: " : ""}${s.last.body}` : "Sin mensajes"}
                </div>
              </div>
              <MessageCircle size={18} color="var(--dark-50)" />
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function MessagesPage({ userId, isTrainer }) {
  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>Mensajes</h1>
          <p>{isTrainer ? "Conversaciones con tus socios" : "Habla directamente con tu entrenadora"}</p>
        </div>
      </div>
      {isTrainer ? (
        <TrainerInbox myId={userId} />
      ) : (
        <div className="content-card">
          <Chat memberId={userId} myId={userId} />
        </div>
      )}
    </>
  );
}
