"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { GOALS, MODALITIES, DIET_NEEDS } from "@/lib/options";
import { friendlyError } from "@/lib/data";
import { CheckboxGroup, ErrorMsg, Loading } from "./ui";

// Ficha de datos de una persona. trainerView = la ve la entrenadora
// (puede escribir notas privadas y marcar si está activo).
export default function ProfileForm({ userId, email, trainerView = false, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      setForm({
        full_name: data?.full_name || "",
        phone: data?.phone || "",
        birth_date: data?.birth_date || "",
        sex: data?.sex || "",
        height_cm: data?.height_cm ?? "",
        weight_kg: data?.weight_kg ?? "",
        goal: data?.goal || "",
        modality: data?.modality || "",
        diet_needs: data?.diet_needs || [],
        allergies: (data?.allergies || []).join(", "),
        trainer_notes: data?.trainer_notes || "",
        active: data?.active ?? true,
        start_date: data?.start_date || "",
      });
    };
    if (userId) load();
  }, [userId]);

  if (!form) return <Loading />;

  const set = (k) => (v) => {
    setMessage("");
    setForm((f) => ({ ...f, [k]: v?.target ? (v.target.type === "checkbox" ? v.target.checked : v.target.value) : v }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      id: userId,
      full_name: form.full_name || null,
      phone: form.phone || null,
      birth_date: form.birth_date || null,
      sex: form.sex || null,
      height_cm: form.height_cm === "" ? null : Number(form.height_cm),
      weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      goal: form.goal || null,
      modality: form.modality || null,
      diet_needs: form.diet_needs,
      allergies: form.allergies
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean),
      updated_at: new Date().toISOString(),
    };
    if (email) payload.email = email;
    if (trainerView) {
      payload.trainer_notes = form.trainer_notes || null;
      payload.active = form.active;
      payload.start_date = form.start_date || null;
    }
    const { error: saveErr } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (saveErr) {
      setError(friendlyError(saveErr));
      return;
    }
    setMessage("Guardado ✓");
    onSaved && onSaved();
  };

  return (
    <form onSubmit={handleSave}>
      <div className="form-row">
        <div className="form-group">
          <label className="field-label">Nombre y apellidos</label>
          <input className="input" value={form.full_name} onChange={set("full_name")} placeholder="Ej: Laura García" />
        </div>
        <div className="form-group">
          <label className="field-label">Teléfono</label>
          <input className="input" type="tel" value={form.phone} onChange={set("phone")} placeholder="600 000 000" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="field-label">Fecha de nacimiento</label>
          <input className="input" type="date" value={form.birth_date} onChange={set("birth_date")} />
        </div>
        <div className="form-group">
          <label className="field-label">Sexo</label>
          <select className="select" value={form.sex} onChange={set("sex")}>
            <option value="">—</option>
            <option value="mujer">Mujer</option>
            <option value="hombre">Hombre</option>
            <option value="otro">Otro / prefiero no decirlo</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="field-label">Altura (cm)</label>
          <input className="input" type="number" min="0" value={form.height_cm} onChange={set("height_cm")} placeholder="165" />
        </div>
        <div className="form-group">
          <label className="field-label">Peso inicial (kg)</label>
          <input className="input" type="number" min="0" step="0.1" value={form.weight_kg} onChange={set("weight_kg")} placeholder="65" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="field-label">Objetivo</label>
          <select className="select" value={form.goal} onChange={set("goal")}>
            <option value="">— Elige —</option>
            {GOALS.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="field-label">Modalidad</label>
          <select className="select" value={form.modality} onChange={set("modality")}>
            <option value="">— Elige —</option>
            {MODALITIES.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="field-label">Alimentación especial</label>
        <CheckboxGroup options={DIET_NEEDS} values={form.diet_needs} onChange={set("diet_needs")} />
      </div>

      <div className="form-group">
        <label className="field-label">Otras alergias o intolerancias (separadas por comas)</label>
        <input className="input" value={form.allergies} onChange={set("allergies")} placeholder="Ej: soja, sésamo" />
      </div>

      {trainerView && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label className="field-label">Socio desde</label>
              <input className="input" type="date" value={form.start_date} onChange={set("start_date")} />
            </div>
            <div className="form-group">
              <label className="field-label">Estado</label>
              <label className="check-pill on" style={{ width: "100%" }}>
                <input type="checkbox" checked={form.active} onChange={set("active")} />
                {form.active ? "Activo" : "De baja"}
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="field-label">Notas privadas (lesiones, horarios, observaciones...)</label>
            <textarea className="textarea" value={form.trainer_notes} onChange={set("trainer_notes")} placeholder="Solo las ves tú" />
          </div>
        </>
      )}

      <ErrorMsg>{error}</ErrorMsg>
      {message && <p className="form-message form-message-info">{message}</p>}
      <button type="submit" disabled={saving} className="btn btn-primary btn-block">
        {saving ? "Guardando..." : "Guardar datos"}
      </button>
    </form>
  );
}
