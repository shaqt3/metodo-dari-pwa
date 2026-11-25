"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Utensils, Copy, Pencil, Trash2, AlertTriangle, ShoppingCart, Printer } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  DIET_TYPES,
  FOOD_CATEGORIES,
  FOOD_UNITS,
  ALLERGENS,
  MEALS,
  labelOf,
  nutrientsFor,
  formatQty,
  foodUnit,
  avoidListFor,
} from "@/lib/options";
import { currentEmail, fetchMembers, displayName, copyDiet, friendlyError } from "@/lib/data";
import {
  Modal,
  EditDeleteButtons,
  confirmDelete,
  ChipFilter,
  CheckboxGroup,
  ErrorMsg,
  Loading,
  MediaInput,
  MediaView,
} from "./ui";
import { DietPrint, ShoppingList } from "./Printable";

const DIET_DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const r0 = (n) => Math.round(n || 0);

export default function Nutrition({ userId, isTrainer }) {
  const [subTab, setSubTab] = useState("dietas");

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>Alimentación</h1>
          <p>Dietas y biblioteca de alimentos</p>
        </div>
      </div>

      <div className="subnav">
        <button className={subTab === "dietas" ? "active" : ""} onClick={() => setSubTab("dietas")}>
          Dietas
        </button>
        <button className={subTab === "alimentos" ? "active" : ""} onClick={() => setSubTab("alimentos")}>
          Biblioteca de alimentos
        </button>
      </div>

      {subTab === "dietas" && <DietsPage userId={userId} isTrainer={isTrainer} />}
      {subTab === "alimentos" && <FoodsPage isTrainer={isTrainer} />}
    </>
  );
}

/* ============================================================
   DIETAS
============================================================ */
function DietsPage({ userId, isTrainer }) {
  const [diets, setDiets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [typeFilter, setTypeFilter] = useState("todas");
  const [ownerFilter, setOwnerFilter] = useState("todas");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const fetchDiets = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("diets")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    setDiets(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDiets();
    if (userId) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data }) => setMyProfile(data));
    }
    if (isTrainer) fetchMembers().then(setMembers).catch(() => {});
  }, [userId, isTrainer]);

  const typesPresent = [...new Set(diets.map((d) => d.diet_type).filter(Boolean))];
  const typeOptions = [
    { id: "todas", label: "Todas" },
    ...DIET_TYPES.filter((t) => typesPresent.includes(t.id)),
  ];

  const visible = diets.filter((d) => {
    // Un socio solo ve sus dietas y las plantillas generales
    if (!isTrainer && d.user_id !== null && d.user_id !== userId) return false;
    if (typeFilter !== "todas" && d.diet_type !== typeFilter) return false;
    if (ownerFilter === "plantillas" && d.user_id !== null) return false;
    if (ownerFilter === "socios" && d.user_id === null) return false;
    if (!["todas", "plantillas", "socios"].includes(ownerFilter) && d.user_id !== ownerFilter) return false;
    return true;
  });

  const mine = isTrainer ? [] : visible.filter((d) => d.user_id === userId);
  const general = isTrainer ? visible : visible.filter((d) => d.user_id !== userId);

  const handleDelete = async (d) => {
    if (!confirmDelete(`la dieta "${d.title}"`)) return;
    const { error: delErr } = await supabase.from("diets").delete().eq("id", d.id);
    if (delErr) setError(friendlyError(delErr));
    fetchDiets();
  };

  const profileFor = (diet) =>
    isTrainer ? members.find((m) => m.id === diet.user_id) || null : myProfile;

  const renderCard = (d) => (
    <DietCard
      key={d.id}
      diet={d}
      profile={profileFor(d)}
      isTrainer={isTrainer}
      members={members}
      onEdit={() => setEditing(d)}
      onDelete={() => handleDelete(d)}
      onChanged={fetchDiets}
    />
  );

  return (
    <>
      <div className="section-header">
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>
          {isTrainer
            ? "Las plantillas sirven de base: asígnalas a un socio y ajústalas."
            : "Toca una dieta para ver el menú de cada día."}
        </p>
        {isTrainer && (
          <button onClick={() => setEditing({})} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Crear dieta
          </button>
        )}
      </div>

      {typeOptions.length > 2 && <ChipFilter options={typeOptions} value={typeFilter} onChange={setTypeFilter} />}

      {isTrainer && (
        <div className="form-group" style={{ maxWidth: 360 }}>
          <select className="select" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="todas">Todas las dietas</option>
            <option value="plantillas">Solo plantillas</option>
            <option value="socios">Solo dietas de socios</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>De {displayName(m)}</option>
            ))}
          </select>
        </div>
      )}

      <ErrorMsg>{error && `Error: ${error}`}</ErrorMsg>
      {loading && <Loading />}

      {!loading && visible.length === 0 && (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Utensils size={22} color="#38bdf8" />
            </div>
            <h3>No hay dietas aquí</h3>
            <p>{isTrainer ? 'Pulsa "Crear dieta" para añadir una.' : "Tu entrenadora todavía no te ha asignado una dieta."}</p>
          </div>
        </div>
      )}

      {mine.length > 0 && (
        <>
          <h2 className="list-title">Mis dietas</h2>
          {mine.map(renderCard)}
          {general.length > 0 && <h2 className="list-title">Otras dietas de ejemplo</h2>}
        </>
      )}
      {general.map(renderCard)}

      {editing && (
        <DietModal
          initial={editing}
          members={members}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchDiets();
          }}
        />
      )}
    </>
  );
}

