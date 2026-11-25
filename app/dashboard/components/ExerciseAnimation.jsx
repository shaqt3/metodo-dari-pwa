"use client";

import { Dumbbell, PersonStanding, Activity, Zap } from "lucide-react";

// Categorías visuales agrupadas por tipo de movimiento, solo para
// elegir un icono y un color de acento — ya no intenta "actuar" el
// ejercicio (eso nunca terminaba de representarlo bien), simplemente
// se ve limpio y consistente.
const GROUPS = {
  squat: { icon: PersonStanding, color: "#38bdf8" },
  lunge: { icon: PersonStanding, color: "#38bdf8" },
  hinge: { icon: PersonStanding, color: "#38bdf8" },
  press: { icon: Dumbbell, color: "#64748b" },
  pull: { icon: Dumbbell, color: "#64748b" },
  core: { icon: Activity, color: "#0ea5e9" },
  cardio: { icon: Zap, color: "#f59e0b" },
  jump: { icon: Zap, color: "#f59e0b" },
};

export default function ExerciseAnimation({ pattern = "squat" }) {
  const { icon: Icon, color } = GROUPS[pattern] || GROUPS.squat;

  return (
    <div className="exercise-anim">
      <div className="exercise-anim-glow" style={{ background: `${color}22` }} />
      <Icon size={34} color={color} strokeWidth={1.7} />
    </div>
  );
}
