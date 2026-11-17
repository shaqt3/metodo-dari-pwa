// Listas de opciones de la app. Para añadir una opción nueva basta
// con añadir una línea aquí (por ejemplo, un nuevo tipo de dieta).

export const GOALS = [
  { id: "perder_peso", label: "Adelgazar / perder grasa" },
  { id: "ganar_peso", label: "Ganar peso" },
  { id: "volumen", label: "Volumen (ganar músculo)" },
  { id: "definicion", label: "Definición" },
  { id: "mantenimiento", label: "Mantenimiento" },
  { id: "salud", label: "Salud y bienestar" },
  { id: "rendimiento", label: "Rendimiento deportivo" },
];

export const DIET_TYPES = [
  { id: "perder_peso", label: "Adelgazar" },
  { id: "ganar_peso", label: "Ganar peso" },
  { id: "volumen", label: "Volumen" },
  { id: "definicion", label: "Definición" },
  { id: "mantenimiento", label: "Mantenimiento" },
  { id: "sin_gluten", label: "Sin gluten (celíacos)" },
  { id: "sin_lactosa", label: "Sin lactosa" },
  { id: "vegetariana", label: "Vegetariana" },
  { id: "vegana", label: "Vegana" },
  { id: "alta_proteina", label: "Alta en proteína" },
  { id: "cetogenica", label: "Cetogénica" },
  { id: "mediterranea", label: "Mediterránea" },
  { id: "otra", label: "Otra" },
];

// Necesidades de alimentación del socio. "avoid" = alérgeno que
// se vigila automáticamente en sus dietas.
export const DIET_NEEDS = [
  { id: "celiaquia", label: "Celiaquía (sin gluten)", avoid: "gluten" },
  { id: "sin_lactosa", label: "Sin lactosa", avoid: "lactosa" },
  { id: "vegetariana", label: "Vegetariana" },
  { id: "vegana", label: "Vegana" },
  { id: "sin_frutos_secos", label: "Sin frutos secos", avoid: "frutos secos" },
  { id: "sin_marisco", label: "Sin marisco", avoid: "marisco" },
  { id: "sin_pescado", label: "Sin pescado", avoid: "pescado" },
  { id: "sin_huevo", label: "Sin huevo", avoid: "huevo" },
  { id: "diabetes", label: "Controlar azúcar (diabetes)" },
];

export const ALLERGENS = [
  "gluten",
  "lactosa",
  "huevo",
  "pescado",
  "marisco",
  "frutos secos",
  "soja",
  "sésamo",
  "mostaza",
  "apio",
  "sulfitos",
];

export const FOOD_CATEGORIES = [
  "Carnes",
  "Pescados y mariscos",
  "Huevos",
  "Lácteos y bebidas vegetales",
  "Legumbres",
  "Proteína vegetal",
  "Cereales y féculas",
  "Sin gluten",
  "Verduras y hortalizas",
  "Frutas",
  "Frutos secos y semillas",
  "Grasas y aceites",
  "Suplementos",
  "Bebidas",
  "Otros",
];

export const FOOD_UNITS = [
  { id: "g", label: "gramos (g)" },
  { id: "ml", label: "mililitros (ml)" },
  { id: "unidad", label: "unidad" },
  { id: "rebanada", label: "rebanada" },
  { id: "cucharada", label: "cucharada" },
  { id: "ración", label: "ración" },
];

export const MEALS = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena", "Recena"];

export const EXERCISE_CATEGORIES = [
  { id: "funcional", label: "Funcional" },
  { id: "cardio", label: "Cardio" },
  { id: "maquinas", label: "Máquinas y pesas" },
  { id: "estiramiento", label: "Estiramientos / movilidad" },
];

export const LEVELS = [
  { id: "inicial", label: "Inicial" },
  { id: "intermedio", label: "Intermedio" },
  { id: "avanzado", label: "Avanzado" },
];

export const MODALITIES = [
  { id: "presencial", label: "Presencial" },
  { id: "online", label: "Online" },
  { id: "mixta", label: "Mixta" },
];

export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function labelOf(list, id) {
  if (!id) return "";
  const found = list.find((x) => (x.id || x) === id);
  return found ? found.label || found : id;
}

// Unidades que se cuentan (no se pesan)
const COUNT_UNITS = ["unidad", "rebanada", "cucharada", "ración"];

export function foodUnit(food) {
  return food?.base_unit || "g";
}

export function isCountUnit(unit) {
  return COUNT_UNITS.includes(unit);
}

// Nutrientes de una cantidad concreta de un alimento.
// Las kcal y macros del alimento están guardadas para "base_amount"
// (ej. 100 g, 50 g, 1 unidad).
export function nutrientsFor(food, quantity) {
  const base = Number(food?.base_amount) || 100;
  const factor = Number(quantity || 0) / base;
  return {
    kcal: (Number(food?.calories_kcal) || 0) * factor,
    protein: (Number(food?.protein_g) || 0) * factor,
    carbs: (Number(food?.carbs_g) || 0) * factor,
    fat: (Number(food?.fat_g) || 0) * factor,
  };
}

export function formatQty(quantity, unit) {
  const q = Number(quantity);
  if (!unit || unit === "g" || unit === "ml") return `${q} ${unit || "g"}`;
  const PLURALS = { unidad: "unidades", rebanada: "rebanadas", cucharada: "cucharadas", "ración": "raciones" };
  const plural = q === 1 ? unit : PLURALS[unit] || unit;
  return `${q} ${plural}`;
}

// Alérgenos que hay que vigilar para una persona: los que ha
// escrito a mano + los que salen de sus necesidades (ej. celiaquía).
export function avoidListFor(profile) {
  const fromNeeds = (profile?.diet_needs || [])
    .map((n) => DIET_NEEDS.find((d) => d.id === n)?.avoid)
    .filter(Boolean);
  const manual = (profile?.allergies || []).map((a) => a.toLowerCase().trim());
  return [...new Set([...manual, ...fromNeeds])];
}

export function age(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}
