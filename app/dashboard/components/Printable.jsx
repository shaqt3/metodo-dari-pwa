"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, Send, Copy } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { DAY_NAMES, MEALS, formatQty, foodUnit, nutrientsFor, labelOf, DIET_TYPES } from "@/lib/options";
import { Modal, Loading } from "./ui";

/* Ventana con vista para imprimir / guardar en PDF / enviar */
export function PrintModal({ title, shareText, onClose, children }) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    } catch {
      window.prompt("Copia el texto:", shareText);
    }
  };

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="toolbar no-print">
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
          <Printer size={14} /> Descargar PDF / Imprimir
        </button>
        {shareText && (
          <>
            <a
              className="btn btn-outline btn-sm"
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send size={14} /> WhatsApp
            </a>
            <button className="btn btn-outline btn-sm" onClick={copy}>
              <Copy size={14} /> {copied ? "¡Copiado!" : "Copiar texto"}
            </button>
          </>
        )}
      </div>
      <p className="no-print" style={{ fontSize: 12, color: "var(--dark-60)", marginBottom: 12 }}>
        Para guardarlo como PDF, en la ventana de imprimir elige "Guardar como PDF".
      </p>
      <div className="print-area">{children}</div>
      {/* Copia limpia que es la que sale al imprimir */}
      {mounted && createPortal(<div className="print-root">{children}</div>, document.body)}
    </Modal>
  );
}

