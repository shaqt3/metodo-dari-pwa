"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Home,
  Dumbbell,
  TrendingUp,
  User,
  Users,
  LogOut,
  Calendar,
  Flame,
  Target,
  Trophy,
  CheckCircle2,
  Utensils,
  Footprints,
  X,
  UserPlus,
  Apple,
  ClipboardList,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { TRAINER_EMAILS } from "@/lib/config";
import { GOALS, DAY_NAMES, labelOf } from "@/lib/options";
import { weightComparison, distanceComparison } from "@/lib/funCompare";
import ExerciseLibrary from "./components/ExerciseLibrary";
import RoutineBuilder from "./components/RoutineBuilder";
import Nutrition from "./components/Nutrition";
import Challenges from "./components/Challenges";
import Members from "./components/Members";
import ProfileForm from "./components/ProfileForm";
import Measurements from "./components/Measurements";
import { confirmDelete } from "./components/ui";

function toDateStr(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function computeStreak(dateStrings) {
  if (!dateStrings.length) return 0;
  const daySet = new Set(dateStrings);
  const sorted = [...daySet].sort().reverse();

  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  let current = new Date(sorted[0]);
  for (let i = 1; i < sorted.length; i++) {
    current.setDate(current.getDate() - 1);
    if (daySet.has(toDateStr(current))) streak++;
    else break;
  }
  return streak;
}

// Días completos sin registrar nada desde el último registro.
function gapDaysSinceLastLog(dateStrings) {
  if (!dateStrings.length) return 0;
  const sorted = [...dateStrings].sort().reverse();
  const diffMs = new Date(toDateStr(new Date())) - new Date(toDateStr(sorted[0]));
  return Math.floor(diffMs / 86400000);
}

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [streak, setStreak] = useState(0);
  const [gapDays, setGapDays] = useState(0);
  const isTrainer = TRAINER_EMAILS.includes(userEmail);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUserEmail(session.user.email);
      setUserId(session.user.id);
      setLoading(false);

      // Crea/actualiza la ficha con el email para que el socio
      // aparezca en "Socios" (si falla no pasa nada).
      supabase
        .from("profiles")
        .upsert({ id: session.user.id, email: session.user.email })
        .then(() => {});
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const loadStreak = async () => {
      const { data } = await supabase.from("workout_logs").select("log_date").eq("user_id", userId);
      const dates = (data || []).map((d) => d.log_date);
      setStreak(computeStreak(dates));
      setGapDays(gapDaysSinceLastLog(dates));
    };
    loadStreak();
  }, [userId, activeTab]);

  if (loading) {
    return (
      <main className="loading-screen">
        <p>Cargando...</p>
      </main>
    );
  }

  const navItems = [
    { id: "home", label: "Inicio", icon: Home },
    ...(isTrainer ? [{ id: "socios", label: "Socios", icon: Users }] : []),
    { id: "rutinas", label: "Rutinas", icon: Calendar },
    { id: "ejercicios", label: "Ejercicios", icon: Dumbbell },
    { id: "alimentacion", label: "Alimentación", icon: Utensils },
    { id: "retos", label: "Retos", icon: Trophy },
    ...(!isTrainer ? [{ id: "progreso", label: "Progreso", icon: TrendingUp }] : []),
    { id: "perfil", label: "Perfil", icon: User },
  ];

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const goTo = (tab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR (ordenador) */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <Image src="/icon-192.png" alt="El Método Dari" width={34} height={34} />
          </div>
          <span>EL MÉTODO DARI</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => goTo(id)} className={`sidebar-link ${activeTab === id ? "active" : ""}`}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {isTrainer && <div className="admin-pill">Modo entrenadora</div>}
          <button onClick={handleLogout} className="sidebar-link">
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="app-main">
        {activeTab === "home" &&
          (isTrainer ? (
            <TrainerHome email={userEmail} initial={initial} goTo={goTo} />
          ) : (
            <MemberHome
              userId={userId}
              email={userEmail}
              initial={initial}
              streak={streak}
              gapDays={gapDays}
              onRestLogged={() => setGapDays(0)}
              goTo={goTo}
            />
          ))}

        {activeTab === "socios" && isTrainer && <Members onOpenTab={goTo} />}

        {activeTab === "ejercicios" && <ExerciseLibrary isTrainer={isTrainer} />}

        {activeTab === "rutinas" && <RoutineBuilder userId={userId} isTrainer={isTrainer} />}

        {activeTab === "alimentacion" && <Nutrition userId={userId} isTrainer={isTrainer} />}

        {activeTab === "retos" && (
          <>
            {!isTrainer && gapDays >= 2 && <RestChallengeBanner userId={userId} onLogged={() => setGapDays(0)} />}
            <Challenges userId={userId} isTrainer={isTrainer} />
          </>
        )}

        {activeTab === "progreso" && (
          <>
            {gapDays >= 2 && <RestChallengeBanner userId={userId} onLogged={() => setGapDays(0)} />}
            <ProgressSection userId={userId} streak={streak} />
          </>
        )}

        {activeTab === "perfil" && (
          <>
            <div className="app-topbar">
              <div>
                <h1>Perfil</h1>
                <p>{userEmail}</p>
              </div>
            </div>
            <div className="content-card">
              <h2 style={{ marginBottom: 14 }}>Mis datos</h2>
              <ProfileForm userId={userId} email={userEmail} />
            </div>
            <div className="content-card">
              <button onClick={handleLogout} className="btn btn-outline">
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </main>

      {/* BARRA INFERIOR (móvil) */}
      <nav className="bottom-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => goTo(id)} className={`bottom-nav-item ${activeTab === id ? "active" : ""}`}>
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ============================================================
   INICIO — ENTRENADORA
============================================================ */
function TrainerHome({ email, initial, goTo }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const load = async () => {
      const count = (table, fn) => {
        let q = supabase.from(table).select("id", { count: "exact", head: true });
        if (fn) q = fn(q);
        return q.then(({ count: c }) => c ?? 0);
      };
      const weekAgo = toDateStr(new Date(Date.now() - 7 * 86400000));
      const [members, exercises, foods, diets, routines, challenges, logs] = await Promise.all([
        count("profiles", (q) => q.not("email", "in", `(${TRAINER_EMAILS.map((e) => `"${e}"`).join(",")})`)),
        count("exercise_library"),
        count("foods"),
        count("diets"),
        count("routines"),
        count("challenges"),
        count("workout_logs", (q) => q.gte("log_date", weekAgo)),
      ]);
      setCounts({ members, exercises, foods, diets, routines, challenges, logs });
    };
    load();
  }, []);

  const tiles = [
    { tab: "socios", icon: Users, value: counts.members, label: "Socios" },
    { tab: "rutinas", icon: Calendar, value: counts.routines, label: "Rutinas" },
    { tab: "ejercicios", icon: Dumbbell, value: counts.exercises, label: "Ejercicios" },
    { tab: "alimentacion", icon: Utensils, value: counts.diets, label: "Dietas" },
    { tab: "alimentacion", icon: Apple, value: counts.foods, label: "Alimentos" },
    { tab: "retos", icon: Trophy, value: counts.challenges, label: "Retos" },
  ];

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>¡Hola, Dari!</h1>
          <p>{email}</p>
        </div>
        <div className="avatar-chip">{initial}</div>
      </div>

      <div className="streak-banner">
        <div className="streak-icon">
          <Flame size={20} color="#38bdf8" />
        </div>
        <div>
          <div className="streak-value">{counts.logs ?? "—"} entrenos</div>
          <div className="streak-label">registrados por tus socios en los últimos 7 días</div>
        </div>
      </div>

      <div className="stat-grid stat-grid-6">
        {tiles.map(({ tab, icon: Icon, value, label }) => (
          <button key={label} className="stat-card stat-card-btn" onClick={() => goTo(tab)}>
            <div className="stat-icon">
              <Icon size={16} color="#38bdf8" />
            </div>
            <div className="stat-value">{value ?? "—"}</div>
            <div className="stat-label">{label}</div>
          </button>
        ))}
      </div>

      <div className="content-card">
        <h2>¿Qué quieres hacer?</h2>
        <div className="quick-actions">
          <button className="quick-action" onClick={() => goTo("socios")}>
            <UserPlus size={20} />
            <span>Añadir socio o ver su ficha</span>
          </button>
          <button className="quick-action" onClick={() => goTo("rutinas")}>
            <ClipboardList size={20} />
            <span>Crear o asignar una rutina</span>
          </button>
          <button className="quick-action" onClick={() => goTo("alimentacion")}>
            <Utensils size={20} />
            <span>Crear o asignar una dieta</span>
          </button>
          <button className="quick-action" onClick={() => goTo("ejercicios")}>
            <Dumbbell size={20} />
            <span>Añadir ejercicios y vídeos</span>
          </button>
          <button className="quick-action" onClick={() => goTo("retos")}>
            <Trophy size={20} />
            <span>Lanzar un reto</span>
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 14 }}>
          Truco: en todas las pantallas verás un lápiz ✏️ para editar y una papelera 🗑️ para borrar.
        </p>
      </div>
    </>
  );
}

