"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users, Copy, Trash2, ChevronRight, Phone } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchMembers,
  displayName,
  deleteMemberAccount,
  copyRoutine,
  copyDiet,
  friendlyError,
} from "@/lib/data";
import { GOALS, MODALITIES, DIET_NEEDS, DIET_TYPES, labelOf, age } from "@/lib/options";
import ProfileForm from "./ProfileForm";
import Measurements from "./Measurements";
import { Modal, ChipFilter, ErrorMsg, Loading, confirmDelete } from "./ui";

export default function Members({ onOpenTab }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("activos");
  const [goal, setGoal] = useState("");
  const [selected, setSelected] = useState(null);
  const [showInvite, setShowInvite] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setMembers(await fetchMembers());
    } catch (err) {
      setError(friendlyError(err));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = members.filter((m) => {
    if (status === "activos" && m.active === false) return false;
    if (status === "baja" && m.active !== false) return false;
    if (goal && m.goal !== goal) return false;
    if (!q) return true;
    return [m.full_name, m.email, m.phone].some((x) => (x || "").toLowerCase().includes(q));
  });

  return (
    <>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Socios</h1>
          <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 2 }}>
            {members.filter((m) => m.active !== false).length} activos · {members.length} en total
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
          <UserPlus size={16} /> Añadir socio
        </button>
      </div>

      <div className="search-input-wrap">
        <input
          className="input"
          placeholder="Buscar por nombre, email o teléfono..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", maxWidth: 900 }}>
        <ChipFilter
          options={[
            { id: "activos", label: "Activos" },
            { id: "baja", label: "De baja" },
            { id: "todos", label: "Todos" },
          ]}
          value={status}
          onChange={setStatus}
        />
        <select className="select" style={{ maxWidth: 240, marginBottom: 20 }} value={goal} onChange={(e) => setGoal(e.target.value)}>
          <option value="">Todos los objetivos</option>
          {GOALS.map((g) => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>
      </div>

      <ErrorMsg>{error}</ErrorMsg>
      {loading && <Loading text="Cargando socios..." />}

      {!loading && filtered.length === 0 && (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={22} color="#38bdf8" />
            </div>
            <h3>No hay socios que coincidan</h3>
            <p>Pulsa "Añadir socio" para invitar a alguien.</p>
          </div>
        </div>
      )}

      <div className="member-list">
        {filtered.map((m) => (
          <button key={m.id} className="member-card" onClick={() => setSelected(m)}>
            <div className="avatar-chip">{displayName(m).charAt(0).toUpperCase()}</div>
            <div className="member-card-body">
              <div className="member-card-name">
                {displayName(m)}
                {m.active === false && <span className="badge badge-muted">De baja</span>}
              </div>
              <div className="member-card-meta">
                {m.full_name && m.email ? m.email : ""}
                {m.phone ? ` · ${m.phone}` : ""}
              </div>
              <div className="member-card-tags">
                {m.goal && <span className="badge">{labelOf(GOALS, m.goal)}</span>}
                {m.modality && <span className="badge badge-soft">{labelOf(MODALITIES, m.modality)}</span>}
                {(m.diet_needs || []).map((n) => (
                  <span key={n} className="badge badge-warn">{labelOf(DIET_NEEDS, n)}</span>
                ))}
              </div>
            </div>
            <ChevronRight size={18} color="var(--dark-50)" />
          </button>
        ))}
      </div>

      {selected && (
        <MemberDetail
          member={selected}
          onClose={() => {
            setSelected(null);
            load();
          }}
          onDeleted={() => {
            setSelected(null);
            load();
          }}
          onOpenTab={onOpenTab}
        />
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </>
  );
}

function InviteModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
  const text = `¡Hola! Te doy acceso a la app de El Método Dari. Entra aquí, pulsa "Crear cuenta" y regístrate con tu email: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt("Copia este mensaje:", text);
    }
  };

  return (
    <Modal title="Añadir socio" onClose={onClose}>
      <ol className="steps-list">
        <li>Envía a tu socio el mensaje de abajo (por WhatsApp, email...).</li>
        <li>Se registra con su email y contraseña desde ese enlace.</li>
        <li>En cuanto entre por primera vez, aparecerá aquí en "Socios" y podrás completar su ficha y asignarle rutina y dieta.</li>
      </ol>
      <div className="invite-box">{text}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-sm" onClick={copy}>
          <Copy size={14} /> {copied ? "¡Copiado!" : "Copiar mensaje"}
        </button>
        <a
          className="btn btn-outline btn-sm"
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Enviar por WhatsApp
        </a>
      </div>
    </Modal>
  );
}

function MemberDetail({ member, onClose, onDeleted, onOpenTab }) {
  const [tab, setTab] = useState("datos");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const years = age(member.birth_date);

  const handleDelete = async () => {
    if (
      !confirmDelete(
        `la cuenta de ${displayName(member)}. Se borrarán también sus rutinas, dietas, registros y medidas`
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteMemberAccount(member.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <Modal title={displayName(member)} onClose={onClose} wide>
      <div className="member-detail-head">
        <span>{member.email}</span>
        {years !== null && <span>· {years} años</span>}
        {member.phone && (
          <a href={`tel:${member.phone}`} className="link-btn">
            <Phone size={13} /> {member.phone}
          </a>
        )}
      </div>

      <div className="subnav">
        {[
          ["datos", "Ficha"],
          ["rutinas", "Rutinas"],
          ["dietas", "Dietas"],
          ["progreso", "Progreso"],
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "datos" && (
        <>
          <ProfileForm userId={member.id} email={member.email} trainerView />
          <div className="danger-zone">
            <ErrorMsg>{error}</ErrorMsg>
            <button className="btn btn-danger-outline btn-sm" onClick={handleDelete} disabled={deleting}>
              <Trash2 size={14} /> {deleting ? "Eliminando..." : "Eliminar cuenta del socio"}
            </button>
          </div>
        </>
      )}
      {tab === "rutinas" && <AssignedList kind="routines" member={member} onOpenTab={onOpenTab} />}
      {tab === "dietas" && <AssignedList kind="diets" member={member} onOpenTab={onOpenTab} />}
      {tab === "progreso" && <MemberProgress member={member} />}
    </Modal>
  );
}

// Rutinas o dietas asignadas a un socio + asignar una plantilla
function AssignedList({ kind, member, onOpenTab }) {
  const isDiet = kind === "diets";
  const [own, setOwn] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: mine }, { data: tpl }] = await Promise.all([
      supabase.from(kind).select("*").eq("user_id", member.id).order("created_at", { ascending: false }),
      supabase.from(kind).select("*").is("user_id", null).order("title"),
    ]);
    setOwn(mine || []);
    // Primero las plantillas que encajan con su objetivo / necesidades
    const needsGluten = (member.diet_needs || []).includes("celiaquia");
    const score = (t) => {
      let s = 0;
      if (isDiet && needsGluten && t.diet_type === "sin_gluten") s += 2;
      if ((isDiet ? t.diet_type : t.goal) === member.goal) s += 1;
      return -s;
    };
    const sorted = [...(tpl || [])].sort((a, b) => score(a) - score(b));
    setTemplates(sorted);
    setTemplateId(sorted[0]?.id || "");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [member.id, kind]);

  const assign = async () => {
    if (!templateId) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const tpl = templates.find((t) => t.id === templateId);
      const name = displayName(member).split(" ")[0];
      const title = `${tpl.title.replace(/^(Plantilla|Dieta ejemplo|Plan ejemplo)\s*-\s*/i, "")} · ${name}`;
      if (isDiet) await copyDiet(templateId, { userId: member.id, title });
      else await copyRoutine(templateId, { userId: member.id, title });
      setMessage(`Asignada. Puedes ajustarla en la pestaña ${isDiet ? "Alimentación" : "Rutinas"}.`);
      load();
    } catch (err) {
      setError(friendlyError(err));
    }
    setBusy(false);
  };

  const remove = async (item) => {
    if (!confirmDelete(`"${item.title}" de este socio`)) return;
    const { error: delErr } = await supabase.from(kind).delete().eq("id", item.id);
    if (delErr) setError(friendlyError(delErr));
    load();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <label className="field-label">{isDiet ? "Dietas de este socio" : "Rutinas de este socio"}</label>
      {own.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--dark-60)", marginBottom: 16 }}>
          Todavía no tiene {isDiet ? "dieta" : "rutina"} propia. {isDiet ? "Verá las dietas generales." : "Verá los planes generales."}
        </p>
      )}
      <ul style={{ marginBottom: 20 }}>
        {own.map((item) => (
          <li key={item.id} className="user-row" style={{ marginBottom: 8 }}>
            <span className="user-row-email">
              {item.title}
              {isDiet && item.diet_type && (
                <span className="badge" style={{ marginLeft: 8 }}>{labelOf(DIET_TYPES, item.diet_type)}</span>
              )}
            </span>
            <button className="icon-btn icon-btn-danger" onClick={() => remove(item)} title="Quitar">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      <div className="assign-box">
        <label className="field-label">Asignar desde una plantilla</label>
        <p style={{ fontSize: 12, color: "var(--dark-60)", marginBottom: 8 }}>
          Se hace una copia para este socio: puedes cambiarla sin tocar la plantilla original.
          {member.goal ? " Arriba salen las que encajan con su objetivo." : ""}
        </p>
        <div className="media-input-row">
          <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.length === 0 && <option value="">No hay plantillas</option>}
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
                {isDiet && t.diet_type ? ` (${labelOf(DIET_TYPES, t.diet_type)})` : ""}
              </option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" onClick={assign} disabled={busy || !templateId}>
            {busy ? "Asignando..." : "Asignar"}
          </button>
        </div>
        <ErrorMsg>{error}</ErrorMsg>
        {message && <p className="form-message form-message-info" style={{ marginTop: 8 }}>{message}</p>}
      </div>

      {onOpenTab && (
        <button className="link-btn" style={{ marginTop: 14 }} onClick={() => onOpenTab(isDiet ? "alimentacion" : "rutinas")}>
          Ir a {isDiet ? "Alimentación" : "Rutinas"} para crear una desde cero →
        </button>
      )}
    </div>
  );
}

function MemberProgress({ member }) {
  const [logs, setLogs] = useState([]);
  const [subs, setSubs] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [{ data }, { count }] = await Promise.all([
        supabase.from("workout_logs").select("*").eq("user_id", member.id).order("log_date", { ascending: false }),
        supabase.from("challenge_submissions").select("id", { count: "exact", head: true }).eq("user_id", member.id),
      ]);
      setLogs(data || []);
      setSubs(count || 0);
    };
    load();
  }, [member.id]);

  const kg = logs.filter((l) => l.kind === "peso").reduce((s, l) => s + Number(l.weight_kg || 0), 0);
  const km = logs.filter((l) => l.kind === "cardio").reduce((s, l) => s + Number(l.distance_km || 0), 0);
  const last = logs[0]?.log_date;

  return (
    <>
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-value">{logs.length}</div>
          <div className="stat-label">Entrenos registrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{last ? new Date(last).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—"}</div>
          <div className="stat-label">Último entreno</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{kg.toLocaleString("es-ES")} kg</div>
          <div className="stat-label">Peso levantado</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{km.toLocaleString("es-ES")} km</div>
          <div className="stat-label">Cardio · {subs} retos</div>
        </div>
      </div>
      <Measurements userId={member.id} title="Peso y medidas" />
    </>
  );
}
