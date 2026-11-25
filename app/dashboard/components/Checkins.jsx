"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { friendlyError } from "@/lib/data";
import { ErrorMsg, Loading, confirmDelete } from "./ui";

const QUESTIONS = [
  { id: "sleep", short: "Sueño", label: "¿Cómo has dormido?", low: "Fatal", high: "Genial" },
  { id: "energy", short: "Energía", label: "¿Cómo has ido de energía?", low: "Sin fuerzas", high: "A tope" },
  { id: "hunger", short: "Hambre", label: "¿Cuánta hambre has pasado?", low: "Mucha", high: "Ninguna" },
  { id: "diet_adherence", short: "Dieta", label: "¿Has seguido la dieta?", low: "Nada", high: "Al 100%" },
  { id: "training_adherence", short: "Entrenos", label: "¿Has hecho los entrenamientos?", low: "Ninguno", high: "Todos" },
];

const EMOJI = ["", "😣", "😕", "😐", "🙂", "😄"];

function needsTableMsg(err) {
  return /does not exist|schema cache/i.test(err?.message || "")
    ? "Falta ejecutar V8_TODO_LO_NUEVO.sql en Supabase."
    : friendlyError(err);
}

function Scale({ value, onChange }) {
  return (
    <div className="scale">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={value === n ? "active" : ""} onClick={() => onChange(n)}>
          {EMOJI[n]}
          <span>{n}</span>
        </button>
      ))}
    </div>
  );
}

function daysSince(d) {
  return Math.floor((new Date(new Date().toDateString()) - new Date(new Date(d).toDateString())) / 86400000);
}

/* Revisión semanal. isTrainer = la entrenadora la ve y responde. */
export default function Checkins({ userId, isTrainer }) {
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ weight_kg: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [replies, setReplies] = useState({});
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error: err } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", userId)
      .order("checkin_date", { ascending: false });
    if (err) setError(needsTableMsg(err));
    setList(data || []);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const last = (list || [])[0];
  const due = !last || daysSince(last.checkin_date) >= 6;
  const complete = QUESTIONS.every((q) => form[q.id]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { user_id: userId, notes: form.notes || null, weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg) };
    QUESTIONS.forEach((q) => (payload[q.id] = form[q.id] || null));
    const { error: err } = await supabase.from("checkins").insert(payload);
    if (!err && payload.weight_kg) {
      // También queda en el historial de peso
      await supabase.from("body_measurements").insert({ user_id: userId, weight_kg: payload.weight_kg, notes: "Revisión semanal" });
    }
    setSaving(false);
    if (err) {
      setError(needsTableMsg(err));
      return;
    }
    setForm({ weight_kg: "", notes: "" });
    load();
  };

  const reply = async (c) => {
    const text = (replies[c.id] ?? c.trainer_reply ?? "").trim();
    const { error: err } = await supabase
      .from("checkins")
      .update({ trainer_reply: text || null, replied_at: text ? new Date().toISOString() : null })
      .eq("id", c.id);
    if (err) setError(needsTableMsg(err));
    load();
  };

  const remove = async (c) => {
    if (!confirmDelete("esta revisión")) return;
    await supabase.from("checkins").delete().eq("id", c.id);
    load();
  };

  return (
    <>
      {!isTrainer && (
        <div className="content-card">
          <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ClipboardCheck size={18} /> Revisión semanal
          </h2>
          {!due ? (
            <p style={{ marginTop: 8 }}>
              ✅ Ya hiciste la revisión esta semana. La próxima, a partir del{" "}
              {new Date(new Date(last.checkin_date).getTime() + 6 * 86400000).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
              })}
              .
            </p>
          ) : (
            <form onSubmit={submit} style={{ marginTop: 10 }}>
              <p style={{ fontSize: 13, color: "var(--dark-60)", marginBottom: 14 }}>
                2 minutos, una vez por semana. Así tu entrenadora puede ajustar tu plan.
              </p>
              {QUESTIONS.map((q) => (
                <div key={q.id} className="form-group">
                  <label className="field-label">{q.label}</label>
                  <Scale value={form[q.id]} onChange={(v) => setForm({ ...form, [q.id]: v })} />
                  <div className="scale-legend">
                    <span>{q.low}</span>
                    <span>{q.high}</span>
                  </div>
                </div>
              ))}
              <div className="form-group">
                <label className="field-label">Peso de hoy (kg, opcional)</label>
                <input type="number" step="0.1" min="0" className="input" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="field-label">¿Algo que contar? (molestias, dudas, logros...)</label>
                <textarea className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <ErrorMsg>{error}</ErrorMsg>
              <button type="submit" className="btn btn-primary btn-block" disabled={saving || !complete}>
                {saving ? "Enviando..." : complete ? "Enviar revisión" : "Responde las 5 preguntas"}
              </button>
              <p style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 8 }}>
                Puedes añadir tus fotos de progreso más abajo.
              </p>
            </form>
          )}
        </div>
      )}

      <div className={isTrainer ? "" : "content-card"}>
        {!isTrainer && <h2 style={{ marginBottom: 10 }}>Mis revisiones</h2>}
        {isTrainer && <ErrorMsg>{error}</ErrorMsg>}
        {list === null && <Loading />}
        {list && list.length === 0 && <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Todavía no hay revisiones.</p>}
        {(list || []).map((c) => (
          <div key={c.id} className="checkin-card">
            <div className="checkin-head">
              <strong>{new Date(c.checkin_date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}</strong>
              {c.weight_kg && <span className="badge">{c.weight_kg} kg</span>}
              {isTrainer && !c.trainer_reply && <span className="badge badge-warn">Sin responder</span>}
            </div>
            <div className="checkin-scores">
              {QUESTIONS.map((q) => (
                <span key={q.id} title={q.label}>
                  {q.short}: {EMOJI[c[q.id]] || "—"} {c[q.id] || ""}
                </span>
              ))}
            </div>
            {c.notes && <p className="checkin-notes">“{c.notes}”</p>}
            {isTrainer ? (
              <div className="checkin-reply-box">
                <textarea
                  className="textarea"
                  placeholder="Tu respuesta (la verá el socio)"
                  value={replies[c.id] ?? c.trainer_reply ?? ""}
                  onChange={(e) => setReplies({ ...replies, [c.id]: e.target.value })}
                />
                <div className="toolbar" style={{ marginTop: 8, marginBottom: 0 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => reply(c)}>
                    {c.trainer_reply ? "Actualizar respuesta" : "Responder"}
                  </button>
                  <button className="btn btn-danger-outline btn-sm" onClick={() => remove(c)}>
                    Borrar
                  </button>
                </div>
              </div>
            ) : (
              c.trainer_reply && (
                <div className="checkin-reply">
                  <strong>Tu entrenadora:</strong> {c.trainer_reply}
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </>
  );
}
