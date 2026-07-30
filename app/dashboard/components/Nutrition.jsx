"use client";

import { useEffect, useState } from "react";
import { Plus, X, Search, Utensils } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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
        <button
          className={subTab === "dietas" ? "active" : ""}
          onClick={() => setSubTab("dietas")}
        >
          Dietas
        </button>
        <button
          className={subTab === "alimentos" ? "active" : ""}
          onClick={() => setSubTab("alimentos")}
        >
          Biblioteca de alimentos
        </button>
      </div>

      {subTab === "dietas" && (
        <DietsPage userId={userId} isTrainer={isTrainer} />
      )}
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
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [error, setError] = useState("");

  const fetchDiets = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("diets")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    }
    setDiets(data || []);
    setLoading(false);
  };

  const fetchAllergies = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("allergies")
      .eq("id", userId)
      .maybeSingle();
    setAllergies(data?.allergies || []);
  };

  const fetchUsers = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const { data } = await supabase.functions.invoke("admin-users", {
      body: { action: "list" },
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(data?.users || []);
  };

  useEffect(() => {
    fetchDiets();
    if (userId) fetchAllergies();
    if (isTrainer) fetchUsers();
  }, [userId, isTrainer]);

  return (
    <>
      <div className="section-header">
        <div />
        {isTrainer && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            Crear dieta
          </button>
        )}
      </div>

      {error && (
        <p className="form-message form-message-error" style={{ marginBottom: 16 }}>
          Error al cargar: {error}
        </p>
      )}

      {loading && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando...</p>
      )}

      {!loading && diets.length === 0 && (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Utensils size={22} color="#38bdf8" />
            </div>
            <h3>Todavía no hay dietas</h3>
            <p>
              {isTrainer
                ? 'Pulsa "Crear dieta" para añadir la primera.'
                : "Tu entrenadora todavía no te ha asignado una dieta."}
            </p>
          </div>
        </div>
      )}

      {diets.map((d) => (
        <DietCard
          key={d.id}
          diet={d}
          allergies={allergies}
          isTrainer={isTrainer}
          users={users}
          onChanged={fetchDiets}
        />
      ))}

      {showForm && (
        <NewDietModal
          users={users}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            fetchDiets();
          }}
        />
      )}
    </>
  );
}

const DIET_DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function DietCard({ diet, allergies, isTrainer, users, onChanged }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("diet_items")
      .select("*, foods(*)")
      .eq("diet_id", diet.id)
      .order("order_index");
    setItems(data || []);
    setLoading(false);
  };

  const fetchFoods = async () => {
    const { data } = await supabase.from("foods").select("*").order("name");
    setFoods(data || []);
  };

  const handleToggle = (e) => {
    setOpen(e.target.open);
    if (e.target.open && items.length === 0) fetchItems();
    if (e.target.open && isTrainer && foods.length === 0) fetchFoods();
  };

  const dayItems = items.filter((i) => (i.day_number || 1) === selectedDay);
  const daysWithContent = new Set(items.map((i) => i.day_number || 1));
  const meals = [...new Set(dayItems.map((i) => i.meal_label))];

  const conflictFoods = dayItems.filter((i) =>
    (i.foods?.allergens || []).some((a) => allergies.includes(a))
  );

  const targetUserEmail =
    diet.user_id === null
      ? "Plantilla reutilizable"
      : users.find((u) => u.id === diet.user_id)?.email || "Usuario asignado";

  return (
    <details className="accordion-item" onToggle={handleToggle}>
      <summary className="accordion-summary">
        <span>{diet.title}</span>
        <span className="badge">{targetUserEmail}</span>
      </summary>
      <div className="accordion-body">
        {diet.notes && (
          <p style={{ fontSize: 13, color: "var(--dark-70)", marginBottom: 14 }}>
            {diet.notes}
          </p>
        )}

        <div className="week-calendar" style={{ marginBottom: 16 }}>
          {DIET_DAY_NAMES.map((name, i) => {
            const dayNum = i + 1;
            return (
              <div
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`day-cell ${
                  daysWithContent.has(dayNum) ? "has-content" : ""
                } ${selectedDay === dayNum ? "selected" : ""}`}
              >
                <div className="day-name">{name}</div>
                {daysWithContent.has(dayNum) && <div className="day-dot" />}
              </div>
            );
          })}
        </div>

        {conflictFoods.length > 0 && (
          <div className="allergy-warning">
            ⚠️ Este día contiene alimentos que podrían no ser aptos según tus
            alergias registradas.
          </div>
        )}

        {loading && (
          <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando...</p>
        )}

        {!loading && dayItems.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--dark-60)" }}>
            Sin alimentos asignados este día.
          </p>
        )}

        {meals.map((meal) => (
          <div key={meal} className="diet-meal-group">
            <div className="diet-meal-title">{meal}</div>
            {dayItems
              .filter((i) => i.meal_label === meal)
              .map((i) => (
                <div key={i.id} className="diet-food-row">
                  <span>
                    {i.foods?.name} ({i.quantity_g}g)
                    {(i.foods?.allergens || []).map((a) => (
                      <span key={a} className="allergen-tag">
                        {a}
                      </span>
                    ))}
                  </span>
                  <span>
                    {Math.round(
                      (i.foods?.calories_kcal || 0) * (i.quantity_g / 100)
                    )}{" "}
                    kcal
                  </span>
                </div>
              ))}
          </div>
        ))}

        {isTrainer && (
          <button
            onClick={() => setShowAddItem(true)}
            className="btn btn-outline btn-sm"
            style={{ marginTop: 8 }}
          >
            <Plus size={14} />
            Añadir alimento
          </button>
        )}

        {showAddItem && (
          <AddDietItemModal
            dietId={diet.id}
            dayNumber={selectedDay}
            foods={foods}
            onClose={() => setShowAddItem(false)}
            onCreated={() => {
              setShowAddItem(false);
              fetchItems();
            }}
          />
        )}
      </div>
    </details>
  );
}