/* ============================================================
   INICIO — SOCIO
============================================================ */
function MemberHome({ userId, email, initial, streak, gapDays, onRestLogged, goTo }) {
  const [info, setInfo] = useState({});

  useEffect(() => {
    const load = async () => {
      const [{ data: profile }, { data: routines }, { count: done }] = await Promise.all([
        supabase.from("profiles").select("full_name, goal").eq("id", userId).maybeSingle(),
        supabase.from("routines").select("id, title, user_id").order("created_at", { ascending: false }),
        supabase.from("challenge_submissions").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      const routine = (routines || []).find((r) => r.user_id === userId) || (routines || [])[0];

      let next = null;
      if (routine) {
        const { data: days } = await supabase
          .from("routine_days")
          .select("day_number, label")
          .eq("routine_id", routine.id)
          .order("day_number");
        const js = new Date().getDay();
        const today = js === 0 ? 7 : js;
        const list = days || [];
        next = list.find((d) => d.day_number >= today) || list[0] || null;
        if (next) next = { ...next, isToday: next.day_number === today };
      }
      setInfo({ profile, routine, next, done: done || 0 });
    };
    if (userId) load();
  }, [userId]);

  const name = info.profile?.full_name?.split(" ")[0];

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>¡Hola{name ? `, ${name}` : " de nuevo"}!</h1>
          <p>{email}</p>
        </div>
        <div className="avatar-chip">{initial}</div>
      </div>

      <div className="streak-banner">
        <div className="streak-icon">
          <Flame size={20} color="#38bdf8" />
        </div>
        <div>
          <div className="streak-value">
            {streak} {streak === 1 ? "día" : "días"}
          </div>
          <div className="streak-label">Racha actual de entrenamiento</div>
        </div>
      </div>

      {gapDays >= 2 && <RestChallengeBanner userId={userId} onLogged={onRestLogged} />}

      <div className="stat-grid">
        <button className="stat-card stat-card-btn" onClick={() => goTo("rutinas")}>
          <div className="stat-icon">
            <Calendar size={16} color="#38bdf8" />
          </div>
          <div className="stat-value stat-value-sm">
            {info.next ? (info.next.isToday ? "Hoy" : DAY_NAMES[info.next.day_number - 1]) : "—"}
          </div>
          <div className="stat-label">{info.next ? info.next.label : "Próxima sesión"}</div>
        </button>
        <button className="stat-card stat-card-btn" onClick={() => goTo("rutinas")}>
          <div className="stat-icon">
            <Dumbbell size={16} color="#38bdf8" />
          </div>
          <div className="stat-value stat-value-sm">{info.routine?.title || "—"}</div>
          <div className="stat-label">Rutina activa</div>
        </button>
        <button className="stat-card stat-card-btn" onClick={() => goTo("perfil")}>
          <div className="stat-icon">
            <Target size={16} color="#38bdf8" />
          </div>
          <div className="stat-value stat-value-sm">{labelOf(GOALS, info.profile?.goal) || "Sin definir"}</div>
          <div className="stat-label">Objetivo</div>
        </button>
        <button className="stat-card stat-card-btn" onClick={() => goTo("retos")}>
          <div className="stat-icon">
            <Trophy size={16} color="#38bdf8" />
          </div>
          <div className="stat-value">{info.done ?? "—"}</div>
          <div className="stat-label">Retos completados</div>
        </button>
      </div>

      {!info.profile?.full_name && (
        <div className="content-card">
          <h2>Completa tu ficha</h2>
          <p>Cuéntale a tu entrenadora tu objetivo, tus datos y si necesitas una alimentación especial (por ejemplo, sin gluten).</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => goTo("perfil")}>
            Ir a mi perfil
          </button>
        </div>
      )}

      <div className="content-card">
        <h2>Bienvenido a El Método Dari</h2>
        <p>Consulta tus rutinas, tus dietas, apunta tu progreso y anímate con los retos. Todo lo que hagas aquí construye tu racha.</p>
      </div>
    </>
  );
}

