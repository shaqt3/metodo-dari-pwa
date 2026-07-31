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
  Trash2,
  LogOut,
  Calendar,
  Flame,
  Target,
  Plus,
  X,
  Trophy,
  Camera,
  CheckCircle2,
  Utensils,
  Footprints,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { TRAINER_EMAILS } from "@/lib/config";
import { weightComparison, distanceComparison } from "@/lib/funCompare";
import ExerciseLibrary from "./components/ExerciseLibrary";
import RoutineBuilder, { NewPlanModal } from "./components/RoutineBuilder";
import Nutrition, { NewDietModal } from "./components/Nutrition";

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
    const expected = toDateStr(current);
    if (daySet.has(expected)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Días completos sin registrar nada desde el último registro.
function gapDaysSinceLastLog(dateStrings) {
  if (!dateStrings.length) return 0;
  const sorted = [...dateStrings].sort().reverse();
  const lastLog = new Date(sorted[0]);
  const today = new Date();
  const diffMs = new Date(toDateStr(today)) - new Date(toDateStr(lastLog));
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
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const loadStreak = async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("log_date")
        .eq("user_id", userId);
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
    { id: "home", label: "Home", icon: Home },
    { id: "ejercicios", label: "Ejercicios", icon: Dumbbell },
    { id: "rutinas", label: "Rutinas", icon: Calendar },
    { id: "alimentacion", label: "Alimentación", icon: Utensils },
    { id: "retos", label: "Retos", icon: Trophy },
    { id: "progreso", label: "Progreso", icon: TrendingUp },
    ...(isTrainer
      ? [{ id: "usuarios", label: "Usuarios", icon: Users }]
      : []),
    { id: "perfil", label: "Perfil", icon: User },
  ];

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR (desktop) */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <Image src="/icon-192.png" alt="El Método Dari" width={34} height={34} />
          </div>
          <span>EL MÉTODO DARI</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`sidebar-link ${activeTab === id ? "active" : ""}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-link">
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="app-main">
        {activeTab === "home" && (
          <>
            <div className="app-topbar">
              <div>
                <h1>¡Hola de nuevo!</h1>
                <p>{userEmail}</p>
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

            {gapDays >= 2 && (
              <RestChallengeBanner userId={userId} onLogged={() => setGapDays(0)} />
            )}

            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Calendar size={16} color="#38bdf8" />
                </div>
                <div className="stat-value">—</div>
                <div className="stat-label">Próxima sesión</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Dumbbell size={16} color="#38bdf8" />
                </div>
                <div className="stat-value">—</div>
                <div className="stat-label">Rutina activa</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Target size={16} color="#38bdf8" />
                </div>
                <div className="stat-value">—</div>
                <div className="stat-label">Objetivo</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Trophy size={16} color="#38bdf8" />
                </div>
                <div className="stat-value">—</div>
                <div className="stat-label">Retos completados</div>
              </div>
            </div>

            <div className="content-card">
              <h2>Bienvenido a El Método Dari</h2>
              <p>
                Consulta tus rutinas, tus dietas, apunta tu progreso y
                anímate con los retos. Todo lo que hagas aquí construye tu
                racha.
              </p>
            </div>
          </>
        )}

        {activeTab === "ejercicios" && (
          <ExerciseLibrary isTrainer={isTrainer} />
        )}

        {activeTab === "rutinas" && (
          <RoutineBuilder userId={userId} isTrainer={isTrainer} />
        )}

        {activeTab === "alimentacion" && (
          <Nutrition userId={userId} isTrainer={isTrainer} />
        )}

        {activeTab === "retos" && (
          <>
            {gapDays >= 2 && (
              <RestChallengeBanner userId={userId} onLogged={() => setGapDays(0)} />
            )}
            <ChallengesSection userId={userId} isTrainer={isTrainer} />
          </>
        )}

        {activeTab === "progreso" && (
          <>
            {gapDays >= 2 && (
              <RestChallengeBanner userId={userId} onLogged={() => setGapDays(0)} />
            )}
            <ProgressSection userId={userId} streak={streak} />
          </>
        )}

        {activeTab === "usuarios" && isTrainer && <TrainerUsersPanel />}

        {activeTab === "perfil" && (
          <>
            <div className="app-topbar">
              <div>
                <h1>Perfil</h1>
                <p>{userEmail}</p>
              </div>
            </div>
            <ProfileSection userId={userId} />
            <div className="content-card">
              <button onClick={handleLogout} className="btn btn-outline">
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </main>

      {/* BOTTOM NAV (mobile) */}
      <nav className="bottom-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`bottom-nav-item ${activeTab === id ? "active" : ""}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
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
        No pasa nada, un día de descanso está bien. Para no perder el
        ritmo, hoy tienes un reto de descanso activo: anda 12.000 pasos.
      </p>
      <button
        onClick={handleLog}
        disabled={saving}
        className="btn btn-primary btn-sm"
      >
        <Footprints size={15} />
        {saving ? "Guardando..." : "Ya he andado 12.000 pasos"}
      </button>
    </div>
  );
}

