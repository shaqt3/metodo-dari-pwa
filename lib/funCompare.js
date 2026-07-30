import { WEIGHT_COMPARISONS, DISTANCE_COMPARISONS } from "./config";

// Genera una frase divertida comparando el peso total levantado
// con algo de la vida real (coche, elefante, camión, ballena azul...).
// Elige la comparación más grande que ya se haya superado.
export function weightComparison(totalKg) {
  if (!totalKg || totalKg <= 0) return null;

  const sorted = [...WEIGHT_COMPARISONS].sort((a, b) => b.kg - a.kg);
  const reached = sorted.find((c) => totalKg / c.kg >= 1);

  if (reached) {
    const veces = (totalKg / reached.kg).toFixed(
      totalKg / reached.kg >= 10 ? 0 : 1
    );
    return `¡Has levantado el equivalente a ${veces} ${reached.label}${
      Number(veces) >= 2 ? "s" : ""
    }! ${reached.emoji}`;
  }

  // Si no ha llegado ni al más pequeño, mostramos el porcentaje hacia él
  const smallest = [...WEIGHT_COMPARISONS].sort((a, b) => a.kg - b.kg)[0];
  const porcentaje = Math.round((totalKg / smallest.kg) * 100);
  return `Llevas un ${porcentaje}% del peso de un ${smallest.label}. ¡Sigue así! ${smallest.emoji}`;
}

// Genera una frase divertida comparando la distancia recorrida
// (corriendo, andando o en bici) con algo de la vida real.
export function distanceComparison(totalKm) {
  if (!totalKm || totalKm <= 0) return null;

  const sorted = [...DISTANCE_COMPARISONS].sort((a, b) => b.km - a.km);
  const reached = sorted.find((c) => totalKm / c.km >= 1);

  if (reached) {
    const veces = (totalKm / reached.km).toFixed(
      totalKm / reached.km >= 10 ? 0 : 1
    );
    return `¡Has recorrido ${veces} ${reached.label}${
      Number(veces) >= 2 ? "s" : ""
    }! ${reached.emoji}`;
  }

  const smallest = [...DISTANCE_COMPARISONS].sort((a, b) => a.km - b.km)[0];
  const porcentaje = Math.round((totalKm / smallest.km) * 100);
  return `Vas por un ${porcentaje}% de una ${smallest.label}. ¡A por ello! ${smallest.emoji}`;
}
