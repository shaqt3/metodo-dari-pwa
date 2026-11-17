"use client";

import { useEffect, useState } from "react";
import { Plus, PersonStanding, Dumbbell, Activity, Zap, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { EXERCISE_CATEGORIES, LEVELS, labelOf } from "@/lib/options";
import { friendlyError } from "@/lib/data";
import ExerciseAnimation from "./ExerciseAnimation";
import {
  Modal,
  EditDeleteButtons,
  confirmDelete,
  ChipFilter,
  MediaInput,
  MediaView,
  ErrorMsg,
  Loading,
} from "./ui";

const LEGEND = [
  { icon: PersonStanding, color: "#38bdf8", label: "Piernas / cadera (sentadilla, zancada, peso muerto...)" },
  { icon: Dumbbell, color: "#0f172a", label: "Empuje o tirón de brazos/espalda (press, remo, curl...)" },
  { icon: Activity, color: "#0369a1", label: "Core / mantenimiento (plancha, abdominales...)" },
  { icon: Zap, color: "#f59e0b", label: "Cardio / salto (burpees, jumping jacks, correr...)" },
];

export default function ExerciseLibrary({ isTrainer }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("todos");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // null | {} (nuevo) | ejercicio
  const [error, setError] = useState("");

  const fetchExercises = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("exercise_library")
      .select("*")
      .order("name");
    if (fetchError) setError(fetchError.message);
    setExercises(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleDelete = async (ex) => {
    if (!confirmDelete(`el ejercicio "${ex.name}" (también se quitará de las rutinas donde aparezca)`)) return;
    const { error: delError } = await supabase.from("exercise_library").delete().eq("id", ex.id);
    if (delError) {
      setError(friendlyError(delError));
      return;
    }
    fetchExercises();
  };

  const q = query.trim().toLowerCase();
  const filtered = exercises.filter(
    (e) =>
      (category === "todos" || e.category === category) &&
      (!q ||
        e.name.toLowerCase().includes(q) ||
        (e.muscle_group || "").toLowerCase().includes(q))
  );

  return (
    <>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Ejercicios</h1>
          <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 2 }}>
            {exercises.length} ejercicios con explicación, foto y vídeo
          </p>
        </div>
        {isTrainer && (
          <button onClick={() => setEditing({})} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Añadir ejercicio
          </button>
        )}
      </div>

      <div className="search-input-wrap">
        <input
          className="input"
          placeholder="Buscar por nombre o músculo (ej: glúteo)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ChipFilter
        options={[{ id: "todos", label: "Todos" }, ...EXERCISE_CATEGORIES]}
        value={category}
        onChange={setCategory}
      />

      <details className="exercise-legend-details">
        <summary>¿Qué significan los iconos?</summary>
        <div className="exercise-legend">
          {LEGEND.map(({ icon: Icon, color, label }) => (
            <div key={label} className="exercise-legend-item">
              <Icon size={15} color={color} strokeWidth={1.8} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </details>

      <ErrorMsg>{error && `Error: ${error}`}</ErrorMsg>
      {loading && <Loading />}
      {!loading && filtered.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>No hay ejercicios que coincidan.</p>
      )}

      <div className="exercise-grid">
        {filtered.map((ex) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            isTrainer={isTrainer}
            onEdit={() => setEditing(ex)}
            onDelete={() => handleDelete(ex)}
          />
        ))}
      </div>

      {editing && (
        <ExerciseModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchExercises();
          }}
        />
      )}
    </>
  );
}