function DietCard({ diet, profile, isTrainer, members, onEdit, onDelete, onChanged }) {
  const [items, setItems] = useState(null);
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  });
  const [itemModal, setItemModal] = useState(null);
  const [showCopy, setShowCopy] = useState(false);
  const [showCopyDay, setShowCopyDay] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showShopping, setShowShopping] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("diet_items")
      .select("*, foods(*)")
      .eq("diet_id", diet.id)
      .order("order_index");
    setItems(data || []);
  };

  const handleToggle = (e) => {
    if (e.target.open && items === null) fetchItems();
  };

  const list = items || [];
  const dayItems = list.filter((i) => (i.day_number || 1) === selectedDay);
  const daysWithContent = new Set(list.map((i) => i.day_number || 1));
  const meals = [...MEALS, ...new Set(dayItems.map((i) => i.meal_label))].filter(
    (m, idx, arr) => arr.indexOf(m) === idx && dayItems.some((i) => i.meal_label === m)
  );

  const totals = dayItems.reduce(
    (acc, i) => {
      const n = nutrientsFor(i.foods, i.quantity_g);
      return { kcal: acc.kcal + n.kcal, protein: acc.protein + n.protein, carbs: acc.carbs + n.carbs, fat: acc.fat + n.fat };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const avoid = avoidListFor(profile);
  if (diet.diet_type === "sin_gluten" && !avoid.includes("gluten")) avoid.push("gluten");
  if (diet.diet_type === "sin_lactosa" && !avoid.includes("lactosa")) avoid.push("lactosa");
  const conflicts = (food) => (food?.allergens || []).filter((a) => avoid.includes(a));
  const conflictFoods = dayItems.filter((i) => conflicts(i.foods).length > 0);

  const owner =
    diet.user_id === null
      ? "Plantilla"
      : isTrainer
      ? displayName(members.find((m) => m.id === diet.user_id)) || "Socio"
      : "Mi dieta";

  const removeItem = async (i) => {
    if (!confirmDelete(`"${i.foods?.name}" de esta comida`)) return;
    await supabase.from("diet_items").delete().eq("id", i.id);
    fetchItems();
  };

  return (
    <details className="accordion-item" onToggle={handleToggle}>
      <summary className="accordion-summary">
        <span>{diet.title}</span>
        <span className="summary-badges">
          {diet.diet_type && <span className="badge badge-soft">{labelOf(DIET_TYPES, diet.diet_type)}</span>}
          <span className="badge">{owner}</span>
        </span>
      </summary>
      <div className="accordion-body">
        {isTrainer && (
          <div className="toolbar">
            <button className="btn btn-outline btn-sm" onClick={onEdit}>
              <Pencil size={14} /> Editar
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowCopy(true)}>
              <Copy size={14} /> Copiar / asignar
            </button>
            <button className="btn btn-danger-outline btn-sm" onClick={onDelete}>
              <Trash2 size={14} /> Borrar
            </button>
          </div>
        )}

        {items !== null && list.length > 0 && (
          <div className="toolbar">
            <button className="btn btn-outline btn-sm" onClick={() => setShowShopping(true)}>
              <ShoppingCart size={14} /> Lista de la compra
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowPrint(true)}>
              <Printer size={14} /> PDF / WhatsApp
            </button>
          </div>
        )}
        {diet.notes && <p style={{ fontSize: 13, color: "var(--dark-70)", marginBottom: 14 }}>{diet.notes}</p>}
        {diet.attachment_url && (
          <div className="attachment-box">
            <MediaView url={diet.attachment_url} title={diet.title} />
          </div>
        )}

        <div className="week-calendar" style={{ marginBottom: 16 }}>
          {DIET_DAY_NAMES.map((name, i) => {
            const dayNum = i + 1;
            return (
              <div
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`day-cell ${daysWithContent.has(dayNum) ? "has-content" : ""} ${selectedDay === dayNum ? "selected" : ""}`}
              >
                <div className="day-name">{name}</div>
                {daysWithContent.has(dayNum) && <div className="day-dot" />}
              </div>
            );
          })}
        </div>

        {dayItems.length > 0 && (
          <div className="macro-bar">
            <div>
              <strong>{r0(totals.kcal)}</strong>
              <span>kcal{diet.kcal_target ? ` / ${r0(diet.kcal_target)}` : ""}</span>
            </div>
            <div>
              <strong>{r0(totals.protein)} g</strong>
              <span>proteína</span>
            </div>
            <div>
              <strong>{r0(totals.carbs)} g</strong>
              <span>hidratos</span>
            </div>
            <div>
              <strong>{r0(totals.fat)} g</strong>
              <span>grasas</span>
            </div>
          </div>
        )}

        {conflictFoods.length > 0 && (
          <div className="allergy-warning">
            <AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Este día tiene alimentos con{" "}
            {[...new Set(conflictFoods.flatMap((i) => conflicts(i.foods)))].join(", ")}
            {isTrainer ? ", que esta persona/dieta debe evitar." : ", que según tu ficha debes evitar."}
          </div>
        )}

        {items === null && <Loading />}
        {items !== null && dayItems.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Sin alimentos asignados este día.</p>
        )}

        {meals.map((meal) => (
          <div key={meal} className="diet-meal-group">
            <div className="diet-meal-title">{meal}</div>
            {dayItems
              .filter((i) => i.meal_label === meal)
              .map((i) => (
                <div key={i.id} className={`diet-food-row ${conflicts(i.foods).length ? "row-warn" : ""}`}>
                  <span>
                    {i.foods?.name} · <strong>{formatQty(i.quantity_g, foodUnit(i.foods))}</strong>
                    {(i.foods?.allergens || []).map((a) => (
                      <span key={a} className="allergen-tag">{a}</span>
                    ))}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {r0(nutrientsFor(i.foods, i.quantity_g).kcal)} kcal
                    {isTrainer && (
                      <EditDeleteButtons onEdit={() => setItemModal(i)} onDelete={() => removeItem(i)} />
                    )}
                  </span>
                </div>
              ))}
          </div>
        ))}

        {isTrainer && (
          <div className="toolbar" style={{ marginTop: 12 }}>
            <button onClick={() => setItemModal({})} className="btn btn-primary btn-sm">
              <Plus size={14} /> Añadir alimento al {DIET_DAY_NAMES[selectedDay - 1]}
            </button>
            {dayItems.length > 0 && (
              <button onClick={() => setShowCopyDay(true)} className="btn btn-outline btn-sm">
                <Copy size={14} /> Copiar este día a otros
              </button>
            )}
          </div>
        )}

        {itemModal && (
          <DietItemModal
            dietId={diet.id}
            dayNumber={selectedDay}
            initial={itemModal}
            avoid={avoid}
            onClose={() => setItemModal(null)}
            onSaved={() => {
              setItemModal(null);
              fetchItems();
            }}
          />
        )}
        {showCopy && (
          <CopyModal
            item={diet}
            kind="dieta"
            members={members}
            onCopy={(opts) => copyDiet(diet.id, opts)}
            onClose={() => setShowCopy(false)}
            onDone={() => {
              setShowCopy(false);
              onChanged();
            }}
          />
        )}
        {showPrint && <DietPrint diet={diet} items={list} onClose={() => setShowPrint(false)} />}
        {showShopping && <ShoppingList diet={diet} items={list} onClose={() => setShowShopping(false)} />}
        {showCopyDay && (
          <CopyDayModal
            dietId={diet.id}
            fromDay={selectedDay}
            dayItems={dayItems}
            onClose={() => setShowCopyDay(false)}
            onDone={() => {
              setShowCopyDay(false);
              fetchItems();
            }}
          />
        )}
      </div>
    </details>
  );
}