/* ============================================================
   RETOS
============================================================ */
function ChallengesSection({ userId, isTrainer }) {
  const [challenges, setChallenges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    setLoadingData(true);
    const [{ data: ch }, { data: subs }] = await Promise.all([
      supabase.from("challenges").select("*").order("created_at", { ascending: false }),
      supabase.from("challenge_submissions").select("*").eq("user_id", userId),
    ]);
    setChallenges(ch || []);
    setSubmissions(subs || []);
    setLoadingData(false);
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const isCompleted = (challengeId) =>
    submissions.some((s) => s.challenge_id === challengeId);

  return (
    <>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Retos</h1>
          <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 2 }}>
            En el gimnasio o en casa
          </p>
        </div>
        {isTrainer && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            Crear reto
          </button>
        )}
      </div>

      {loadingData && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando...</p>
      )}

      {!loadingData && challenges.length === 0 && (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Trophy size={22} color="#38bdf8" />
            </div>
            <h3>Todavía no hay retos</h3>
            <p>
              {isTrainer
                ? 'Pulsa "Crear reto" para añadir el primero.'
                : "Pronto tu entrenadora añadirá retos aquí."}
            </p>
          </div>
        </div>
      )}

      {challenges.map((c) => (
        <ChallengeCard
          key={c.id}
          challenge={c}
          userId={userId}
          completed={isCompleted(c.id)}
          onCompleted={fetchData}
        />
      ))}

      {showForm && (
        <NewChallengeModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            fetchData();
          }}
        />
      )}
    </>
  );
}

