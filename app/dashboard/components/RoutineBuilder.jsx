"use client";

import { useEffect, useState } from "react";
import { Plus, X, Dumbbell } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ExerciseAnimation from "./ExerciseAnimation";

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function RoutineBuilder({ userId, isTrainer }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPlan, setShowNewPlan] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("routines")
      .select("*")
      .order("created_at", { ascending: false });
    setPlans(data || []);
    if (data && data.length > 0 && !selectedPlanId) {
      setSelectedPlanId(data[0].id);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const { data } = await supabase.functions.invoke("admin-users", {
      body: { action: "list" },
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(data?.users || []);
  };

  useEffect(() => {
    fetchPlans();
    if (isTrainer) fetchUsers();
  }, [isTrainer]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Rutinas</h1>
          <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 2 }}>
            Tu plan de entrenamiento por días
          </p>
        </div>
        {isTrainer && (
          <button
            onClick={() => setShowNewPlan(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            Nuevo plan
          </button>
        )}
      </div>

      {loading && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando...</p>
      )}

      {!loading && plans.length === 0 && (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Dumbbell size={22} color="#38bdf8" />
            </div>
            <h3>Todavía no hay ningún plan</h3>
            <p>
              {isTrainer
                ? 'Pulsa "Nuevo plan" para crear el primero.'
                : "Tu entrenadora todavía no te ha asignado un plan."}
            </p>
          </div>
        </div>
      )}

      {plans.length > 0 && (
        <div className="form-group" style={{ maxWidth: 360 }}>
          <select
            className="select"
            value={selectedPlanId || ""}
            onChange={(e) => setSelectedPlanId(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {p.user_id === null ? " (para todos)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPlan && (
        <PlanView plan={selectedPlan} isTrainer={isTrainer} />
      )}

      {showNewPlan && (
        <NewPlanModal
          users={users}
          onClose={() => setShowNewPlan(false)}
          onCreated={(newId) => {
            setShowNewPlan(false);
            fetchPlans().then(() => setSelectedPlanId(newId));
          }}
        />
      )}
    </>
  );
}

function NewPlanModal({ users, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [targetUser, setTargetUser] = useState("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const trainerEmail = sessionData?.session?.user?.email;

    const { data, error: insertError } = await supabase
      .from("routines")
      .insert({
        title,
        notes: notes || null,
        user_id: targetUser === "all" ? null : targetUser,
        created_by: trainerEmail,
      })
      .select()
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onCreated(data.id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo plan</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label">Título del plan</label>
            <input
              required
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Plan de julio - Fuerza"
            />
          </div>

          <div className="form-group">
            <label className="field-label">Notas generales</label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indicaciones generales del plan..."
            />
          </div>

          <div className="form-group">
            <label className="field-label">Para quién es</label>
            <select
              className="select"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
            >
              <option value="all">Todos los usuarios</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="form-message form-message-error">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-block"
          >
            {saving ? "Creando..." : "Crear plan"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PlanView({ plan, isTrainer }) {
  const [days, setDays] = useState([]);
  const [selectedDayNum, setSelectedDayNum] = useState(1);
  const [showNewDay, setShowNewDay] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDays = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("routine_days")
      .select("*")
      .eq("routine_id", plan.id)
      .order("day_number");
    setDays(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDays();
  }, [plan.id]);

  const dayForNumber = (n) => days.find((d) => d.day_number === n);
  const currentDay = dayForNumber(selectedDayNum);

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
              className={`day-cell ${d ? "has-content" : ""} ${
                selectedDayNum === dayNum ? "selected" : ""
              }`}
            >
              <div className="day-name">{name.slice(0, 3)}</div>
              {d && <div className="day-dot" />}
            </div>
          );
        })}
      </div>

      {loading && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando...</p>
      )}

      {!loading && !currentDay && (
        <div className="content-card">
          <div className="empty-state">
            <h3>Sin entrenamiento asignado este día</h3>
            <p>
              {isTrainer
                ? "Puedes añadir un entrenamiento para este día."
                : "Puede que sea tu día de descanso."}
            </p>
            {isTrainer && (
              <button
                onClick={() => setShowNewDay(true)}
                className="btn btn-primary btn-sm"
                style={{ marginTop: 14 }}
              >
                <Plus size={16} />
                Añadir día {DAY_NAMES[selectedDayNum - 1]}
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && currentDay && (
        <DayDetail
          day={currentDay}
          isTrainer={isTrainer}
          onChanged={fetchDays}
        />
      )}

      {showNewDay && (
        <NewDayModal
          routineId={plan.id}
          dayNumber={selectedDayNum}
          onClose={() => setShowNewDay(false)}
          onCreated={() => {
            setShowNewDay(false);
            fetchDays();
          }}
        />
      )}
    </>
  );
}

function NewDayModal({ routineId, dayNumber, onClose, onCreated }) {
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("routine_days").insert({
      routine_id: routineId,
      day_number: dayNumber,
      label: label || DAY_NAMES[dayNumber - 1],
      notes: notes || null,
      video_url: videoUrl || null,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onCreated();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{DAY_NAMES[dayNumber - 1]}</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label">Título del día</label>
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Piernas y glúteo"
            />
          </div>

          <div className="form-group">
            <label className="field-label">Notas</label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indicaciones para este día..."
            />
          </div>

          <div className="form-group">
            <label className="field-label">Vídeo de YouTube (opcional)</label>
            <input
              className="input"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          {error && <p className="form-message form-message-error">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-block"
          >
            {saving ? "Guardando..." : "Crear día"}
          </button>
        </form>
      </div>
    </div>
  );
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.searchParams.get("v")) id = u.searchParams.get("v");
    else if (u.pathname.includes("/embed/")) return url;
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

function DayDetail({ day, isTrainer, onChanged }) {
  const [items, setItems] = useState([]);
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("routine_exercises")
      .select("*, exercise_library(*)")
      .eq("routine_day_id", day.id)
      .order("order_index");
    setItems(data || []);
    setLoading(false);
  };

  const fetchExerciseOptions = async () => {
    const { data } = await supabase
      .from("exercise_library")
      .select("*")
      .order("name");
    setExerciseOptions(data || []);
  };

  useEffect(() => {
    fetchItems();
    if (isTrainer) fetchExerciseOptions();
  }, [day.id, isTrainer]);

  const embedUrl = getYoutubeEmbedUrl(day.video_url);

  return (
    <div className="content-card">
      <div className="section-header" style={{ marginBottom: 0 }}>
        <h2 style={{ fontSize: 17 }}>{day.label}</h2>
        {isTrainer && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-outline btn-sm"
          >
            <Plus size={14} />
            Ejercicio
          </button>
        )}
      </div>

      {day.notes && <p className="routine-notes">{day.notes}</p>}

      {embedUrl && (
        <div className="video-wrap">
          <iframe
            src={embedUrl}
            title={day.label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {loading && (
        <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 14 }}>
          Cargando ejercicios...
        </p>
      )}

      {!loading && items.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 14 }}>
          Todavía no hay ejercicios en este día.
        </p>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              border: "1px solid var(--dark-10)",
              borderRadius: "var(--radius-sm)",
              padding: 12,
            }}
          >
            <div style={{ width: 64, flexShrink: 0 }}>
              <ExerciseAnimation pattern={it.exercise_library?.pattern} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {it.exercise_library?.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 2 }}>
                {[
                  it.sets ? `${it.sets} series` : null,
                  it.reps ? `${it.reps} reps` : null,
                  it.weight_kg ? `${it.weight_kg} kg` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {it.notes && (
                <div style={{ fontSize: 12, color: "var(--dark-70)", marginTop: 4 }}>
                  {it.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <NewExerciseInDayModal
          dayId={day.id}
          exerciseOptions={exerciseOptions}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            fetchItems();
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function NewExerciseInDayModal({ dayId, exerciseOptions, onClose, onCreated }) {
  const [exerciseId, setExerciseId] = useState(exerciseOptions[0]?.id || "");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseId) {
      setError("Elige un ejercicio de la biblioteca.");
      return;
    }
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase
      .from("routine_exercises")
      .insert({
        routine_day_id: dayId,
        exercise_id: exerciseId,
        sets: sets ? Number(sets) : null,
        reps: reps || null,
        weight_kg: weightKg ? Number(weightKg) : null,
        notes: notes || null,
      });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onCreated();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Añadir ejercicio</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label">Ejercicio</label>
            <select
              className="select"
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
            >
              {exerciseOptions.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.category === "funcional" ? "Funcional" : "Máquinas"})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="field-label">Series</label>
              <input
                type="number"
                min="0"
                className="input"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                placeholder="3"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="field-label">Repeticiones</label>
              <input
                className="input"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="12"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="field-label">Peso (kg)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="input"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="20"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="field-label">Notas</label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indicaciones específicas..."
            />
          </div>

          {error && <p className="form-message form-message-error">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-block"
          >
            {saving ? "Guardando..." : "Añadir ejercicio"}
          </button>
        </form>
      </div>
    </div>
  );
}