function CopyDayModal({ dietId, fromDay, dayItems, onClose, onDone }) {
  const [days, setDays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const options = DIET_DAY_NAMES.map((n, i) => ({ id: i + 1, label: n })).filter((d) => d.id !== fromDay);

  const handle = async () => {
    if (!days.length) return;
    setSaving(true);
    // Sustituye lo que hubiera en esos días
    const { error: delErr } = await supabase.from("diet_items").delete().eq("diet_id", dietId).in("day_number", days);
    if (delErr) {
      setError(friendlyError(delErr));
      setSaving(false);
      return;
    }
    const rows = days.flatMap((d) =>
      dayItems.map((i) => ({
        diet_id: dietId,
        day_number: d,
        meal_label: i.meal_label,
        food_id: i.food_id,
        quantity_g: i.quantity_g,
        order_index: i.order_index,
      }))
    );
    const { error: insErr } = await supabase.from("diet_items").insert(rows);
    setSaving(false);
    if (insErr) {
      setError(friendlyError(insErr));
      return;
    }
    onDone();
  };

  return (
    <Modal title={`Copiar el ${DIET_DAY_NAMES[fromDay - 1]} a...`} onClose={onClose}>
      <p style={{ fontSize: 13, color: "var(--dark-60)", marginBottom: 12 }}>
        Lo que hubiera en los días elegidos se sustituirá por este menú.
      </p>
      <CheckboxGroup options={options} values={days} onChange={setDays} />
      <ErrorMsg>{error}</ErrorMsg>
      <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={saving || !days.length} onClick={handle}>
        {saving ? "Copiando..." : "Copiar"}
      </button>
    </Modal>
  );
}

// Copiar una dieta o rutina: como plantilla o para un socio
export function CopyModal({ item, kind, members, onCopy, onClose, onDone }) {
  const [target, setTarget] = useState(members[0]?.id || "template");
  const [title, setTitle] = useState(item.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const m = members.find((x) => x.id === target);
    const base = item.title.replace(/^(Plantilla|Dieta ejemplo|Plan ejemplo)\s*-\s*/i, "").replace(/ · .*$/, "");
    setTitle(m ? `${base} · ${displayName(m).split(" ")[0]}` : `${base} (copia)`);
  }, [target]);

  const handle = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onCopy({ userId: target === "template" ? null : target, title });
      onDone();
    } catch (err) {
      setError(friendlyError(err));
      setSaving(false);
    }
  };

  return (
    <Modal title={`Copiar ${kind}`} onClose={onClose}>
      <form onSubmit={handle}>
        <p style={{ fontSize: 13, color: "var(--dark-60)", marginBottom: 14 }}>
          Se crea una copia independiente: los cambios que hagas en ella no afectan a la original.
        </p>
        <div className="form-group">
          <label className="field-label">Para quién</label>
          <select className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{displayName(m)}</option>
            ))}
            <option value="template">Como nueva plantilla (para todos)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="field-label">Nombre</label>
          <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
          {saving ? "Copiando..." : "Crear copia"}
        </button>
      </form>
    </Modal>
  );
}

