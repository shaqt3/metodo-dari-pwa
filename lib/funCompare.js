import { WEIGHT_COMPARISONS, DISTANCE_COMPARISONS } from "./config";

function formatCount(n) {
  return n.toFixed(n >= 10 ? 0 : 1);
}

// Genera una frase divertida comparando el peso total levantado
// con algo de la vida real (coche, elefante, camión, ballena azul...).
export function weightComparison(totalKg) {
  if (!totalKg || totalKg <= 0) return null;

  const sorted = [...WEIGHT_COMPARISONS].sort((a, b) => b.kg - a.kg);
  const reached = sorted.find((c) => totalKg / c.kg >= 1);

  if (reached) {
    const veces = totalKg / reached.kg;
    const label = veces >= 2 ? reached.plural : reached.singular;
    return `¡Has levantado el equivalente a ${formatCount(veces)} ${label}! ${reached.emoji}`;
  }

  const smallest = [...WEIGHT_COMPARISONS].sort((a, b) => a.kg - b.kg)[0];
  const porcentaje = Math.round((totalKg / smallest.kg) * 100);
  return `Llevas un ${porcentaje}% del peso de un ${smallest.singular}. ¡Sigue así! ${smallest.emoji}`;
}

// Genera una frase divertida comparando la distancia recorrida
// (corriendo, andando o en bici) con algo de la vida real.
export function distanceComparison(totalKm) {
  if (!totalKm || totalKm <= 0) return null;

  const sorted = [...DISTANCE_COMPARISONS].sort((a, b) => b.km - a.km);
  const reached = sorted.find((c) => totalKm / c.km >= 1);

  if (reached) {
    const veces = totalKm / reached.km;
    const label = veces >= 2 ? reached.plural : reached.singular;
    return `¡Has recorrido ${formatCount(veces)} ${label}! ${reached.emoji}`;
  }

  const smallest = [...DISTANCE_COMPARISONS].sort((a, b) => a.km - b.km)[0];
  const porcentaje = Math.round((totalKm / smallest.km) * 100);
  return `Vas por un ${porcentaje}% de un ${smallest.singular}. ¡A por ello! ${smallest.emoji}`;
}