/* ============================================================
   RETO DE DESCANSO ACTIVO (cuando se pierde más de 1 día)
============================================================ */
function RestChallengeBanner({ userId, onLogged }) {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleLog = async () => {
    setSaving(true);
    await supabase.from("workout_logs").insert({
      user_id: userId,
      kind: "cardio",
      log_date: toDateStr(new Date()),
      distance_km: 9, // aprox. 12.000 pasos
    });
    setSaving(false);
    setDone(true);
    onLogged();
  };

  if (done) {
    return (
      <div className="rest-banner">
        <span className="completed-tag">
          <CheckCircle2 size={16} />
          ¡Reto de descanso activo completado! Tu racha sigue viva.
        </span>
      </div>
    );
  }

  return (
    <div className="rest-banner">
      <h3>Llevas unos días sin entrenar</h3>
      <p>
        No pasa nada, un día de descanso está bien. Para no perder el ritmo, hoy tienes un reto de descanso activo:
        anda 12.000 pasos.
      </p>
      <button onClick={handleLog} disabled={saving} className="btn btn-primary btn-sm">
        <Footprints size={15} />
        {saving ? "Guardando..." : "Ya he andado 12.000 pasos"}
      </button>
    </div>
  );
}

/* ============================================================
   PROGRESO (socio)
============================================================ */
function ProgressSection({ userId, streak }) {
  const [kind, setKind] = useState("peso");
  const [value, setValue] = useState("");
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    const { data, error: fetchError } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: false });
    setLoadingLogs(false);
    if (fetchError) {
      setError("No se pudieron cargar tus registros.");
      return;
    }
    setError("");
    setLogs(data || []);
  };

  useEffect(() => {
    if (userId) fetchLogs();
  }, [userId]);

  const totalFor = (k) =>
    logs
      .filter((l) => l.kind === k)
      .reduce((sum, l) => sum + Number(l[k === "peso" ? "weight_kg" : "distance_km"] || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setComparison(null);

    const { error: insertError } = await supabase.from("workout_logs").insert({
      user_id: userId,
      kind,
      log_date: toDateStr(new Date()),
      weight_kg: kind === "peso" ? Number(value) : null,
      distance_km: kind === "cardio" ? Number(value) : null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    const newTotal = totalFor(kind) + Number(value);
    setComparison(kind === "peso" ? weightComparison(newTotal) : distanceComparison(newTotal));
    setValue("");
    fetchLogs();
  };

  const removeLog = async (l) => {
    if (!confirmDelete("este registro")) return;
    await supabase.from("workout_logs").delete().eq("id", l.id);
    fetchLogs();
  };

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>Progreso</h1>
          <p>Registra tus entrenamientos y tus medidas</p>
        </div>
      </div>

      <div className="content-card progress-form">
        <form onSubmit={handleSubmit}>
          <div className="type-toggle">
            <button type="button" className={kind === "peso" ? "active" : ""} onClick={() => setKind("peso")}>
              Día de peso
            </button>
            <button type="button" className={kind === "cardio" ? "active" : ""} onClick={() => setKind("cardio")}>
              Día de cardio
            </button>
          </div>

          <div className="form-group">
            <label className="field-label">
              {kind === "peso" ? "Kg totales levantados hoy" : "Km recorridos hoy (correr, andar o bici)"}
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.1"
              className="input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={kind === "peso" ? "Ej: 1200" : "Ej: 5.5"}
            />
          </div>

          {error && <p className="form-message form-message-error">{error}</p>}

          <button type="submit" disabled={saving} className="btn btn-primary btn-block">
            {saving ? "Guardando..." : "Registrar"}
          </button>
        </form>

        {comparison && <div className="comparison-box">{comparison}</div>}
      </div>

      <div className="content-card">
        <h2>Total acumulado</h2>
        <p style={{ marginTop: 8 }}>
          Peso levantado: <strong>{totalFor("peso").toLocaleString("es-ES")} kg</strong>
        </p>
        <p>
          Distancia recorrida: <strong>{totalFor("cardio").toLocaleString("es-ES")} km</strong>
        </p>
        <p style={{ marginTop: 8 }}>
          Racha actual:{" "}
          <strong>
            {streak} {streak === 1 ? "día" : "días"}
          </strong>
        </p>
      </div>

      <Measurements userId={userId} title="Mi peso y medidas" />

      {loadingLogs && <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando historial...</p>}

      {!loadingLogs && logs.length > 0 && (
        <div className="content-card">
          <h2>Historial reciente</h2>
          <div style={{ marginTop: 10 }}>
            {logs.slice(0, 15).map((l) => (
              <div key={l.id} className="diet-food-row">
                <span>{new Date(l.log_date).toLocaleDateString("es-ES")}</span>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {l.kind === "peso" ? `${l.weight_kg} kg` : `${l.distance_km} km`}
                  <button className="icon-btn icon-btn-danger" onClick={() => removeLog(l)} title="Borrar">
                    <X size={13} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