export function DietModal({ initial, members, defaultUserId, onClose, onSaved }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    title: initial?.title || "",
    notes: initial?.notes || "",
    diet_type: initial?.diet_type || "",
    kcal_target: initial?.kcal_target ?? "",
    attachment_url: initial?.attachment_url || "",
    target: initial?.id ? initial.user_id || "template" : defaultUserId || "template",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      notes: form.notes || null,
      diet_type: form.diet_type || null,
      kcal_target: form.kcal_target === "" ? null : Number(form.kcal_target),
      user_id: form.target === "template" ? null : form.target,
    };
    if (form.attachment_url) payload.attachment_url = form.attachment_url;
    else if (initial?.attachment_url) payload.attachment_url = null;
    const { error: saveErr } = isNew
      ? await supabase.from("diets").insert({ ...payload, created_by: await currentEmail() })
      : await supabase.from("diets").update(payload).eq("id", initial.id);
    setSaving(false);
    if (saveErr) {
      setError(friendlyError(saveErr));
      return;
    }
    onSaved();
  };

  return (
    <Modal title={isNew ? "Nueva dieta" : "Editar dieta"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="field-label">Nombre *</label>
          <input required className="input" value={form.title} onChange={set("title")} placeholder="Ej: Definición - Laura" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="field-label">Tipo de dieta</label>
            <select className="select" value={form.diet_type} onChange={set("diet_type")}>
              <option value="">— Elige —</option>
              {DIET_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="field-label">Kcal objetivo al día</label>
            <input type="number" min="0" className="input" value={form.kcal_target} onChange={set("kcal_target")} placeholder="2000" />
          </div>
        </div>
        <div className="form-group">
          <label className="field-label">Indicaciones</label>
          <textarea className="textarea" value={form.notes} onChange={set("notes")} placeholder="Ej: beber 2 litros de agua, cocinar a la plancha..." />
        </div>
        <MediaInput
          label="Foto o PDF adjunto (opcional: recetas, lista de la compra...)"
          value={form.attachment_url}
          onChange={(v) => setForm((f) => ({ ...f, attachment_url: v }))}
          kind="doc"
          folder="dietas"
        />
        <div className="form-group">
          <label className="field-label">Para quién</label>
          <select className="select" value={form.target} onChange={set("target")}>
            <option value="template">Plantilla (la ven todos, sirve de base)</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{displayName(m)}</option>
            ))}
          </select>
        </div>
        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? "Guardando..." : isNew ? "Crear dieta" : "Guardar cambios"}
        </button>
        {isNew && (
          <p style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 10 }}>
            Después ábrela y añade los alimentos de cada día.
          </p>
        )}
      </form>
    </Modal>
  );
}

