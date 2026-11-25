"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Dumbbell, Pencil, Copy, Trash2, ArrowUp, ArrowDown, PlayCircle, Printer, Timer } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { GOALS, LEVELS, EXERCISE_CATEGORIES, DAY_NAMES, labelOf } from "@/lib/options";
import { currentEmail, fetchMembers, displayName, copyRoutine, friendlyError } from "@/lib/data";
import ExerciseAnimation from "./ExerciseAnimation";
import { CopyModal } from "./Nutrition";
import { RoutinePrint } from "./Printable";
import { RestTimer, SetLogger } from "./WorkoutTools";
import { Modal, EditDeleteButtons, confirmDelete, MediaInput, MediaView, ErrorMsg, Loading } from "./ui";

export default function RoutineBuilder({ userId, isTrainer }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showCopy, setShowCopy] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [error, setError] = useState("");

  const fetchPlans = async (selectId) => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("routines")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    // Un socio solo ve sus planes y las plantillas generales
    const list = (data || []).filter((p) => isTrainer || p.user_id === null || p.user_id === userId);
    // El socio ve primero sus propias rutinas
    list.sort((a, b) => Number(b.user_id === userId) - Number(a.user_id === userId));
    setPlans(list);
    setSelectedPlanId((prev) => {
      if (selectId && list.some((p) => p.id === selectId)) return selectId;
      if (prev && list.some((p) => p.id === prev)) return prev;
      return list[0]?.id || null;
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
    if (isTrainer) fetchMembers().then(setMembers).catch(() => {});
  }, [isTrainer, userId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const ownerLabel = (p) =>
    p.user_id === null
      ? "para todos"
      : isTrainer
      ? displayName(members.find((m) => m.id === p.user_id)) || "socio"
      : "mía";

  const deletePlan = async () => {
    if (!selectedPlan) return;
    if (!confirmDelete(`el plan "${selectedPlan.title}" con todos sus días y ejercicios`)) return;
    const { error: delErr } = await supabase.from("routines").delete().eq("id", selectedPlan.id);
    if (delErr) {
      setError(friendlyError(delErr));
      return;
    }
    setSelectedPlanId(null);
    fetchPlans();
  };

  const templates = plans.filter((p) => p.user_id === null);
  const assigned = plans.filter((p) => p.user_id !== null);

  return (
    <>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Rutinas</h1>
          <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 2 }}>Plan de entrenamiento por días</p>
        </div>
        {isTrainer && (
          <button onClick={() => setEditingPlan({})} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Nuevo plan
          </button>
        )}
      </div>

      <ErrorMsg>{error && `Error: ${error}`}</ErrorMsg>
      {loading && <Loading />}

      {!loading && plans.length === 0 && (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Dumbbell size={22} color="#38bdf8" />
            </div>
            <h3>Todavía no hay ningún plan</h3>
            <p>{isTrainer ? 'Pulsa "Nuevo plan" para crear el primero.' : "Tu entrenadora todavía no te ha asignado un plan."}</p>
          </div>
        </div>
      )}

      {plans.length > 0 && (
        <div className="form-group" style={{ maxWidth: 480 }}>
          <label className="field-label">Plan</label>
          <select className="select" value={selectedPlanId || ""} onChange={(e) => setSelectedPlanId(e.target.value)}>
            {isTrainer ? (
              <>
                {assigned.length > 0 && (
                  <optgroup label="Planes de socios">
                    {assigned.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} ({ownerLabel(p)})</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Plantillas (para todos)">
                  {templates.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </optgroup>
              </>
            ) : (
              plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.user_id === userId ? " ⭐ (mi plan)" : ""}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {selectedPlan && isTrainer && (
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setEditingPlan(selectedPlan)}>
            <Pencil size={14} /> Editar plan
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowCopy(true)}>
            <Copy size={14} /> Copiar / asignar a socio
          </button>
          <button className="btn btn-danger-outline btn-sm" onClick={deletePlan}>
            <Trash2 size={14} /> Borrar plan
          </button>
        </div>
      )}

      {selectedPlan && (
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowPrint(true)}>
            <Printer size={14} /> PDF / WhatsApp
          </button>
        </div>
      )}
      {showPrint && selectedPlan && <RoutinePrint plan={selectedPlan} onClose={() => setShowPrint(false)} />}

      {selectedPlan && (selectedPlan.goal || selectedPlan.level) && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {selectedPlan.goal && <span className="badge">{labelOf(GOALS, selectedPlan.goal)}</span>}
          {selectedPlan.level && <span className="badge badge-soft">{labelOf(LEVELS, selectedPlan.level)}</span>}
        </div>
      )}

      {selectedPlan && <PlanView key={selectedPlan.id} plan={selectedPlan} isTrainer={isTrainer} userId={userId} />}

      {editingPlan && (
        <PlanModal
          initial={editingPlan}
          members={members}
          onClose={() => setEditingPlan(null)}
          onSaved={(id) => {
            setEditingPlan(null);
            fetchPlans(id);
          }}
        />
      )}

      {showCopy && selectedPlan && (
        <CopyModal
          item={selectedPlan}
          kind="plan"
          members={members}
          onCopy={(opts) => copyRoutine(selectedPlan.id, opts)}
          onClose={() => setShowCopy(false)}
          onDone={() => {
            setShowCopy(false);
            fetchPlans();
          }}
        />
      )}
    </>
  );
}

export function PlanModal({ initial, members, defaultUserId, onClose, onSaved }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    title: initial?.title || "",
    notes: initial?.notes || "",
    goal: initial?.goal || "",
    level: initial?.level || "",
    target: initial?.id ? initial.user_id || "all" : defaultUserId || "all",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      notes: form.notes || null,
      goal: form.goal || null,
      level: form.level || null,
      user_id: form.target === "all" ? null : form.target,
    };
    const res = isNew
      ? await supabase.from("routines").insert({ ...payload, created_by: await currentEmail() }).select().single()
      : await supabase.from("routines").update(payload).eq("id", initial.id).select().single();
    setSaving(false);
    if (res.error) {
      setError(friendlyError(res.error));
      return;
    }
    onSaved(res.data?.id);
  };

  return (
    <Modal title={isNew ? "Nuevo plan" : "Editar plan"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="field-label">Nombre del plan *</label>
          <input required className="input" value={form.title} onChange={set("title")} placeholder="Ej: Fuerza 3 días - Laura" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="field-label">Objetivo</label>
            <select className="select" value={form.goal} onChange={set("goal")}>
              <option value="">—</option>
              {GOALS.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="field-label">Nivel</label>
            <select className="select" value={form.level} onChange={set("level")}>
              <option value="">—</option>
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="field-label">Indicaciones generales</label>
          <textarea className="textarea" value={form.notes} onChange={set("notes")} placeholder="Ej: calentar 10 minutos antes de empezar..." />
        </div>
        <div className="form-group">
          <label className="field-label">Para quién</label>
          <select className="select" value={form.target} onChange={set("target")}>
            <option value="all">Plantilla (la ven todos)</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{displayName(m)}</option>
            ))}
          </select>
        </div>
        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? "Guardando..." : isNew ? "Crear plan" : "Guardar cambios"}
        </button>
        {isNew && (
          <p style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 10 }}>
            Después elige un día de la semana y añade los ejercicios.
          </p>
        )}
      </form>
    </Modal>
  );
}

