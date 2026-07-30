"use client";

import { useEffect, useState } from "react";
import { Plus, X, PersonStanding, Dumbbell, Activity, Zap, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ExerciseAnimation from "./ExerciseAnimation";

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
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const fetchExercises = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("exercise_library")
      .select("*")
      .order("name");
    if (fetchError) {
      setError(fetchError.message);
    }
    setExercises(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const filtered = exercises.filter(
    (e) => category === "todos" || e.category === category
  );

  return (
    <>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Ejercicios</h1>
          <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 2 }}>
            Biblioteca de ejercicios funcionales, cardio y de máquinas
          </p>
        </div>
        {isTrainer && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            Añadir ejercicio
          </button>
        )}
      </div>

      <div className="exercise-filters">
        {[
          { id: "todos", label: "Todos" },
          { id: "funcional", label: "Funcionales" },
          { id: "cardio", label: "Cardio" },
          { id: "maquinas", label: "Máquinas y pesas" },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`filter-chip ${category === c.id ? "active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="exercise-legend">
        {LEGEND.map(({ icon: Icon, color, label }) => (
          <div key={label} className="exercise-legend-item">
            <Icon size={15} color={color} strokeWidth={1.8} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {error && (
        <p className="form-message form-message-error" style={{ marginBottom: 16 }}>
          Error al cargar: {error}
        </p>
      )}

      {loading && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando...</p>
      )}

      <div className="exercise-grid">
        {filtered.map((ex) => (
          <div key={ex.id} className="exercise-card">
            {ex.photo_url ? (
              <img
                src={ex.photo_url}
                alt={ex.name}
                className="exercise-photo"
              />
            ) : (
              <ExerciseAnimation pattern={ex.pattern} />
            )}
            <h3>{ex.name}</h3>
            <div className="exercise-muscle">{ex.muscle_group}</div>

            {ex.video_url && (
              <a
                href={ex.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="exercise-video-link"
              >
                <PlayCircle size={14} />
                Ver vídeo de referencia
              </a>
            )}

            {ex.description ? (
              <div className="exercise-desc">
                <span className="exercise-desc-label">Cómo se hace</span>
                <p>{ex.description}</p>
              </div>
            ) : (
              <div className="exercise-desc exercise-desc-empty">
                Todavía no tiene explicación escrita.
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <NewExerciseModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            fetchExercises();
          }}
        />
      )}
    </>
  );
}

function NewExerciseModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("funcional");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [pattern, setPattern] = useState("squat");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase
      .from("exercise_library")
      .insert({
        name,
        category,
        muscle_group: muscleGroup,
        pattern,
        description,
        video_url: videoUrl || null,
        photo_url: photoUrl || null,
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
          <h2>Nuevo ejercicio</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label">Nombre</label>
            <input
              required
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Peso muerto"
            />
          </div>

          <div className="form-group">
            <label className="field-label">Categoría</label>
            <select
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="funcional">Funcional</option>
              <option value="cardio">Cardio</option>
              <option value="maquinas">Máquinas y pesas</option>
            </select>
          </div>

          <div className="form-group">
            <label className="field-label">Grupo muscular</label>
            <input
              className="input"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              placeholder="Ej: Piernas, Espalda..."
            />
          </div>

          <div className="form-group">
            <label className="field-label">Tipo de movimiento (para el icono)</label>
            <select
              className="select"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            >
              <option value="squat">Piernas: flexión (sentadilla, prensa...)</option>
              <option value="lunge">Piernas: zancada (piernas alternas)</option>
              <option value="hinge">Cadera: bisagra (peso muerto, swing...)</option>
              <option value="press">Brazos: empuje (press, flexiones...)</option>
              <option value="pull">Brazos: tirón (remo, curl, jalón...)</option>
              <option value="core">Core / mantenimiento (plancha...)</option>
              <option value="cardio">Cardio (burpees, escaladores, correr...)</option>
              <option value="jump">Cardio: salto (jumping jacks, box jump...)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="field-label">Foto de referencia (URL, opcional)</label>
            <input
              className="input"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label className="field-label">Vídeo de referencia (URL, opcional)</label>
            <input
              className="input"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="form-group">
            <label className="field-label">Descripción</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cómo se ejecuta el ejercicio..."
            />
          </div>

          {error && <p className="form-message form-message-error">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-block"
          >
            {saving ? "Guardando..." : "Añadir a la biblioteca"}
          </button>
        </form>
      </div>
    </div>
  );
}