function DietItemModal({ dietId, dayNumber, initial, avoid, onClose, onSaved }) {
  const isNew = !initial?.id;
  const [foods, setFoods] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [mealLabel, setMealLabel] = useState(initial?.meal_label || "Desayuno");
  const [foodId, setFoodId] = useState(initial?.food_id || "");
  const [quantity, setQuantity] = useState(initial?.quantity_g ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("foods")
      .select("*")
      .order("name")
      .then(({ data }) => setFoods(data || []));
  }, []);

  const food = foods.find((f) => f.id === foodId);
  const unit = foodUnit(food);

  // Al elegir un alimento nuevo, propone su cantidad de referencia
  const chooseFood = (id) => {
    setFoodId(id);
    const f = foods.find((x) => x.id === id);
    if (f && (isNew || !quantity)) setQuantity(f.base_amount || 100);
  };

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      foods.filter(
        (f) =>
          (!category || f.category === category) &&
          (!q || f.name.toLowerCase().includes(q))
      ),
    [foods, q, category]
  );

  const preview = food ? nutrientsFor(food, quantity) : null;
  const clash = (food?.allergens || []).filter((a) => avoid.includes(a));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!foodId) {
      setError("Elige un alimento de la lista.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      diet_id: dietId,
      day_number: dayNumber || 1,
      meal_label: mealLabel,
      food_id: foodId,
      quantity_g: Number(quantity) || 0,
    };
    const { error: saveErr } = isNew
      ? await supabase.from("diet_items").insert({ ...payload, order_index: MEALS.indexOf(mealLabel) * 10 + 1 })
      : await supabase.from("diet_items").update(payload).eq("id", initial.id);
    setSaving(false);
    if (saveErr) {
      setError(friendlyError(saveErr));
      return;
    }
    onSaved();
  };

  return (
    <Modal title={`${isNew ? "Añadir" : "Cambiar"} alimento — ${DIET_DAY_NAMES[(dayNumber || 1) - 1]}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="field-label">Comida</label>
          <select className="select" value={mealLabel} onChange={(e) => setMealLabel(e.target.value)}>
            {MEALS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="field-label">Alimento</label>
          <div className="media-input-row" style={{ marginBottom: 8 }}>
            <input className="input" placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="select" style={{ maxWidth: 170 }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Todas</option>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <select
            className="select food-picker"
            size={6}
            value={foodId}
            onChange={(e) => chooseFood(e.target.value)}
          >
            {filtered.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
                {(f.allergens || []).some((a) => avoid.includes(a)) ? "  ⚠️" : ""}
              </option>
            ))}
          </select>
          {filtered.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 6 }}>
              No está en la lista: añádelo antes en "Biblioteca de alimentos".
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="field-label">Cantidad ({FOOD_UNITS.find((u) => u.id === unit)?.label || unit})</label>
          <input type="number" min="0" step="any" className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          {preview && (
            <p style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 6 }}>
              = {r0(preview.kcal)} kcal · P {r0(preview.protein)} g · H {r0(preview.carbs)} g · G {r0(preview.fat)} g
            </p>
          )}
        </div>

        {clash.length > 0 && (
          <div className="allergy-warning">
            <AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Contiene {clash.join(", ")}, que esta dieta o persona debe evitar.
          </div>
        )}

        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? "Guardando..." : isNew ? "Añadir" : "Guardar"}
        </button>
      </form>
    </Modal>
  );
}

/* ============================================================
   BIBLIOTECA DE ALIMENTOS
============================================================ */
function FoodsPage({ isTrainer }) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [glutenFree, setGlutenFree] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const fetchFoods = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase.from("foods").select("*").order("name");
    if (fetchError) setError(fetchError.message);
    setFoods(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleDelete = async (f) => {
    if (!confirmDelete(`"${f.name}" (también se quitará de las dietas que lo usen)`)) return;
    const { error: delErr } = await supabase.from("foods").delete().eq("id", f.id);
    if (delErr) setError(friendlyError(delErr));
    fetchFoods();
  };

  const q = query.trim().toLowerCase();
  const filtered = foods.filter(
    (f) =>
      (!category || f.category === category) &&
      (!glutenFree || !(f.allergens || []).includes("gluten")) &&
      (!q || f.name.toLowerCase().includes(q))
  );

  return (
    <>
      <div className="section-header">
        <div className="search-input-wrap" style={{ marginBottom: 0, flex: 1 }}>
          <input className="input" placeholder="Buscar alimento..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {isTrainer && (
          <button onClick={() => setEditing({})} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Añadir alimento
          </button>
        )}
      </div>

      <div className="toolbar" style={{ maxWidth: 900, marginBottom: 16 }}>
        <select className="select" style={{ maxWidth: 260 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {FOOD_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button type="button" className={`filter-chip ${glutenFree ? "active" : ""}`} onClick={() => setGlutenFree(!glutenFree)}>
          Solo sin gluten (celíacos)
        </button>
        <span style={{ fontSize: 12, color: "var(--dark-60)" }}>{filtered.length} alimentos</span>
      </div>

      <ErrorMsg>{error && `Error: ${error}`}</ErrorMsg>
      {loading && <Loading />}

      {filtered.map((f) => (
        <details key={f.id} className="accordion-item">
          <summary className="accordion-summary">
            <div>
              <div>{f.name}</div>
              <div className="food-macros-line">
                {f.calories_kcal} kcal · P {f.protein_g}g · H {f.carbs_g}g · G {f.fat_g}g
                {f.base_amount ? ` (por ${formatQty(f.base_amount, f.base_unit)})` : ""}
              </div>
            </div>
            {!(f.allergens || []).includes("gluten") && <span className="badge badge-soft">Sin gluten</span>}
          </summary>
          <div className="accordion-body">
            {f.category && <p style={{ fontSize: 13, marginBottom: 8 }}>Categoría: <strong>{f.category}</strong></p>}
            <div className="diet-food-row"><span>Proteína</span><span>{f.protein_g} g</span></div>
            <div className="diet-food-row"><span>Hidratos de carbono</span><span>{f.carbs_g} g</span></div>
            <div className="diet-food-row"><span>Grasas</span><span>{f.fat_g} g</span></div>
            {f.allergens?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                Contiene:{" "}
                {f.allergens.map((a) => (
                  <span key={a} className="allergen-tag">{a}</span>
                ))}
              </div>
            )}
            {f.notes && <p style={{ fontSize: 13, marginTop: 8 }}>{f.notes}</p>}
            {isTrainer && (
              <div className="toolbar" style={{ marginTop: 12 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(f)}>
                  <Pencil size={14} /> Editar
                </button>
                <button className="btn btn-danger-outline btn-sm" onClick={() => handleDelete(f)}>
                  <Trash2 size={14} /> Borrar
                </button>
              </div>
            )}
          </div>
        </details>
      ))}

      {editing && (
        <FoodModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchFoods();
          }}
        />
      )}
    </>
  );
}

function FoodModal({ initial, onClose, onSaved }) {
  const isNew = !initial?.id;
  const knownAllergens = (initial?.allergens || []).filter((a) => ALLERGENS.includes(a));
  const otherAllergens = (initial?.allergens || []).filter((a) => !ALLERGENS.includes(a));
  const [form, setForm] = useState({
    name: initial?.name || "",
    category: initial?.category || "",
    base_amount: initial?.base_amount ?? 100,
    base_unit: initial?.base_unit || "g",
    calories_kcal: initial?.calories_kcal ?? "",
    protein_g: initial?.protein_g ?? "",
    carbs_g: initial?.carbs_g ?? "",
    fat_g: initial?.fat_g ?? "",
    allergens: knownAllergens,
    other: otherAllergens.join(", "),
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const extra = form.other.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean);
    const payload = {
      name: form.name,
      category: form.category || null,
      base_amount: Number(form.base_amount) || 100,
      base_unit: form.base_unit,
      calories_kcal: Number(form.calories_kcal) || 0,
      protein_g: Number(form.protein_g) || 0,
      carbs_g: Number(form.carbs_g) || 0,
      fat_g: Number(form.fat_g) || 0,
      allergens: [...new Set([...form.allergens, ...extra])],
      notes: form.notes || null,
    };
    const { error: saveErr } = isNew
      ? await supabase.from("foods").insert(payload)
      : await supabase.from("foods").update(payload).eq("id", initial.id);
    setSaving(false);
    if (saveErr) {
      setError(/duplicate|unique/i.test(saveErr.message) ? "Ya existe un alimento con ese nombre." : friendlyError(saveErr));
      return;
    }
    onSaved();
  };

  return (
    <Modal title={isNew ? "Nuevo alimento" : "Editar alimento"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="field-label">Nombre *</label>
          <input required className="input" value={form.name} onChange={set("name")} placeholder="Ej: Pechuga de pavo" />
        </div>
        <div className="form-group">
          <label className="field-label">Categoría</label>
          <select className="select" value={form.category} onChange={set("category")}>
            <option value="">— Elige —</option>
            {FOOD_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <label className="field-label">Los valores de abajo son por:</label>
        <div className="form-row">
          <div className="form-group">
            <input type="number" min="0" step="any" className="input" value={form.base_amount} onChange={set("base_amount")} />
          </div>
          <div className="form-group">
            <select className="select" value={form.base_unit} onChange={set("base_unit")}>
              {FOOD_UNITS.map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--dark-60)", marginTop: -8, marginBottom: 14 }}>
          Lo normal es "100 gramos" (como en la etiqueta). Para cosas que se cuentan, usa "1 unidad".
        </p>

        <div className="form-row form-row-4">
          <div className="form-group">
            <label className="field-label">Kcal *</label>
            <input required type="number" step="any" className="input" value={form.calories_kcal} onChange={set("calories_kcal")} />
          </div>
          <div className="form-group">
            <label className="field-label">Proteína</label>
            <input type="number" step="any" className="input" value={form.protein_g} onChange={set("protein_g")} />
          </div>
          <div className="form-group">
            <label className="field-label">Hidratos</label>
            <input type="number" step="any" className="input" value={form.carbs_g} onChange={set("carbs_g")} />
          </div>
          <div className="form-group">
            <label className="field-label">Grasas</label>
            <input type="number" step="any" className="input" value={form.fat_g} onChange={set("fat_g")} />
          </div>
        </div>

        <div className="form-group">
          <label className="field-label">Contiene (alérgenos)</label>
          <CheckboxGroup options={ALLERGENS} values={form.allergens} onChange={set("allergens")} />
          <input className="input" style={{ marginTop: 8 }} value={form.other} onChange={set("other")} placeholder="Otros, separados por comas" />
          <p style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 6 }}>
            Si NO marcas "gluten", el alimento aparecerá como apto para celíacos.
          </p>
        </div>

        <div className="form-group">
          <label className="field-label">Notas</label>
          <input className="input" value={form.notes} onChange={set("notes")} placeholder="Ej: marca recomendada" />
        </div>

        <ErrorMsg>{error}</ErrorMsg>
        <button type="submit" disabled={saving} className="btn btn-primary btn-block">
          {saving ? "Guardando..." : isNew ? "Añadir alimento" : "Guardar cambios"}
        </button>
      </form>
    </Modal>
  );
}