function PlanView({ plan, isTrainer, userId }) {
  const [days, setDays] = useState([]);
  const [selectedDayNum, setSelectedDayNum] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  });
  const [editingDay, setEditingDay] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDays = async () => {
    setLoading(true);
    const { data } = await supabase.from("routine_days").select("*").eq("routine_id", plan.id).order("day_number");
    setDays(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDays();
  }, [plan.id]);

  const dayForNumber = (n) => days.find((d) => d.day_number === n);
  const currentDay = dayForNumber(selectedDayNum);

  const deleteDay = async () => {
    if (!confirmDelete(`el entrenamiento del ${DAY_NAMES[selectedDayNum - 1]}`)) return;
    await supabase.from("routine_days").delete().eq("id", currentDay.id);
    fetchDays();
  };

  return (
    <>
      {plan.notes && (
        <div className="content-card" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: "var(--dark-70)" }}>{plan.notes}</p>
        </div>
      )}

      <div className="week-calendar">
        {DAY_NAMES.map((name, i) => {
          const dayNum = i + 1;
          const d = dayForNumber(dayNum);
          return (
            <div
              key={dayNum}
              onClick={() => setSelectedDayNum(dayNum)}
              className={`day-cell ${d ? "has-content" : ""} ${selectedDayNum === dayNum ? "selected" : ""}`}
            >
              <div className="day-name">{name.slice(0, 3)}</div>
              {d && <div className="day-dot" />}
            </div>
          );
        })}
      </div>

      {loading && <Loading />}

      {!loading && !currentDay && (
        <div className="content-card">
          <div className="empty-state">
            <h3>Sin entrenamiento el {DAY_NAMES[selectedDayNum - 1].toLowerCase()}</h3>
            <p>{isTrainer ? "Puedes añadir un entrenamiento para este día." : "Día de descanso 😌"}</p>
            {isTrainer && (
              <button onClick={() => setEditingDay({})} className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>
                <Plus size={16} />
                Añadir entrenamiento del {DAY_NAMES[selectedDayNum - 1].toLowerCase()}
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && currentDay && (
        <DayDetail
          key={currentDay.id}
          day={currentDay}
          isTrainer={isTrainer}
          userId={userId}
          onEditDay={() => setEditingDay(currentDay)}
          onDeleteDay={deleteDay}
        />
      )}

      {editingDay && (
        <DayModal
          routineId={plan.id}
          dayNumber={selectedDayNum}
          initial={editingDay}
          onClose={() => setEditingDay(null)}
          onSaved={() => {
            setEditingDay(null);
            fetchDays();
          }}
        />
      )}
    </>
  );
}

function DayModal({ routineId, dayNumber, initial, onClose, onSaved }) {
  const isNew = !initial?.id;
  const [label, setLabel] = useState(initial?.label || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      label: label || DAY_NAMES[dayNumber - 1],
      notes: notes || null,
      video_url: videoUrl || null,
    };
    const { error: saveErr } = isNew
      ? await supabase.from("routine_days").insert({ ...payload, routine_id: routineId, day_number: dayNumber })
      : await supabase.from("routine_days").update(payload).eq("id", initial.id);
    setSaving(false);
    if (saveErr) {
      setError(friendlyError(saveErr));
      return;
    }
    onSaved();
  };

  return (
    <Modal title={`${isNew ? "Nuevo entrenamiento" : "Editar"} — ${DAY_NAMES[dayNumber - 1]}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="field-label">Título del día</label>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej: Piernas y glúteo" />
        </div>
        <div className="form-group">
          <label className="field-label">Indicaciones</label>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: descanso de 60 segundos entre series" />
        </div>
        <MediaInput label="Vídeo del entrenamiento (opcional)" value={videoUrl} onChange={setVideoUrl} kind="video" folder="rutinas" />
        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? "Guardando..." : isNew ? "Crear día" : "Guardar"}
        </button>
      </form>
    </Modal>
  );
}

function DayDetail({ day, isTrainer, userId, onEditDay, onDeleteDay }) {
  const [showTimer, setShowTimer] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [openVideo, setOpenVideo] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("routine_exercises")
      .select("*, exercise_library(*)")
      .eq("routine_day_id", day.id)
      .order("order_index")
      .order("created_at");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [day.id]);

  const removeItem = async (it) => {
    if (!confirmDelete(`"${it.exercise_library?.name}" de este día`)) return;
    await supabase.from("routine_exercises").delete().eq("id", it.id);
    fetchItems();
  };

  // Subir / bajar un ejercicio en la lista
  const move = async (index, dir) => {
    const other = index + dir;
    if (other < 0 || other >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[other]] = [reordered[other], reordered[index]];
    setItems(reordered);
    await Promise.all(
      reordered.map((it, i) => supabase.from("routine_exercises").update({ order_index: i + 1 }).eq("id", it.id))
    );
  };

  return (
    <div className="content-card">
      <div className="section-header" style={{ marginBottom: 0 }}>
        <h2 style={{ fontSize: 17 }}>{day.label}</h2>
        {isTrainer ? (
          <EditDeleteButtons onEdit={onEditDay} onDelete={onDeleteDay} small={false} />
        ) : (
          <button className="btn btn-outline btn-sm" onClick={() => setShowTimer(true)}>
            <Timer size={14} /> Descanso
          </button>
        )}
      </div>
      {!isTrainer && (
        <p style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 6 }}>
          Pulsa "Apuntar series" en cada ejercicio para guardar tus repeticiones y kilos.
        </p>
      )}
      {showTimer && <RestTimer onClose={() => setShowTimer(false)} />}

      {day.notes && <p className="routine-notes">{day.notes}</p>}
      {day.video_url && <MediaView url={day.video_url} title={day.label} />}

      {loading && <Loading text="Cargando ejercicios..." />}
      {!loading && items.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 14 }}>Todavía no hay ejercicios en este día.</p>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((it, index) => {
          const ex = it.exercise_library;
          return (
            <div key={it.id} className="routine-exercise-row">
              <div className="routine-exercise-main">
                <div style={{ width: 64, flexShrink: 0 }}>
                  {ex?.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ex.photo_url} alt={ex.name} className="routine-exercise-thumb" />
                  ) : (
                    <ExerciseAnimation pattern={ex?.pattern} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {index + 1}. {ex?.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 2 }}>
                    {[it.sets ? `${it.sets} series` : null, it.reps ? `${it.reps} reps` : null, it.weight_kg ? `${it.weight_kg} kg` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {it.notes && <div style={{ fontSize: 12, color: "var(--dark-70)", marginTop: 4 }}>{it.notes}</div>}
                  {ex?.video_url && (
                    <button
                      type="button"
                      className="exercise-video-link"
                      onClick={() => setOpenVideo(openVideo === it.id ? null : it.id)}
                    >
                      <PlayCircle size={14} /> {openVideo === it.id ? "Ocultar vídeo" : "Ver cómo se hace"}
                    </button>
                  )}
                </div>
                {isTrainer && (
                  <div className="row-tools">
                    <button className="icon-btn" onClick={() => move(index, -1)} disabled={index === 0} title="Subir">
                      <ArrowUp size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => move(index, 1)} disabled={index === items.length - 1} title="Bajar">
                      <ArrowDown size={14} />
                    </button>
                    <EditDeleteButtons onEdit={() => setEditingItem(it)} onDelete={() => removeItem(it)} />
                  </div>
                )}
              </div>
              {!isTrainer && ex && userId && <SetLogger userId={userId} exercise={ex} planned={it} />}
              {openVideo === it.id && <MediaView url={ex.video_url} title={ex.name} />}
              {openVideo === it.id && ex?.description && <p className="routine-notes">{ex.description}</p>}
            </div>
          );
        })}
      </div>

      {isTrainer && (
        <button onClick={() => setEditingItem({})} className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
          <Plus size={14} /> Añadir ejercicio
        </button>
      )}

      {editingItem && (
        <DayExerciseModal
          dayId={day.id}
          initial={editingItem}
          nextIndex={items.length + 1}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}

function DayExerciseModal({ dayId, initial, nextIndex, onClose, onSaved }) {
  const isNew = !initial?.id;
  const [options, setOptions] = useState([]);
  const [query, setQuery] = useState("");
  const [exerciseId, setExerciseId] = useState(initial?.exercise_id || "");
  const [sets, setSets] = useState(initial?.sets ?? "");
  const [reps, setReps] = useState(initial?.reps ?? "");
  const [weightKg, setWeightKg] = useState(initial?.weight_kg ?? "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("exercise_library")
      .select("id, name, category, muscle_group")
      .order("name")
      .then(({ data }) => setOptions(data || []));
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      options.filter(
        (o) => !q || o.name.toLowerCase().includes(q) || (o.muscle_group || "").toLowerCase().includes(q)
      ),
    [options, q]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseId) {
      setError("Elige un ejercicio de la lista.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      exercise_id: exerciseId,
      sets: sets === "" ? null : Number(sets),
      reps: reps === "" ? null : String(reps),
      weight_kg: weightKg === "" ? null : Number(weightKg),
      notes: notes || null,
    };
    const { error: saveErr } = isNew
      ? await supabase.from("routine_exercises").insert({ ...payload, routine_day_id: dayId, order_index: nextIndex })
      : await supabase.from("routine_exercises").update(payload).eq("id", initial.id);
    setSaving(false);
    if (saveErr) {
      setError(friendlyError(saveErr));
      return;
    }
    onSaved();
  };

  return (
    <Modal title={isNew ? "Añadir ejercicio" : "Editar ejercicio"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="field-label">Ejercicio</label>
          <input className="input" style={{ marginBottom: 8 }} placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="select food-picker" size={6} value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
            {filtered.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} — {labelOf(EXERCISE_CATEGORIES, ex.category)}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 6 }}>
            ¿No está? Añádelo antes en la pestaña "Ejercicios".
          </p>
        </div>

        <div className="form-row form-row-3">
          <div className="form-group">
            <label className="field-label">Series</label>
            <input type="number" min="0" className="input" value={sets} onChange={(e) => setSets(e.target.value)} placeholder="3" />
          </div>
          <div className="form-group">
            <label className="field-label">Repeticiones</label>
            <input className="input" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="12 o 30 seg" />
          </div>
          <div className="form-group">
            <label className="field-label">Peso (kg)</label>
            <input type="number" min="0" step="0.5" className="input" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="20" />
          </div>
        </div>

        <div className="form-group">
          <label className="field-label">Notas</label>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: bajar lento, 2 segundos" />
        </div>

        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? "Guardando..." : isNew ? "Añadir ejercicio" : "Guardar"}
        </button>
      </form>
    </Modal>
  );
}
