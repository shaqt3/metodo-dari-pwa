"use client";

import { useEffect, useState } from "react";
import { Plus, Trophy, Camera, CheckCircle2, Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { currentEmail, displayName, fetchMembers, friendlyError } from "@/lib/data";
import {
  Modal,
  EditDeleteButtons,
  confirmDelete,
  MediaInput,
  MediaView,
  ErrorMsg,
  Loading,
} from "./ui";

const LOCATION_LABEL = { gym: "En el gimnasio", home: "En casa", ambos: "Gimnasio o casa" };

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function Challenges({ userId, isTrainer }) {
  const [challenges, setChallenges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    let subsQuery = supabase.from("challenge_submissions").select("*");
    if (!isTrainer) subsQuery = subsQuery.eq("user_id", userId);
    const [{ data: ch, error: chErr }, { data: subs }] = await Promise.all([
      supabase.from("challenges").select("*").order("created_at", { ascending: false }),
      subsQuery,
    ]);
    if (chErr) setError(chErr.message);
    setChallenges(ch || []);
    setSubmissions(subs || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    fetchData();
    if (isTrainer) fetchMembers().then(setMembers).catch(() => {});
  }, [userId, isTrainer]);

  const handleDelete = async (c) => {
    if (!confirmDelete(`el reto "${c.title}"`)) return;
    const { error: delErr } = await supabase.from("challenges").delete().eq("id", c.id);
    if (delErr) setError(friendlyError(delErr));
    fetchData();
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Retos</h1>
          <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 2 }}>
            En el gimnasio o en casa
          </p>
        </div>
        {isTrainer && (
          <button onClick={() => setEditing({})} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Crear reto
          </button>
        )}
      </div>

      <ErrorMsg>{error}</ErrorMsg>
      {loading && <Loading />}

      {!loading && challenges.length === 0 && (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Trophy size={22} color="#38bdf8" />
            </div>
            <h3>Todavía no hay retos</h3>
            <p>
              {isTrainer
                ? 'Pulsa "Crear reto" para añadir el primero.'
                : "Pronto tu entrenadora añadirá retos aquí."}
            </p>
          </div>
        </div>
      )}

      {challenges.map((c) => (
        <ChallengeCard
          key={c.id}
          challenge={c}
          userId={userId}
          isTrainer={isTrainer}
          members={members}
          submissions={submissions.filter((s) => s.challenge_id === c.id)}
          onChanged={fetchData}
          onEdit={() => setEditing(c)}
          onDelete={() => handleDelete(c)}
        />
      ))}

      {editing && (
        <ChallengeModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchData();
          }}
        />
      )}
    </>
  );
}

