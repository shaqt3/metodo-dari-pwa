"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { friendlyError } from "@/lib/data";
import { Modal, EditDeleteButtons, confirmDelete, ErrorMsg, Loading } from "./ui";

const FIELDS = [
  { id: "weight_kg", label: "Peso", unit: "kg" },
  { id: "body_fat_pct", label: "% grasa", unit: "%" },
  { id: "waist_cm", label: "Cintura", unit: "cm" },
  { id: "hip_cm", label: "Cadera", unit: "cm" },
  { id: "chest_cm", label: "Pecho", unit: "cm" },
  { id: "arm_cm", label: "Brazo", unit: "cm" },
];

function fmt(n) {
  return Number(n).toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

// Historial de peso y medidas de una persona
export default function Measurements({ userId, title = "Peso y medidas" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("measured_on", { ascending: false });
    if (err) setError(friendlyError(err));
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  const handleDelete = async (r) => {
    if (!confirmDelete("esta medición")) return;
    await supabase.from("body_measurements").delete().eq("id", r.id);
    load();
  };

  const first = rows[rows.length - 1];
  const last = rows[0];
  const diff =
    first && last && first !== last && first.weight_kg && last.weight_kg
      ? Number(last.weight_kg) - Number(first.weight_kg)
      : null;

  return (
    <div className="content-card">
      <div className="section-header" style={{ marginBottom: 8 }}>
        <h2>{title}</h2>
        <button className="btn btn-outline btn-sm" onClick={() => setEditing({})}>
          <Plus size={14} /> Añadir medición
        </button>
      </div>

      {diff !== null && (
        <p style={{ fontSize: 14, marginBottom: 10 }}>
          Desde el {new Date(first.measured_on).toLocaleDateString("es-ES")}:{" "}
          <strong>
            {diff > 0 ? "+" : ""}
            {fmt(diff)} kg
          </strong>
        </p>
      )}

      <ErrorMsg>{error}</ErrorMsg>
      {loading && <Loading />}
      {!loading && rows.length === 0 && !error && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Todavía no hay mediciones.</p>
      )}

      {rows.length > 0 && (
        <div className="table-scroll">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Fecha</th>
                {FIELDS.map((f) => (
                  <th key={f.id}>{f.label}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.measured_on).toLocaleDateString("es-ES")}</td>
                  {FIELDS.map((f) => (
                    <td key={f.id}>{r[f.id] != null ? `${fmt(r[f.id])} ${f.unit}` : "—"}</td>
                  ))}
                  <td>
                    <EditDeleteButtons onEdit={() => setEditing(r)} onDelete={() => handleDelete(r)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <MeasureModal
          userId={userId}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function MeasureModal({ userId, initial, onClose, onSaved }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState(() => {
    const f = { measured_on: initial?.measured_on || new Date().toISOString().slice(0, 10), notes: initial?.notes || "" };
    FIELDS.forEach((x) => (f[x.id] = initial?.[x.id] ?? ""));
    return f;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { user_id: userId, measured_on: form.measured_on, notes: form.notes || null };
    FIELDS.forEach((x) => (payload[x.id] = form[x.id] === "" ? null : Number(form[x.id])));
    const { error: err } = isNew
      ? await supabase.from("body_measurements").insert(payload)
      : await supabase.from("body_measurements").update(payload).eq("id", initial.id);
    setSaving(false);
    if (err) {
      setError(friendlyError(err));
      return;
    }
    onSaved();
  };

  return (
    <Modal title={isNew ? "Nueva medición" : "Editar medición"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="field-label">Fecha</label>
          <input
            type="date"
            required
            className="input"
            value={form.measured_on}
            onChange={(e) => setForm({ ...form, measured_on: e.target.value })}
          />
        </div>
        <div className="form-row form-row-3">
          {FIELDS.map((f) => (
            <div key={f.id} className="form-group">
              <label className="field-label">
                {f.label} ({f.unit})
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="input"
                value={form[f.id]}
                onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="form-group">
          <label className="field-label">Notas</label>
          <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </Modal>
  );
}