function NewDietModal({ users, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [targetUser, setTargetUser] = useState("template");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const trainerEmail = sessionData?.session?.user?.email;

    const { error: insertError } = await supabase.from("diets").insert({
      title,
      notes: notes || null,
      user_id: targetUser === "template" ? null : targetUser,
      created_by: trainerEmail,
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
          <h2>Nueva dieta</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label">Título</label>
            <input
              required
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Dieta definición - Julio"
            />
          </div>

          <div className="form-group">
            <label className="field-label">Notas</label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indicaciones generales..."
            />
          </div>

          <div className="form-group">
            <label className="field-label">Asignar a</label>
            <select
              className="select"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
            >
              <option value="template">
                Plantilla reutilizable (sin asignar)
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="form-message form-message-error">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-block"
          >
            {saving ? "Creando..." : "Crear dieta"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddDietItemModal({ dietId, dayNumber, foods, onClose, onCreated }) {
  const [mealLabel, setMealLabel] = useState("Desayuno");
  const [foodId, setFoodId] = useState(foods[0]?.id || "");
  const [quantity, setQuantity] = useState("100");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!foodId) {
      setError("Elige un alimento.");
      return;
    }
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("diet_items").insert({
      diet_id: dietId,
      day_number: dayNumber || 1,
      meal_label: mealLabel,
      food_id: foodId,
      quantity_g: Number(quantity),
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
          <h2>
            Añadir alimento — {DIET_DAY_NAMES[(dayNumber || 1) - 1]}
          </h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label">Comida</label>
            <select
              className="select"
              value={mealLabel}
              onChange={(e) => setMealLabel(e.target.value)}
            >
              <option>Desayuno</option>
              <option>Almuerzo</option>
              <option>Comida</option>
              <option>Merienda</option>
              <option>Cena</option>
            </select>
          </div>

          <div className="form-group">
            <label className="field-label">Alimento</label>
            <select
              className="select"
              value={foodId}
              onChange={(e) => setFoodId(e.target.value)}
            >
              {foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="field-label">Cantidad (g)</label>
            <input
              type="number"
              min="1"
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {error && <p className="form-message form-message-error">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-block"
          >
            {saving ? "Guardando..." : "Añadir"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   BIBLIOTECA DE ALIMENTOS
============================================================ */
function FoodsPage({ isTrainer }) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const fetchFoods = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("foods")
      .select("*")
      .order("name");
    if (fetchError) {
      setError(fetchError.message);
    }
    setFoods(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="section-header">
        <div className="search-input-wrap" style={{ marginBottom: 0, flex: 1 }}>
          <input
            className="input"
            placeholder="Buscar alimento..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {isTrainer && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            Añadir alimento
          </button>
        )}
      </div>

      {error && (
        <p className="form-message form-message-error" style={{ marginBottom: 16 }}>
          Error al cargar: {error}
        </p>
      )}

      {loading && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando...</p>
      )}

      {filtered.map((f) => (
        <details key={f.id} className="accordion-item">
          <summary className="accordion-summary">
            <div>
              <div>{f.name}</div>
              <div className="food-macros-line">
                {f.calories_kcal} kcal · P {f.protein_g}g · C {f.carbs_g}g · G{" "}
                {f.fat_g}g
              </div>
            </div>
          </summary>
          <div className="accordion-body">
            <div className="diet-food-row">
              <span>Proteína</span>
              <span>{f.protein_g} g</span>
            </div>
            <div className="diet-food-row">
              <span>Carbohidratos</span>
              <span>{f.carbs_g} g</span>
            </div>
            <div className="diet-food-row">
              <span>Grasas</span>
              <span>{f.fat_g} g</span>
            </div>
            {f.allergens?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {f.allergens.map((a) => (
                  <span key={a} className="allergen-tag">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </details>
      ))}

      {showForm && (
        <NewFoodModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            fetchFoods();
          }}
        />
      )}
    </>
  );
}

function NewFoodModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [allergens, setAllergens] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("foods").insert({
      name,
      calories_kcal: Number(calories),
      protein_g: Number(protein || 0),
      carbs_g: Number(carbs || 0),
      fat_g: Number(fat || 0),
      allergens: allergens
        ? allergens.split(",").map((a) => a.trim()).filter(Boolean)
        : [],
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
          <h2>Nuevo alimento</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label">Nombre (indica la cantidad de referencia)</label>
            <input
              required
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pechuga de pavo (100g)"
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="field-label">Kcal</label>
              <input
                required
                type="number"
                className="input"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="field-label">Proteína (g)</label>
              <input
                type="number"
                className="input"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="field-label">Carbohidratos (g)</label>
              <input
                type="number"
                className="input"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="field-label">Grasas (g)</label>
              <input
                type="number"
                className="input"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="field-label">
              Alérgenos (separados por comas, ej: gluten, lactosa)
            </label>
            <input
              className="input"
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="gluten, frutos secos"
            />
          </div>

          {error && <p className="form-message form-message-error">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-block"
          >
            {saving ? "Guardando..." : "Añadir alimento"}
          </button>
        </form>
      </div>
    </div>
  );
}