function ChallengeCard({ challenge, userId, isTrainer, members, submissions, onChanged, onEdit, onDelete }) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const mine = submissions.find((s) => s.user_id === userId);
  const expired = challenge.ends_on && new Date(challenge.ends_on) < new Date(new Date().toDateString());

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    let photoUrl = null;

    if (file) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${userId}/${challenge.id}-${Date.now()}-${safe}`;
      const { error: uploadError } = await supabase.storage
        .from("challenge-photos")
        .upload(filePath, file);
      if (uploadError) {
        setSaving(false);
        setError("No se pudo subir la foto. Prueba con otra o márcalo sin foto.");
        return;
      }
      photoUrl = supabase.storage.from("challenge-photos").getPublicUrl(filePath).data?.publicUrl || null;
    }

    const { error: insertError } = await supabase.from("challenge_submissions").insert({
      challenge_id: challenge.id,
      user_id: userId,
      photo_url: photoUrl,
      note: note || null,
    });
    setSaving(false);
    if (insertError) {
      setError(friendlyError(insertError));
      return;
    }
    onChanged();
  };

  const memberName = (id) => displayName(members.find((m) => m.id === id)) || "Socio";

  return (
    <div className="content-card challenge-card">
      <div className="challenge-card-head">
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{challenge.title}</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge">{LOCATION_LABEL[challenge.location] || challenge.location}</span>
          {challenge.ends_on && (
            <span className={`badge ${expired ? "badge-muted" : ""}`}>
              {expired ? "Terminado" : `Hasta el ${formatDate(challenge.ends_on)}`}
            </span>
          )}
          {isTrainer && <EditDeleteButtons onEdit={onEdit} onDelete={onDelete} />}
        </div>
      </div>
      {challenge.description && <p>{challenge.description}</p>}
      {challenge.photo_url && <MediaView url={challenge.photo_url} title={challenge.title} />}
      {challenge.video_url && <MediaView url={challenge.video_url} title={challenge.title} />}

      {isTrainer ? (
        <details className="accordion-item" style={{ marginTop: 12 }}>
          <summary className="accordion-summary">
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Users size={15} /> {submissions.length}{" "}
              {submissions.length === 1 ? "socio lo ha completado" : "socios lo han completado"}
            </span>
          </summary>
          <div className="accordion-body">
            {submissions.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Nadie todavía.</p>
            )}
            {submissions.map((s) => (
              <div key={s.id} className="submission-row">
                <div>
                  <strong>{memberName(s.user_id)}</strong>
                  <span style={{ color: "var(--dark-60)", fontSize: 12 }}> · {formatDate(s.completed_at)}</span>
                  {s.note && <div style={{ fontSize: 13 }}>{s.note}</div>}
                </div>
                {s.photo_url && (
                  <a href={s.photo_url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.photo_url} alt="" className="submission-thumb" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </details>
      ) : mine ? (
        <span className="completed-tag">
          <CheckCircle2 size={16} />
          Completado el {formatDate(mine.completed_at)}
        </span>
      ) : expired ? (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Este reto ya ha terminado.</p>
      ) : (
        <>
          <div className="challenge-submit-row">
            <label className="file-input-label">
              <Camera size={15} />
              {file ? file.name : "Añadir foto (opcional)"}
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <input
              className="input"
              style={{ flex: 1, minWidth: 160 }}
              placeholder="Nota (opcional, ej: 50 min en bici)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button onClick={handleSubmit} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? "Guardando..." : "Marcar completado"}
            </button>
          </div>
          <ErrorMsg>{error}</ErrorMsg>
        </>
      )}
    </div>
  );
}

function ChallengeModal({ initial, onClose, onSaved }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    location: initial?.location || "ambos",
    ends_on: initial?.ends_on || "",
    photo_url: initial?.photo_url || "",
    video_url: initial?.video_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      description: form.description || null,
      location: form.location,
      ends_on: form.ends_on || null,
      photo_url: form.photo_url || null,
      video_url: form.video_url || null,
    };
    const { error: saveErr } = isNew
      ? await supabase.from("challenges").insert({ ...payload, created_by: await currentEmail() })
      : await supabase.from("challenges").update(payload).eq("id", initial.id);
    setSaving(false);
    if (saveErr) {
      setError(friendlyError(saveErr));
      return;
    }
    onSaved();
  };

  return (
    <Modal title={isNew ? "Nuevo reto" : "Editar reto"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="field-label">Título *</label>
          <input required className="input" value={form.title} onChange={set("title")} placeholder="Ej: 50 minutos en bici" />
        </div>
        <div className="form-group">
          <label className="field-label">Explicación</label>
          <textarea className="textarea" value={form.description} onChange={set("description")} placeholder="Ej: sube una foto de tu ruta de al menos 50 minutos" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="field-label">Dónde</label>
            <select className="select" value={form.location} onChange={set("location")}>
              <option value="ambos">Gimnasio o casa</option>
              <option value="gym">Solo gimnasio</option>
              <option value="home">Solo casa</option>
            </select>
          </div>
          <div className="form-group">
            <label className="field-label">Fecha límite (opcional)</label>
            <input type="date" className="input" value={form.ends_on} onChange={set("ends_on")} />
          </div>
        </div>
        <MediaInput label="Foto (opcional)" value={form.photo_url} onChange={set("photo_url")} kind="image" folder="retos" />
        <MediaInput label="Vídeo (opcional)" value={form.video_url} onChange={set("video_url")} kind="video" folder="retos" />
        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? "Guardando..." : isNew ? "Crear reto" : "Guardar cambios"}
        </button>
      </form>
    </Modal>
  );
}
