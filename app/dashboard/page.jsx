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
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { TRAINER_EMAILS, GYM_ZONES } from "@/lib/config";
import { weightComparison, distanceComparison } from "@/lib/funCompare";

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.slice(1);
    } else if (u.searchParams.get("v")) {
      id = u.searchParams.get("v");
    } else if (u.pathname.includes("/embed/")) {
      return url;
    }
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

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

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [streak, setStreak] = useState(0);
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
      setStreak(computeStreak((data || []).map((d) => d.log_date)));
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
    { id: "rutinas", label: "Rutinas", icon: Dumbbell },
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
                Consulta tus rutinas, apunta tu progreso y anímate con los
                retos. Todo lo que hagas aquí construye tu racha.
              </p>
            </div>
          </>
        )}

        {activeTab === "rutinas" && (
          <RoutinesSection userId={userId} isTrainer={isTrainer} />
        )}

        {activeTab === "retos" && (
          <ChallengesSection userId={userId} isTrainer={isTrainer} />
        )}

        {activeTab === "progreso" && <ProgressSection userId={userId} />}

        {activeTab === "usuarios" && isTrainer && <TrainerUsersPanel />}

        {activeTab === "perfil" && (
          <>
            <div className="app-topbar">
              <div>
                <h1>Perfil</h1>
                <p>{userEmail}</p>
              </div>
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
   RUTINAS
============================================================ */
function RoutinesSection({ userId, isTrainer }) {
  const [routines, setRoutines] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);

  const fetchRoutines = async () => {
    setLoadingData(true);
    const { data } = await supabase
      .from("routines")
      .select("*")
      .order("created_at", { ascending: false });
    setRoutines(data || []);
    setLoadingData(false);
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
    fetchRoutines();
    if (isTrainer) fetchUsers();
  }, [isTrainer]);

  return (
    <>
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Rutinas</h1>
          <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 2 }}>
            Entrenamiento funcional y de máquinas
          </p>
        </div>
        {isTrainer && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            Añadir rutina
          </button>
        )}
      </div>

      {loadingData && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>Cargando...</p>
      )}

      {!loadingData && routines.length === 0 && (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Dumbbell size={22} color="#38bdf8" />
            </div>
            <h3>Todavía no hay rutinas</h3>
            <p>
              {isTrainer
                ? 'Pulsa "Añadir rutina" para crear la primera.'
                : "Cuando tu entrenador te asigne una rutina, aparecerá aquí."}
            </p>
          </div>
        </div>
      )}

      {routines.map((r) => {
        const embedUrl = getYoutubeEmbedUrl(r.youtube_url);
        return (
          <div key={r.id} className="content-card routine-card">
            <div className="routine-card-head">
              <div>
                <h3>{r.title}</h3>
                <div className="routine-meta">
                  {r.zone || "Sin zona especificada"}
                  {r.user_id === null ? " · Para todos" : ""}
                </div>
              </div>
              <span className="badge">
                {r.type === "funcional" && "Funcional"}
                {r.type === "maquinas" && "Máquinas"}
                {r.type === "pesas" && "Pesas"}
                {r.type === "cardio" && "Cardio"}
              </span>
            </div>

            {embedUrl && (
              <div className="video-wrap">
                <iframe
                  src={embedUrl}
                  title={r.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {r.notes && <div className="routine-notes">{r.notes}</div>}
          </div>
        );
      })}

      {showForm && (
        <NewRoutineModal
          users={users}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            fetchRoutines();
          }}
        />
      )}
    </>
  );
}

function NewRoutineModal({ users, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("funcional");
  const [zone, setZone] = useState(GYM_ZONES[0]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [targetUser, setTargetUser] = useState("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const trainerEmail = sessionData?.session?.user?.email;

    const { error: insertError } = await supabase.from("routines").insert({
      title,
      type,
      zone,
      youtube_url: youtubeUrl || null,
      notes: notes || null,
      user_id: targetUser === "all" ? null : targetUser,
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
          <h2>Nueva rutina</h2>
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
              placeholder="Ej: Circuito funcional piernas"
            />
          </div>

          <div className="form-group">
            <label className="field-label">Tipo</label>
            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="funcional">Funcional</option>
              <option value="maquinas">Máquinas</option>
              <option value="pesas">Pesas</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>

          <div className="form-group">
            <label className="field-label">Zona / equipamiento</label>
            <select
              className="select"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            >
              {GYM_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="field-label">Vídeo de YouTube (opcional)</label>
            <input
              className="input"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="form-group">
            <label className="field-label">Notas</label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Series, repeticiones, indicaciones..."
            />
          </div>

          <div className="form-group">
            <label className="field-label">Asignar a</label>
            <select
              className="select"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
            >
              <option value="all">Todos los usuarios</option>
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
            {saving ? "Guardando..." : "Crear rutina"}
          </button>
        </form>
      </div>
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
                : "Pronto tu entrenador añadirá retos aquí."}
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
function ProgressSection({ userId }) {
  const [kind, setKind] = useState("peso");
  const [value, setValue] = useState("");
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: false });
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

    const newTotal =
      totalFor(kind) + Number(value);

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
      </div>
    </>
  );
}

/* ============================================================
   USUARIOS (entrenador/a)
============================================================ */
function TrainerUsersPanel() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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

  return (
    <>
      <div className="app-topbar">
        <div>
          <h1>Usuarios</h1>
          <p>Gestiona las cuentas registradas en la app</p>
        </div>
      </div>

      <div className="content-card">
        {loadingUsers && (
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--dark-60)" }}>
            Cargando usuarios...
          </p>
        )}

        {error && <p className="form-message form-message-error">{error}</p>}

        {!loadingUsers && !error && users.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={22} color="#38bdf8" />
            </div>
            <h3>Todavía no hay usuarios registrados</h3>
            <p>Cuando alguien se registre en la app, aparecerá aquí.</p>
          </div>
        )}

        {users.map((u) => (
          <div key={u.id} className="user-row">
            <span className="user-row-email">{u.email}</span>
            <button
              onClick={() => handleDelete(u.id, u.email)}
              disabled={deletingId === u.id}
              className="btn btn-danger-outline btn-sm"
            >
              <Trash2 size={14} />
              {deletingId === u.id ? "..." : "Eliminar"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
