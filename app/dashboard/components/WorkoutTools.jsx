"use client";

import { useEffect, useRef, useState } from "react";
import { Timer, X, Plus, Minus, Check, LineChart as ChartIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { friendlyError } from "@/lib/data";
import LineChart from "./Chart";
import { ErrorMsg } from "./ui";

const today = () => new Date().toISOString().slice(0, 10);

/* ============================================================
   TEMPORIZADOR DE DESCANSO (flotante)
============================================================ */
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.15);
    });
  } catch {}
  try {
    navigator.vibrate?.([300, 150, 300]);
  } catch {}
}

export function RestTimer({ onClose }) {
  const [total, setTotal] = useState(60);
  const [left, setLeft] = useState(null); // null = parado
  const [runId, setRunId] = useState(0);
  const endRef = useRef(0);

  useEffect(() => {
    if (!runId) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(id);
        beep();
      }
    }, 250);
    return () => clearInterval(id);
  }, [runId]);

  const start = (secs) => {
    setTotal(secs);
    endRef.current = Date.now() + secs * 1000;
    setLeft(secs);
    setRunId((n) => n + 1);
  };

  const add = (secs) => {
    endRef.current += secs * 1000;
    setTotal((t) => t + secs);
    setLeft((l) => Math.max(0, (l || 0) + secs));
  };

  const mm = String(Math.floor((left ?? total) / 60)).padStart(1, "0");
  const ss = String((left ?? total) % 60).padStart(2, "0");
  const pct = left === null ? 0 : 1 - left / total;

  return (
    <div className="rest-timer">
      <div className="rest-timer-head">
        <span>
          <Timer size={15} /> Descanso
        </span>
        <button onClick={onClose} aria-label="Cerrar temporizador">
          <X size={16} />
        </button>
      </div>
      <div className={`rest-timer-time ${left === 0 ? "done" : ""}`}>
        {left === 0 ? "¡A por la siguiente!" : `${mm}:${ss}`}
      </div>
      <div className="rest-timer-bar">
        <div style={{ width: `${pct * 100}%` }} />
      </div>
      {left === null || left === 0 ? (
        <div className="rest-timer-presets">
          {[30, 60, 90, 120, 180].map((s) => (
            <button key={s} onClick={() => start(s)}>
              {s < 60 ? `${s} s` : `${Math.floor(s / 60)}${s % 60 ? ",5" : ""} min`}
            </button>
          ))}
        </div>
      ) : (
        <div className="rest-timer-presets">
          <button onClick={() => add(-15)}>−15s</button>
          <button onClick={() => add(15)}>+15s</button>
          <button onClick={() => { setRunId(0); setLeft(null); }}>Parar</button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   APUNTAR SERIES DE UN EJERCICIO
============================================================ */
export function SetLogger({ userId, exercise, planned, onSaved }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [lastSession, setLastSession] = useState(null);
  const [doneToday, setDoneToday] = useState(false);
  const [history, setHistory] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error: err } = await supabase
      .from("set_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("exercise_id", exercise.id)
      .order("log_date", { ascending: false })
      .order("set_number")
      .limit(200);
    if (err) {
      setError(/does not exist|schema cache/i.test(err.message)
        ? "Falta ejecutar V8_TODO_LO_NUEVO.sql en Supabase."
        : friendlyError(err));
      return;
    }
    const all = data || [];
    setHistory(all);
    const t = today();
    const todays = all.filter((r) => r.log_date === t);
    const prevDate = all.find((r) => r.log_date !== t)?.log_date;
    const prev = prevDate ? all.filter((r) => r.log_date === prevDate) : [];
    setLastSession(prev.length ? { date: prevDate, sets: prev } : null);
    setDoneToday(todays.length > 0);

    const base = todays.length ? todays : prev;
    if (base.length) {
      setRows(base.map((r) => ({ reps: r.reps ?? "", weight: r.weight_kg ?? "", done: todays.length > 0 })));
    } else {
      const n = Number(planned?.sets) || 3;
      const reps = parseInt(planned?.reps, 10);
      setRows(
        Array.from({ length: n }, () => ({
          reps: isNaN(reps) ? "" : reps,
          weight: planned?.weight_kg ?? "",
          done: false,
        }))
      );
    }
  };

  useEffect(() => {
    if (open && history === null) load();
  }, [open]);

  useEffect(() => {
    // Saber si ya está hecho hoy sin abrirlo
    supabase
      .from("set_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("exercise_id", exercise.id)
      .eq("log_date", today())
      .then(({ count }) => setDoneToday((count || 0) > 0));
  }, [userId, exercise.id]);

  const update = (i, k, v) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  const save = async () => {
    setSaving(true);
    setError("");
    const valid = rows.filter((r) => r.reps !== "" || r.weight !== "");
    // Sustituye lo apuntado hoy para este ejercicio
    const { error: delErr } = await supabase
      .from("set_logs")
      .delete()
      .eq("user_id", userId)
      .eq("exercise_id", exercise.id)
      .eq("log_date", today());
    if (delErr) {
      setError(friendlyError(delErr));
      setSaving(false);
      return;
    }
    if (valid.length) {
      const { error: insErr } = await supabase.from("set_logs").insert(
        valid.map((r, i) => ({
          user_id: userId,
          exercise_id: exercise.id,
          log_date: today(),
          set_number: i + 1,
          reps: r.reps === "" ? null : Number(r.reps),
          weight_kg: r.weight === "" ? null : Number(r.weight),
        }))
      );
      if (insErr) {
        setError(friendlyError(insErr));
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setHistory(null);
    setOpen(false);
    setDoneToday(valid.length > 0);
    onSaved && onSaved();
  };

  // Mayor peso de cada día, para la gráfica
  const chartPoints = Object.values(
    (history || []).reduce((acc, r) => {
      if (r.weight_kg == null) return acc;
      const w = Number(r.weight_kg);
      if (!acc[r.log_date] || acc[r.log_date].y < w) acc[r.log_date] = { x: r.log_date, y: w };
      return acc;
    }, {})
  );

  return (
    <div className="set-logger">
      <button type="button" className={`set-logger-toggle ${doneToday ? "done" : ""}`} onClick={() => setOpen(!open)}>
        {doneToday ? <Check size={14} /> : <Plus size={14} />}
        {doneToday ? "Hecho hoy · editar" : "Apuntar series"}
      </button>

      {open && (
        <div className="set-logger-body">
          {lastSession && (
            <p className="set-logger-last">
              Última vez ({new Date(lastSession.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}):{" "}
              {lastSession.sets.map((s) => `${s.reps ?? "?"}×${s.weight_kg ?? 0}kg`).join(" · ")}
            </p>
          )}
          <div className="set-table">
            <div className="set-row set-row-head">
              <span>Serie</span>
              <span>Reps</span>
              <span>Kg</span>
              <span></span>
            </div>
            {rows.map((r, i) => (
              <div key={i} className={`set-row ${r.done ? "is-done" : ""}`}>
                <span>{i + 1}</span>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={r.reps}
                  onChange={(e) => update(i, "reps", e.target.value)}
                />
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={r.weight}
                  onChange={(e) => update(i, "weight", e.target.value)}
                />
                <button
                  type="button"
                  className={`icon-btn ${r.done ? "icon-btn-ok" : ""}`}
                  onClick={() => update(i, "done", !r.done)}
                  title="Marcar serie hecha"
                >
                  <Check size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="toolbar" style={{ marginTop: 10, marginBottom: 0 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setRows((r) => [...r, { ...(r[r.length - 1] || { reps: "", weight: "" }), done: false }])}>
              <Plus size={14} /> Serie
            </button>
            {rows.length > 1 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRows((r) => r.slice(0, -1))}>
                <Minus size={14} /> Serie
              </button>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
            {chartPoints.length > 1 && (
              <button type="button" className="link-btn" onClick={() => setShowChart(!showChart)}>
                <ChartIcon size={14} style={{ verticalAlign: "-2px" }} /> {showChart ? "Ocultar progreso" : "Ver progreso"}
              </button>
            )}
          </div>
          {showChart && (
            <div style={{ marginTop: 12 }}>
              <LineChart points={chartPoints} unit="kg" height={150} />
            </div>
          )}
          <ErrorMsg>{error}</ErrorMsg>
        </div>
      )}
    </div>
  );
}
