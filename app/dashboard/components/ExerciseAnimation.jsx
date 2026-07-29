"use client";

// Ilustración animada tipo "figura de palo" para mostrar cómo se
// hace un ejercicio, según su patrón de movimiento (squat, press,
// pull, core, cardio). No depende de imágenes ni vídeos.
export default function ExerciseAnimation({ pattern = "squat" }) {
  return (
    <div className={`exercise-anim exercise-anim-${pattern}`}>
      <svg viewBox="0 0 120 120" className="exercise-anim-svg">
        {/* Todo el cuerpo (cabeza incluida) va en el mismo grupo,
            así se mueve como una sola figura y no se "descuelga". */}
        <g className="exercise-anim-body">
          <circle cx="60" cy="26" r="10" fill="#0f172a" />
          <g stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none">
            <line className="exercise-anim-torso" x1="60" y1="36" x2="60" y2="72" />
            <line className="exercise-anim-arm-l" x1="60" y1="44" x2="38" y2="60" />
            <line className="exercise-anim-arm-r" x1="60" y1="44" x2="82" y2="60" />
            <line className="exercise-anim-leg-l" x1="60" y1="72" x2="42" y2="104" />
            <line className="exercise-anim-leg-r" x1="60" y1="72" x2="78" y2="104" />
          </g>
        </g>
      </svg>
    </div>
  );
}
