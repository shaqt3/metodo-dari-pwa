"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ExerciseAnimation from "./ExerciseAnimation";

export default function ExerciseLibrary({ isTrainer }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("todos");
  const [showForm, setShowForm] = useState(false);

  const fetchExercises = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("exercise_library")
      .select("*")
      .order("name");
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
            Biblioteca de ejercicios funcionales y de máquinas
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

      {loading && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando...</p>
      )}

      <div className="exercise-grid">
        {filtered.map((ex) => (
          <div key={ex.id} className="exercise-card">
            <ExerciseAnimation pattern={ex.pattern} />
            <h3>{ex.name}</h3>
            <div className="exercise-muscle">{ex.muscle_group}</div>
            {ex.description && (
              <p className="exercise-desc">{ex.description}</p>
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
            <label className="field-label">Tipo de movimiento (para la animación)</label>
            <select
              className="select"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            >
              <option value="squat">Flexión de piernas (sentadilla, prensa...)</option>
              <option value="press">Empuje (press, flexiones...)</option>
              <option value="pull">Tirón (remo, curl, jalón...)</option>
              <option value="core">Mantenimiento (plancha...)</option>
              <option value="cardio">Cardio / salto (burpees, jumping jacks...)</option>
            </select>
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
