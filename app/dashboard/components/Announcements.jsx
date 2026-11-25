"use client";

import { useEffect, useState } from "react";
import { Megaphone, Bell, BellOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fetchMembers, displayName, friendlyError } from "@/lib/data";
import { ErrorMsg, Loading, confirmDelete } from "./ui";

function needsTableMsg(err) {
  return /does not exist|schema cache/i.test(err?.message || "")
    ? "Falta ejecutar V8_TODO_LO_NUEVO.sql en Supabase."
    : friendlyError(err);
}

/* Botón para activar las notificaciones en este dispositivo */
export function NotificationToggle() {
  const [perm, setPerm] = useState("default");
  const supported = typeof window !== "undefined" && "Notification" in window;

  useEffect(() => {
    if (supported) setPerm(Notification.permission);
  }, []);

  if (!supported) {
    return (
      <p style={{ fontSize: 13, color: "var(--dark-60)" }}>
        Este navegador no permite notificaciones. En iPhone, primero añade la app a la pantalla de inicio
        (Compartir → "Añadir a pantalla de inicio") y ábrela desde ahí.
      </p>
    );
  }

  if (perm === "granted") {
    return (
      <p style={{ fontSize: 13 }}>
        <Bell size={14} style={{ verticalAlign: "-2px" }} /> Notificaciones activadas en este dispositivo.
      </p>
    );
  }

  if (perm === "denied") {
    return (
      <p style={{ fontSize: 13, color: "var(--dark-60)" }}>
        <BellOff size={14} style={{ verticalAlign: "-2px" }} /> Las notificaciones están bloqueadas. Actívalas en
        los ajustes del navegador para esta web.
      </p>
    );
  }

  return (
    <button
      className="btn btn-outline btn-sm"
      onClick={async () => {
        const p = await Notification.requestPermission();
        setPerm(p);
        if (p === "granted") showLocalNotification("¡Listo!", "Te avisaremos de mensajes y avisos nuevos.");
      }}
    >
      <Bell size={14} /> Activar notificaciones
    </button>
  );
}

export async function showLocalNotification(title, body) {
  try {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) reg.showNotification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png" });
    else new Notification(title, { body, icon: "/icon-192.png" });
  } catch {}
}

export default function Announcements({ userId, isTrainer }) {
  const [list, setList] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ title: "", body: "", target: "all" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error: err } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(100);
    if (err) setError(needsTableMsg(err));
    // En "ver como socio" se filtra igual que lo vería el socio
    setList((data || []).filter((a) => isTrainer || a.user_id === null || a.user_id === userId));
  };

  useEffect(() => {
    load();
    if (isTrainer) fetchMembers().then(setMembers).catch(() => {});
    else {
      // Marca los avisos como vistos
      supabase.from("profiles").update({ last_seen_announcements: new Date().toISOString() }).eq("id", userId).then(() => {});
    }
  }, [userId, isTrainer]);

  const send = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("announcements").insert({
      title: form.title,
      body: form.body || null,
      user_id: form.target === "all" ? null : form.target,
    });
    setSaving(false);
    if (err) {
      setError(needsTableMsg(err));
      return;
    }
    setForm({ title: "", body: "", target: "all" });
    load();
  };

  const remove = async (a) => {
    if (!confirmDelete(`el aviso "${a.title}"`)) return;
    await supabase.from("announcements").delete().eq("id", a.id);
    load();
  };

  const who = (a) => (a.user_id ? displayName(members.find((m) => m.id === a.user_id)) || "Un socio" : "Todos");

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>Avisos</h1>
          <p>{isTrainer ? "Envía avisos a todos tus socios o a uno en concreto" : "Novedades de tu entrenadora"}</p>
        </div>
      </div>

      <div className="content-card">
        <NotificationToggle />
      </div>

      {isTrainer && (
        <div className="content-card">
          <h2 style={{ marginBottom: 12 }}>Nuevo aviso</h2>
          <form onSubmit={send}>
            <div className="form-group">
              <label className="field-label">Título *</label>
              <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: El lunes 8 no hay clase" />
            </div>
            <div className="form-group">
              <label className="field-label">Mensaje</label>
              <textarea className="textarea" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="field-label">Para</label>
              <select className="select" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
                <option value="all">Todos los socios</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{displayName(m)}</option>
                ))}
              </select>
            </div>
            <ErrorMsg>{error}</ErrorMsg>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Megaphone size={15} /> {saving ? "Enviando..." : "Enviar aviso"}
            </button>
          </form>
        </div>
      )}

      {!isTrainer && <ErrorMsg>{error}</ErrorMsg>}
      {list === null && <Loading />}
      {list && list.length === 0 && (
        <div className="content-card">
          <p style={{ fontSize: 13, color: "var(--dark-60)" }}>No hay avisos.</p>
        </div>
      )}
      {(list || []).map((a) => (
        <div key={a.id} className="content-card announcement">
          <div className="checkin-head">
            <strong>{a.title}</strong>
            <span style={{ fontSize: 12, color: "var(--dark-60)" }}>
              {new Date(a.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </span>
            {isTrainer && <span className="badge badge-soft">{who(a)}</span>}
            {isTrainer && (
              <button className="link-btn" style={{ marginLeft: "auto" }} onClick={() => remove(a)}>
                Borrar
              </button>
            )}
          </div>
          {a.body && <p style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{a.body}</p>}
        </div>
      ))}
    </>
  );
}