function ExerciseCard({ ex, isTrainer, onEdit, onDelete }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="exercise-card">
      {isTrainer && (
        <div className="card-corner-actions">
          <EditDeleteButtons onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
      {ex.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ex.photo_url} alt={ex.name} className="exercise-photo" />
      ) : (
        <ExerciseAnimation pattern={ex.pattern} />
      )}
      <h3>{ex.name}</h3>
      <div className="exercise-muscle">
        {[ex.muscle_group, labelOf(EXERCISE_CATEGORIES, ex.category), labelOf(LEVELS, ex.level)]
          .filter(Boolean)
          .join(" · ")}
      </div>
      {ex.equipment && <div className="exercise-muscle">Material: {ex.equipment}</div>}

      {ex.video_url && (
        <>
          <button type="button" onClick={() => setShowVideo(!showVideo)} className="exercise-video-link">
            <PlayCircle size={14} />
            {showVideo ? "Ocultar vídeo" : "Ver vídeo"}
          </button>
          {showVideo && <MediaView url={ex.video_url} title={ex.name} />}
        </>
      )}

      {ex.description ? (
        <div className="exercise-desc">
          <span className="exercise-desc-label">Cómo se hace</span>
          <p>{ex.description}</p>
        </div>
      ) : (
        <div className="exercise-desc exercise-desc-empty">Todavía no tiene explicación escrita.</div>
      )}
    </div>
  );
}

export function ExerciseModal({ initial, onClose, onSaved }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    name: initial?.name || "",
    category: initial?.category || "funcional",
    muscle_group: initial?.muscle_group || "",
    pattern: initial?.pattern || "squat",
    level: initial?.level || "",
    equipment: initial?.equipment || "",
    description: initial?.description || "",
    video_url: initial?.video_url || "",
    photo_url: initial?.photo_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      level: form.level || null,
      equipment: form.equipment || null,
      video_url: form.video_url || null,
      photo_url: form.photo_url || null,
    };
    const { error: saveError } = isNew
      ? await supabase.from("exercise_library").insert(payload)
      : await supabase.from("exercise_library").update(payload).eq("id", initial.id);
    setSaving(false);
    if (saveError) {
      setError(
        /duplicate|unique/i.test(saveError.message)
          ? "Ya existe un ejercicio con ese nombre."
          : friendlyError(saveError)
      );
      return;
    }
    onSaved();
  };

  return (
    <Modal title={isNew ? "Nuevo ejercicio" : "Editar ejercicio"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="field-label">Nombre *</label>
          <input required className="input" value={form.name} onChange={set("name")} placeholder="Ej: Peso muerto rumano" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="field-label">Tipo</label>
            <select className="select" value={form.category} onChange={set("category")}>
              {EXERCISE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="field-label">Nivel</label>
            <select className="select" value={form.level} onChange={set("level")}>
              <option value="">Todos los niveles</option>
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="field-label">Músculo que trabaja</label>
            <input className="input" value={form.muscle_group} onChange={set("muscle_group")} placeholder="Ej: Glúteo, Espalda..." />
          </div>
          <div className="form-group">
            <label className="field-label">Material</label>
            <input className="input" value={form.equipment} onChange={set("equipment")} placeholder="Ej: Mancuernas" />
          </div>
        </div>

        <div className="form-group">
          <label className="field-label">Dibujo (si no hay foto)</label>
          <select className="select" value={form.pattern} onChange={set("pattern")}>
            <option value="squat">Piernas: flexión (sentadilla, prensa...)</option>
            <option value="lunge">Piernas: zancada</option>
            <option value="hinge">Cadera: bisagra (peso muerto, swing...)</option>
            <option value="press">Brazos: empuje (press, flexiones...)</option>
            <option value="pull">Brazos: tirón (remo, curl, jalón...)</option>
            <option value="core">Core (plancha, abdominales...)</option>
            <option value="cardio">Cardio (burpees, correr...)</option>
            <option value="jump">Salto (jumping jacks, box jump...)</option>
          </select>
        </div>

        <MediaInput label="Foto" value={form.photo_url} onChange={set("photo_url")} kind="image" folder="ejercicios" />
        <MediaInput label="Vídeo" value={form.video_url} onChange={set("video_url")} kind="video" folder="ejercicios" />

        <div className="form-group">
          <label className="field-label">Cómo se hace</label>
          <textarea className="textarea" value={form.description} onChange={set("description")} placeholder="Explica paso a paso cómo se ejecuta..." />
        </div>

        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? "Guardando..." : isNew ? "Añadir a la biblioteca" : "Guardar cambios"}
        </button>
      </form>
    </Modal>
  );
}
