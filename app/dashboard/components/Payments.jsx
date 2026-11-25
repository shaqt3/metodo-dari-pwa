"use client";

import { useEffect, useState } from "react";
import { Check, Plus, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fetchMembers, displayName, friendlyError } from "@/lib/data";
import { Modal, ErrorMsg, Loading, confirmDelete, EditDeleteButtons } from "./ui";

const METHODS = ["Efectivo", "Bizum", "Transferencia", "Tarjeta", "Otro"];

export function currentPeriod(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftPeriod(period, delta) {
  const [y, m] = period.split("-").map(Number);
  return currentPeriod(new Date(y, m - 1 + delta, 1));
}

export function periodLabel(period) {
  const [y, m] = period.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const money = (n) =>
  n == null || n === "" ? "—" : Number(n).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

function needsTableMsg(err) {
  return /does not exist|schema cache/i.test(err?.message || "")
    ? "Falta ejecutar V8_TODO_LO_NUEVO.sql en Supabase."
    : friendlyError(err);
}

/* ============================================================
   RESUMEN DEL MES (entrenadora)
============================================================ */
export function PaymentsOverview({ onOpenMember }) {
  const [period, setPeriod] = useState(currentPeriod());
  const [members, setMembers] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paying, setPaying] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    const [m, { data, error: err }] = await Promise.all([
      fetchMembers().catch(() => []),
      supabase.from("payments").select("*").eq("period", period),
    ]);
    if (err) setError(needsTableMsg(err));
    setMembers(m.filter((x) => x.active !== false));
    setPayments(data || []);
  };

  useEffect(() => {
    load();
  }, [period]);

  if (members === null) return <Loading />;

  const paidOf = (id) => payments.filter((p) => p.user_id === id);
  const paidCount = members.filter((m) => paidOf(m.id).length).length;
  const collected = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const pending = members
    .filter((m) => !paidOf(m.id).length)
    .reduce((s, m) => s + (Number(m.monthly_fee) || 0), 0);

  const reminder = (m) => {
    const name = displayName(m).split(" ")[0];
    const text = `¡Hola ${name}! Te recuerdo que está pendiente la cuota de ${periodLabel(period).toLowerCase()}${
      m.monthly_fee ? ` (${money(m.monthly_fee)})` : ""
    }. ¡Gracias! 💪`;
    const phone = (m.phone || "").replace(/\D/g, "");
    return `https://wa.me/${phone ? (phone.length === 9 ? "34" + phone : phone) : ""}?text=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <div className="period-picker">
        <button className="icon-btn" onClick={() => setPeriod(shiftPeriod(period, -1))} aria-label="Mes anterior">
          <ChevronLeft size={16} />
        </button>
        <strong>{periodLabel(period)}</strong>
        <button className="icon-btn" onClick={() => setPeriod(shiftPeriod(period, 1))} aria-label="Mes siguiente">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-value">
            {paidCount}/{members.length}
          </div>
          <div className="stat-label">Han pagado</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-sm">{money(collected)}</div>
          <div className="stat-label">Cobrado</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-sm">{money(pending)}</div>
          <div className="stat-label">Pendiente</div>
        </div>
      </div>

      <ErrorMsg>{error}</ErrorMsg>

      <div className="member-list">
        {members.map((m) => {
          const paid = paidOf(m.id);
          return (
            <div key={m.id} className={`pay-row ${paid.length ? "is-paid" : ""}`}>
              <button className="pay-row-name" onClick={() => onOpenMember && onOpenMember(m)}>
                <strong>{displayName(m)}</strong>
                <span>
                  {m.monthly_fee ? `${money(m.monthly_fee)}/mes` : "Sin cuota fijada"}
                  {m.payment_day ? ` · paga el día ${m.payment_day}` : ""}
                </span>
              </button>
              {paid.length ? (
                <span className="completed-tag">
                  <Check size={15} /> Pagado {money(paid.reduce((s, p) => s + (Number(p.amount) || 0), 0))}
                </span>
              ) : (
                <div className="toolbar" style={{ marginBottom: 0 }}>
                  <a className="btn btn-outline btn-sm" href={reminder(m)} target="_blank" rel="noopener noreferrer">
                    <Send size={13} /> Recordar
                  </a>
                  <button className="btn btn-primary btn-sm" onClick={() => setPaying(m)}>
                    Marcar pagado
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {paying && (
        <PaymentModal
          member={paying}
          defaultPeriod={period}
          onClose={() => setPaying(null)}
          onSaved={() => {
            setPaying(null);
            load();
          }}
        />
      )}
    </>
  );
}

function PaymentModal({ member, defaultPeriod, initial, onClose, onSaved }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    period: initial?.period || defaultPeriod || currentPeriod(),
    amount: initial?.amount ?? member?.monthly_fee ?? "",
    paid_on: initial?.paid_on || new Date().toISOString().slice(0, 10),
    method: initial?.method || "Bizum",
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      user_id: member.id,
      period: form.period,
      amount: form.amount === "" ? null : Number(form.amount),
      paid_on: form.paid_on,
      method: form.method,
      notes: form.notes || null,
    };
    const { error: err } = isNew
      ? await supabase.from("payments").insert(payload)
      : await supabase.from("payments").update(payload).eq("id", initial.id);
    setSaving(false);
    if (err) {
      setError(needsTableMsg(err));
      return;
    }
    onSaved();
  };

  return (
    <Modal title={`${isNew ? "Pago de" : "Editar pago de"} ${displayName(member)}`} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group">
            <label className="field-label">Mes que paga</label>
            <input type="month" required className="input" value={form.period} onChange={set("period")} />
          </div>
          <div className="form-group">
            <label className="field-label">Importe (€)</label>
            <input type="number" step="0.01" min="0" className="input" value={form.amount} onChange={set("amount")} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="field-label">Fecha de pago</label>
            <input type="date" className="input" value={form.paid_on} onChange={set("paid_on")} />
          </div>
          <div className="form-group">
            <label className="field-label">Forma de pago</label>
            <select className="select" value={form.method} onChange={set("method")}>
              {METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="field-label">Notas</label>
          <input className="input" value={form.notes} onChange={set("notes")} />
        </div>
        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
          {saving ? "Guardando..." : "Guardar pago"}
        </button>
      </form>
    </Modal>
  );
}

/* ============================================================
   PAGOS DE UN SOCIO (ficha del socio o su perfil)
============================================================ */
export function MemberPayments({ member, isTrainer }) {
  const [payments, setPayments] = useState(null);
  const [fee, setFee] = useState(member.monthly_fee ?? "");
  const [day, setDay] = useState(member.payment_day ?? "");
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error: err } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", member.id)
      .order("period", { ascending: false });
    if (err) setError(needsTableMsg(err));
    setPayments(data || []);
  };

  useEffect(() => {
    load();
    if (!isTrainer) {
      supabase
        .from("profiles")
        .select("monthly_fee, payment_day")
        .eq("id", member.id)
        .maybeSingle()
        .then(({ data }) => {
          setFee(data?.monthly_fee ?? "");
          setDay(data?.payment_day ?? "");
        });
    }
  }, [member.id]);

  const saveFee = async () => {
    setMsg("");
    const { error: err } = await supabase
      .from("profiles")
      .update({ monthly_fee: fee === "" ? null : Number(fee), payment_day: day === "" ? null : Number(day) })
      .eq("id", member.id);
    if (err) setError(needsTableMsg(err));
    else setMsg("Guardado ✓");
  };

  const remove = async (p) => {
    if (!confirmDelete(`el pago de ${periodLabel(p.period)}`)) return;
    await supabase.from("payments").delete().eq("id", p.id);
    load();
  };

  const paidThisMonth = (payments || []).some((p) => p.period === currentPeriod());

  return (
    <div>
      {isTrainer ? (
        <div className="assign-box" style={{ marginBottom: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="field-label">Cuota mensual (€)</label>
              <input type="number" min="0" step="0.01" className="input" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="field-label">Día de pago (1-31)</label>
              <input type="number" min="1" max="31" className="input" value={day} onChange={(e) => setDay(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={saveFee}>
            Guardar cuota
          </button>
          {msg && <span style={{ fontSize: 13, marginLeft: 10 }}>{msg}</span>}
        </div>
      ) : (
        <p style={{ fontSize: 14, marginBottom: 12 }}>
          Cuota: <strong>{fee ? `${money(fee)}/mes` : "—"}</strong>
          {day ? ` · se paga el día ${day}` : ""} ·{" "}
          {paidThisMonth ? "✅ Este mes está pagado" : "⏳ Este mes aún no consta como pagado"}
        </p>
      )}

      <ErrorMsg>{error}</ErrorMsg>
      {payments === null && <Loading />}
      {payments && payments.length === 0 && !error && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>No hay pagos registrados.</p>
      )}
      {(payments || []).map((p) => (
        <div key={p.id} className="diet-food-row">
          <span>
            <strong>{periodLabel(p.period)}</strong>
            <span style={{ color: "var(--dark-60)", fontSize: 12 }}>
              {" "}
              · {new Date(p.paid_on).toLocaleDateString("es-ES")}
              {p.method ? ` · ${p.method}` : ""}
            </span>
          </span>
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {money(p.amount)}
            {isTrainer && <EditDeleteButtons onEdit={() => setEditing(p)} onDelete={() => remove(p)} />}
          </span>
        </div>
      ))}

      {isTrainer && (
        <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setEditing({})}>
          <Plus size={14} /> Apuntar pago
        </button>
      )}

      {editing && (
        <PaymentModal
          member={{ ...member, monthly_fee: fee }}
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