function ChallengeCard({ challenge, userId, completed, onCompleted }) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const locationLabel =
    challenge.location === "gym"
      ? "En el gimnasio"
      : challenge.location === "home"
      ? "En casa"
      : "Gimnasio o casa";

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    let photoUrl = null;

    if (file) {
      const filePath = `${userId}/${challenge.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("challenge-photos")
        .upload(filePath, file);

      if (uploadError) {
        setSaving(false);
        setError(
          "No se pudo subir la foto. Revisa que el bucket 'challenge-photos' exista y sea público."
        );
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("challenge-photos")
        .getPublicUrl(filePath);
      photoUrl = publicUrlData?.publicUrl || null;
    }

    const { error: insertError } = await supabase
      .from("challenge_submissions")
      .insert({
        challenge_id: challenge.id,
        user_id: userId,
        photo_url: photoUrl,
        note: note || null,
      });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onCompleted();
  };

  return (
    <div className="content-card challenge-card">
      <div className="challenge-card-head">
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{challenge.title}</h3>
        <span className="badge">{locationLabel}</span>
      </div>
      {challenge.description && <p>{challenge.description}</p>}

      {completed ? (
        <span className="completed-tag">
          <CheckCircle2 size={16} />
          Completado
        </span>
      ) : (
        <>
          <div className="challenge-submit-row">
            <label className="file-input-label">
              <Camera size={15} />
              {file ? file.name : "Añadir foto (opcional)"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <input
              className="input"
              style={{ flex: 1, minWidth: 160 }}
              placeholder="Nota (opcional, ej: 50 min en bici)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn btn-primary btn-sm"
            >
              {saving ? "Guardando..." : "Marcar completado"}
            </button>
          </div>
          {error && (
            <p className="form-message form-message-error" style={{ marginTop: 10 }}>
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function NewChallengeModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("ambos");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const trainerEmail = sessionData?.session?.user?.email;

    const { error: insertError } = await supabase.from("challenges").insert({
      title,
      description: description || null,
      location,
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
          <h2>Nuevo reto</h2>
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
              placeholder="Ej: 50 minutos en bici"
            />
          </div>

          <div className="form-group">
            <label className="field-label">Descripción</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: sube una foto de tu ruta en bici de al menos 50 minutos"
            />
          </div>

          <div className="form-group">
            <label className="field-label">Dónde se puede hacer</label>
            <select
              className="select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="ambos">Gimnasio o casa</option>
              <option value="gym">Solo gimnasio</option>
              <option value="home">Solo casa</option>
            </select>
          </div>

          {error && <p className="form-message form-message-error">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-block"
          >
            {saving ? "Guardando..." : "Crear reto"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   PROGRESO
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
      setError(
        "No se pudieron cargar tus registros. Revisa los permisos (RLS/grants) de la tabla workout_logs en Supabase."
      );
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
      .reduce(
        (sum, l) => sum + Number(l[k === "peso" ? "weight_kg" : "distance_km"] || 0),
        0
      );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setComparison(null);

    const payload = {
      user_id: userId,
      kind,
      log_date: toDateStr(new Date()),
      weight_kg: kind === "peso" ? Number(value) : null,
      distance_km: kind === "cardio" ? Number(value) : null,
    };

    const { error: insertError } = await supabase
      .from("workout_logs")
      .insert(payload);

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    const newTotal = totalFor(kind) + Number(value);

    setComparison(
      kind === "peso" ? weightComparison(newTotal) : distanceComparison(newTotal)
    );

    setValue("");
    fetchLogs();
  };

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>Progreso</h1>
          <p>Registra tus entrenamientos de peso y cardio</p>
        </div>
      </div>

      <div className="content-card progress-form">
        <form onSubmit={handleSubmit}>
          <div className="type-toggle">
            <button
              type="button"
              className={kind === "peso" ? "active" : ""}
              onClick={() => setKind("peso")}
            >
              Día de peso
            </button>
            <button
              type="button"
              className={kind === "cardio" ? "active" : ""}
              onClick={() => setKind("cardio")}
            >
              Día de cardio
            </button>
          </div>

          <div className="form-group">
            <label className="field-label">
              {kind === "peso"
                ? "Kg totales levantados hoy"
                : "Km recorridos hoy (correr, andar o bici)"}
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

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-block"
          >
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
          Racha actual: <strong>{streak} {streak === 1 ? "día" : "días"}</strong>
        </p>
      </div>

      {loadingLogs && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando historial...</p>
      )}

      {!loadingLogs && logs.length > 0 && (
        <div className="content-card">
          <h2>Historial reciente</h2>
          <div style={{ marginTop: 10 }}>
            {logs.slice(0, 10).map((l) => (
              <div key={l.id} className="diet-food-row">
                <span>{l.log_date}</span>
                <span>
                  {l.kind === "peso" ? `${l.weight_kg} kg` : `${l.distance_km} km`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   USUARIOS (entrenador/a) — con buscador y alergias
============================================================ */
function TrainerUsersPanel() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [query, setQuery] = useState("");

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const { data, error: fnError } = await supabase.functions.invoke(
      "admin-users",
      {
        body: { action: "list" },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setLoadingUsers(false);

    if (fnError) {
      setError(
        "No se pudo cargar la lista de usuarios. Revisa que la función admin-users esté desplegada en Supabase."
      );
      return;
    }

    setUsers(data?.users || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id, email) => {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar al usuario ${email}? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(id);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const { error: fnError } = await supabase.functions.invoke(
      "admin-users",
      {
        body: { action: "delete", userId: id },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setDeletingId(null);

    if (fnError) {
      setError("No se pudo eliminar el usuario. Inténtalo de nuevo.");
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>Usuarios</h1>
          <p>Gestiona las cuentas registradas en la app</p>
        </div>
      </div>

      <div className="search-input-wrap">
        <input
          className="input"
          placeholder="Buscar por email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="content-card">
        {loadingUsers && (
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--dark-60)" }}>
            Cargando usuarios...
          </p>
        )}

        {error && <p className="form-message form-message-error">{error}</p>}

        {!loadingUsers && !error && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={22} color="#38bdf8" />
            </div>
            <h3>No hay usuarios que coincidan</h3>
            <p>Prueba con otro término de búsqueda.</p>
          </div>
        )}

        {filtered.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            deleting={deletingId === u.id}
            onDelete={() => handleDelete(u.id, u.email)}
          />
        ))}
      </div>
    </>
  );
}

function UserRow({ user, deleting, onDelete }) {
  const [open, setOpen] = useState(false);
  const [allergiesInput, setAllergiesInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [diets, setDiets] = useState([]);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showNewDiet, setShowNewDiet] = useState(false);

  const singleUserList = [{ id: user.id, email: user.email }];

  const loadEverything = async () => {
    const [{ data: profile }, { data: userRoutines }, { data: userDiets }] =
      await Promise.all([
        supabase.from("profiles").select("allergies").eq("id", user.id).maybeSingle(),
        supabase.from("routines").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("diets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
    setAllergiesInput((profile?.allergies || []).join(", "));
    setRoutines(userRoutines || []);
    setDiets(userDiets || []);
    setLoaded(true);
  };

  const handleToggle = (e) => {
    setOpen(e.target.open);
    if (e.target.open && !loaded) loadEverything();
  };

  const handleSaveAllergies = async () => {
    setSaving(true);
    const allergies = allergiesInput
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    await supabase
      .from("profiles")
      .upsert({ id: user.id, allergies, updated_at: new Date().toISOString() });

    setSaving(false);
  };

  return (
    <details className="accordion-item" onToggle={handleToggle}>
      <summary className="accordion-summary">
        <span>{user.email}</span>
      </summary>
      <div className="accordion-body">
        <div className="form-group">
          <label className="field-label">
            Alergias (separadas por comas, ej: gluten, lactosa)
          </label>
          <input
            className="input"
            value={allergiesInput}
            onChange={(e) => setAllergiesInput(e.target.value)}
            placeholder="Sin alergias registradas"
          />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <button
            onClick={handleSaveAllergies}
            disabled={saving}
            className="btn btn-outline btn-sm"
          >
            {saving ? "Guardando..." : "Guardar alergias"}
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="btn btn-danger-outline btn-sm"
          >
            <Trash2 size={14} />
            {deleting ? "..." : "Eliminar usuario"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span className="field-label" style={{ marginBottom: 0 }}>Rutinas asignadas</span>
          <button onClick={() => setShowNewPlan(true)} className="btn btn-outline btn-sm">
            + Asignar rutina
          </button>
        </div>
        {routines.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--dark-60)", marginBottom: 20 }}>
            Sin rutinas propias asignadas todavía.
          </p>
        ) : (
          <ul style={{ marginBottom: 20 }}>
            {routines.map((r) => (
              <li key={r.id} className="user-row" style={{ marginBottom: 8 }}>
                <span className="user-row-email">{r.title}</span>
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span className="field-label" style={{ marginBottom: 0 }}>Dietas asignadas</span>
          <button onClick={() => setShowNewDiet(true)} className="btn btn-outline btn-sm">
            + Asignar dieta
          </button>
        </div>
        {diets.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--dark-60)" }}>
            Sin dietas propias asignadas todavía.
          </p>
        ) : (
          <ul>
            {diets.map((d) => (
              <li key={d.id} className="user-row" style={{ marginBottom: 8 }}>
                <span className="user-row-email">{d.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showNewPlan && (
        <NewPlanModal
          users={singleUserList}
          defaultUserId={user.id}
          onClose={() => setShowNewPlan(false)}
          onCreated={() => {
            setShowNewPlan(false);
            loadEverything();
          }}
        />
      )}

      {showNewDiet && (
        <NewDietModal
          users={singleUserList}
          defaultUserId={user.id}
          onClose={() => setShowNewDiet(false)}
          onCreated={() => {
            setShowNewDiet(false);
            loadEverything();
          }}
        />
      )}
    </details>
  );
}

/* ============================================================
   PERFIL — alergias propias
============================================================ */
function ProfileSection({ userId }) {
  const [allergiesInput, setAllergiesInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("allergies")
        .eq("id", userId)
        .maybeSingle();
      setAllergiesInput((data?.allergies || []).join(", "));
    };
    if (userId) load();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const allergies = allergiesInput
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    await supabase
      .from("profiles")
      .upsert({ id: userId, allergies, updated_at: new Date().toISOString() });

    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="content-card">
      <h2>Mis alergias</h2>
      <p style={{ marginBottom: 14 }}>
        Las usamos para avisarte si una dieta contiene algo que debas evitar.
      </p>
      <div className="form-group">
        <input
          className="input"
          value={allergiesInput}
          onChange={(e) => setAllergiesInput(e.target.value)}
          placeholder="Ej: gluten, lactosa, frutos secos"
        />
      </div>
      <button onClick={handleSave} disabled={saving} className="btn btn-outline btn-sm">
        {saving ? "Guardando..." : "Guardar alergias"}
      </button>
      {saved && (
        <p className="form-message form-message-info" style={{ marginTop: 10 }}>
          Guardado.
        </p>
      )}
    </div>
  );
}