/* ---------- RUTINA ---------- */
export function RoutinePrint({ plan, onClose }) {
  const [days, setDays] = useState(null);

  useEffect(() => {
    supabase
      .from("routine_days")
      .select("*, routine_exercises(*, exercise_library(name, muscle_group))")
      .eq("routine_id", plan.id)
      .order("day_number")
      .then(({ data }) => setDays(data || []));
  }, [plan.id]);

  const describe = (x) =>
    [x.sets ? `${x.sets} series` : null, x.reps ? `${x.reps} reps` : null, x.weight_kg ? `${x.weight_kg} kg` : null]
      .filter(Boolean)
      .join(" · ");

  const sorted = (days || []).map((d) => ({
    ...d,
    routine_exercises: [...(d.routine_exercises || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
  }));

  const shareText = [
    `🏋️ ${plan.title}`,
    plan.notes ? plan.notes : null,
    ...sorted.map(
      (d) =>
        `\n*${DAY_NAMES[d.day_number - 1]} — ${d.label}*\n` +
        d.routine_exercises.map((x, i) => `${i + 1}. ${x.exercise_library?.name}${describe(x) ? ` (${describe(x)})` : ""}`).join("\n")
    ),
    "\nEl Método Dari",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <PrintModal title="Rutina para imprimir" shareText={days ? shareText : ""} onClose={onClose}>
      <h1 className="print-title">{plan.title}</h1>
      <p className="print-sub">El Método Dari</p>
      {plan.notes && <p className="print-notes">{plan.notes}</p>}
      {days === null && <Loading />}
      {sorted.map((d) => (
        <div key={d.id} className="print-block">
          <h2>
            {DAY_NAMES[d.day_number - 1]} — {d.label}
          </h2>
          {d.notes && <p className="print-notes">{d.notes}</p>}
          <table className="print-table">
            <tbody>
              {d.routine_exercises.map((x, i) => (
                <tr key={x.id}>
                  <td style={{ width: 24 }}>{i + 1}.</td>
                  <td>
                    <strong>{x.exercise_library?.name}</strong>
                    {x.notes ? <div className="print-small">{x.notes}</div> : null}
                  </td>
                  <td style={{ textAlign: "right" }}>{describe(x)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </PrintModal>
  );
}

/* ---------- DIETA ---------- */
export function DietPrint({ diet, items, onClose }) {
  const days = [...new Set(items.map((i) => i.day_number || 1))].sort();
  const mealsOf = (dayItems) =>
    [...MEALS, ...new Set(dayItems.map((i) => i.meal_label))].filter(
      (m, idx, arr) => arr.indexOf(m) === idx && dayItems.some((i) => i.meal_label === m)
    );

  const shareText = [
    `🥗 ${diet.title}`,
    diet.notes || null,
    ...days.map((d) => {
      const di = items.filter((i) => (i.day_number || 1) === d);
      return (
        `\n*${DAY_NAMES[d - 1]}*\n` +
        mealsOf(di)
          .map(
            (m) =>
              `${m}: ` +
              di
                .filter((i) => i.meal_label === m)
                .map((i) => `${i.foods?.name} (${formatQty(i.quantity_g, foodUnit(i.foods))})`)
                .join(", ")
          )
          .join("\n")
      );
    }),
    "\nEl Método Dari",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <PrintModal title="Dieta para imprimir" shareText={shareText} onClose={onClose}>
      <h1 className="print-title">{diet.title}</h1>
      <p className="print-sub">
        El Método Dari{diet.diet_type ? ` · ${labelOf(DIET_TYPES, diet.diet_type)}` : ""}
        {diet.kcal_target ? ` · objetivo ${diet.kcal_target} kcal/día` : ""}
      </p>
      {diet.notes && <p className="print-notes">{diet.notes}</p>}
      {days.map((d) => {
        const di = items.filter((i) => (i.day_number || 1) === d);
        const kcal = di.reduce((s, i) => s + nutrientsFor(i.foods, i.quantity_g).kcal, 0);
        return (
          <div key={d} className="print-block">
            <h2>
              {DAY_NAMES[d - 1]} <span className="print-small">· {Math.round(kcal)} kcal</span>
            </h2>
            <table className="print-table">
              <tbody>
                {mealsOf(di).map((m) => (
                  <tr key={m}>
                    <td style={{ width: 90 }}>
                      <strong>{m}</strong>
                    </td>
                    <td>
                      {di
                        .filter((i) => i.meal_label === m)
                        .map((i) => `${i.foods?.name} (${formatQty(i.quantity_g, foodUnit(i.foods))})`)
                        .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </PrintModal>
  );
}

/* ---------- LISTA DE LA COMPRA ---------- */
export function ShoppingList({ diet, items, onClose }) {
  const allDays = [...new Set(items.map((i) => i.day_number || 1))].sort();
  const [days, setDays] = useState(allDays);
  const [checked, setChecked] = useState({});

  const toggleDay = (d) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));

  // Suma cantidades por alimento
  const totals = {};
  items
    .filter((i) => days.includes(i.day_number || 1))
    .forEach((i) => {
      if (!i.foods) return;
      const key = i.food_id;
      if (!totals[key]) totals[key] = { food: i.foods, qty: 0 };
      totals[key].qty += Number(i.quantity_g) || 0;
    });

  const byCat = {};
  Object.values(totals).forEach((t) => {
    const cat = t.food.category || "Otros";
    (byCat[cat] = byCat[cat] || []).push(t);
  });
  const cats = Object.keys(byCat).sort();

  const cleanName = (n) => n.replace(/\s*\([^)]*\)\s*$/, "");
  const qtyText = (t) => {
    const unit = foodUnit(t.food);
    const q = Math.round(t.qty * 10) / 10;
    if ((unit === "g" || unit === "ml") && q >= 1000) return `${(q / 1000).toLocaleString("es-ES")} ${unit === "g" ? "kg" : "l"}`;
    return formatQty(q, unit);
  };

  const shareText = [
    `🛒 Lista de la compra — ${diet.title}`,
    ...cats.map((c) => `\n*${c}*\n` + byCat[c].map((t) => `• ${cleanName(t.food.name)}: ${qtyText(t)}`).join("\n")),
  ].join("\n");

  return (
    <PrintModal title="Lista de la compra" shareText={shareText} onClose={onClose}>
      <div className="no-print" style={{ marginBottom: 12 }}>
        <label className="field-label">Días que incluye</label>
        <div className="check-grid">
          {allDays.map((d) => (
            <label key={d} className={`check-pill ${days.includes(d) ? "on" : ""}`}>
              <input type="checkbox" checked={days.includes(d)} onChange={() => toggleDay(d)} />
              {DAY_NAMES[d - 1].slice(0, 3)}
            </label>
          ))}
        </div>
      </div>
      <h1 className="print-title">Lista de la compra</h1>
      <p className="print-sub">{diet.title}</p>
      {cats.length === 0 && <p>No hay alimentos en los días elegidos.</p>}
      {cats.map((c) => (
        <div key={c} className="print-block">
          <h2>{c}</h2>
          {byCat[c].map((t) => (
            <label key={t.food.id} className={`shop-item ${checked[t.food.id] ? "checked" : ""}`}>
              <input
                type="checkbox"
                checked={!!checked[t.food.id]}
                onChange={() => setChecked((ch) => ({ ...ch, [t.food.id]: !ch[t.food.id] }))}
              />
              <span>{cleanName(t.food.name)}</span>
              <strong>{qtyText(t)}</strong>
            </label>
          ))}
        </div>
      ))}
      <p className="print-small" style={{ marginTop: 10 }}>
        Las cantidades son de alimento ya preparado según la dieta (por ejemplo, arroz cocido).
      </p>
    </PrintModal>
  );
}
