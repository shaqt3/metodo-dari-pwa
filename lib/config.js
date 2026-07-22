// Emails de las personas con permisos de entrenador/a (superadmin).
// Ven la pestaña "Usuarios" y pueden crear rutinas, retos y dietas.
export const TRAINER_EMAILS = [
  "darinelarias22@gmail.com",
  "angeddgg@gmail.com",
];

// Zonas/equipamiento disponibles en el gimnasio de referencia
// (Basic-Fit Valladolid C.C. Carrefour II), usadas como opciones
// al crear una rutina.
export const GYM_ZONES = [
  "Zona de fuerza (máquinas)",
  "Zona de pesas (mancuernas, barras, discos)",
  "Zona de cardio (cinta, elíptica, bici)",
  "Zona funcional (rack, kettlebells, bolas de slam, cajas de plyo)",
  "Zona de estiramiento",
  "Ciclismo virtual",
  "Entrenamiento en casa",
];

// Comparaciones "curiosas" usadas en Progreso, de menor a mayor peso/distancia.
export const WEIGHT_COMPARISONS = [
  { label: "coche", kg: 1200, emoji: "🚗" },
  { label: "elefante", kg: 5400, emoji: "🐘" },
  { label: "camión", kg: 10000, emoji: "🚚" },
  { label: "ballena azul", kg: 100000, emoji: "🐋" },
];

export const DISTANCE_COMPARISONS = [
  { label: "vuelta al Santiago Bernabéu", km: 1, emoji: "🏟️" },
  // Distancia aproximada por carretera Valladolid - Murcia
  { label: "trayecto de Valladolid a Murcia", km: 640, emoji: "🚴" },
];
