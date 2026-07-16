import { FUN_COMPARISONS } from "./config";

// Genera una frase divertida comparando el peso total levantado
// con algo de la vida real.
export function weightComparison(totalKg) {
  if (!totalKg || totalKg <= 0) return null;

  const elefantes = totalKg / FUN_COMPARISONS.elefante;

  if (elefantes >= 1) {
    const cantidad = elefantes.toFixed(elefantes >= 10 ? 0 : 1);
    return `¡Has levantado el equivalente a ${cantidad} elefante${
      elefantes >= 2 ? "s" : ""
    }! 🐘`;
  }

  const porcentaje = Math.round(elefantes * 100);
  return `Llevas levantado un ${porcentaje}% del peso de un elefante. ¡Sigue así! 🐘`;
}

// Genera una frase divertida comparando la distancia recorrida
// (corriendo, andando o en bici) con algo de la vida real.
export function distanceComparison(totalKm) {
  if (!totalKm || totalKm <= 0) return null;

  const vueltasBernabeu = totalKm / FUN_COMPARISONS.bernabeuVuelta;
  const porcentajeMadridMurcia = (totalKm / FUN_COMPARISONS.madridMurcia) * 100;

  if (totalKm >= FUN_COMPARISONS.madridMurcia) {
    const veces = (totalKm / FUN_COMPARISONS.madridMurcia).toFixed(1);
    return `¡Has recorrido la distancia de Madrid a Murcia ${veces} ${
      veces >= 2 ? "veces" : "vez"
    }! 🚴`;
  }

  if (vueltasBernabeu >= 1) {
    return `¡Has recorrido ${vueltasBernabeu.toFixed(
      1
    )} vueltas al Santiago Bernabéu! 🏟️`;
  }

  return `Vas por un ${Math.round(
    porcentajeMadridMurcia
  )}% del camino de Madrid a Murcia. ¡A por ello! 🚴`;
}
