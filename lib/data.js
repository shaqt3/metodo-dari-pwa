import { supabase } from "@/lib/supabaseClient";
import { TRAINER_EMAILS } from "@/lib/config";

export async function currentEmail() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.email || "";
}

export function displayName(member) {
  if (!member) return "";
  return member.full_name || member.email || "Socio sin nombre";
}

// Lista de socios (todas las fichas menos las de entrenadores).
// Si la ficha nueva aún no existe (script V6 sin ejecutar), usa la
// función antigua "admin-users" para no dejar la app sin usuarios.
export async function fetchMembers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true, nullsFirst: false });

  if (!error && data && data.some((p) => p.email)) {
    return data.filter((p) => !TRAINER_EMAILS.includes(p.email));
  }

  const token = (await supabase.auth.getSession()).data?.session?.access_token;
  const { data: fnData } = await supabase.functions.invoke("admin-users", {
    body: { action: "list" },
    headers: { Authorization: `Bearer ${token}` },
  });
  return (fnData?.users || []).map((u) => ({ id: u.id, email: u.email }));
}

// Elimina la cuenta de un socio (usa la función admin-users).
export async function deleteMemberAccount(userId) {
  const token = (await supabase.auth.getSession()).data?.session?.access_token;
  const { error } = await supabase.functions.invoke("admin-users", {
    body: { action: "delete", userId },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw new Error("No se pudo eliminar la cuenta. Inténtalo de nuevo.");
}

// Copia una rutina (con sus días y ejercicios) y se la asigna a un
// socio. userId = null la deja como plantilla para todos.
export async function copyRoutine(routineId, { userId, title }) {
  const createdBy = await currentEmail();
  const { data: src, error: e1 } = await supabase
    .from("routines")
    .select("*")
    .eq("id", routineId)
    .single();
  if (e1) throw e1;

  const { data: days } = await supabase
    .from("routine_days")
    .select("*, routine_exercises(*)")
    .eq("routine_id", routineId);

  const { data: newRoutine, error: e2 } = await supabase
    .from("routines")
    .insert({
      title: title || src.title,
      notes: src.notes,
      goal: src.goal ?? null,
      level: src.level ?? null,
      user_id: userId,
      created_by: createdBy,
    })
    .select()
    .single();
  if (e2) throw e2;

  for (const d of days || []) {
    const { data: newDay, error: e3 } = await supabase
      .from("routine_days")
      .insert({
        routine_id: newRoutine.id,
        day_number: d.day_number,
        label: d.label,
        notes: d.notes,
        video_url: d.video_url,
      })
      .select()
      .single();
    if (e3) throw e3;

    const exercises = (d.routine_exercises || []).map((x) => ({
      routine_day_id: newDay.id,
      exercise_id: x.exercise_id,
      sets: x.sets,
      reps: x.reps,
      weight_kg: x.weight_kg,
      notes: x.notes,
      order_index: x.order_index,
    }));
    if (exercises.length) {
      const { error: e4 } = await supabase.from("routine_exercises").insert(exercises);
      if (e4) throw e4;
    }
  }
  return newRoutine;
}

// Copia una dieta (con todos sus alimentos) y se la asigna a un socio.
export async function copyDiet(dietId, { userId, title }) {
  const createdBy = await currentEmail();
  const { data: src, error: e1 } = await supabase
    .from("diets")
    .select("*")
    .eq("id", dietId)
    .single();
  if (e1) throw e1;

  const { data: items } = await supabase
    .from("diet_items")
    .select("*")
    .eq("diet_id", dietId);

  const { data: newDiet, error: e2 } = await supabase
    .from("diets")
    .insert({
      title: title || src.title,
      notes: src.notes,
      diet_type: src.diet_type ?? null,
      kcal_target: src.kcal_target ?? null,
      user_id: userId,
      created_by: createdBy,
    })
    .select()
    .single();
  if (e2) throw e2;

  const rows = (items || []).map((i) => ({
    diet_id: newDiet.id,
    day_number: i.day_number || 1,
    meal_label: i.meal_label,
    food_id: i.food_id,
    quantity_g: i.quantity_g,
    order_index: i.order_index,
  }));
  if (rows.length) {
    const { error: e3 } = await supabase.from("diet_items").insert(rows);
    if (e3) throw e3;
  }
  return newDiet;
}

export function friendlyError(err) {
  const msg = err?.message || String(err || "");
  if (/column .* does not exist|schema cache/i.test(msg)) {
    return "Falta actualizar la base de datos: ejecuta el script V6_PANEL_ADMIN.sql en Supabase.";
  }
  if (/row-level security|permission denied/i.test(msg)) {
    return "No tienes permiso para hacer esto.";
  }
  return msg || "Ha ocurrido un error. Inténtalo de nuevo.";
}
