"use client";

import { useEffect, useRef, useState } from "react";
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
  Sun,
  Moon,
  MonitorSmartphone,
  Eye,
  MessageCircle,
  Megaphone,
  MoreHorizontal,
  ClipboardCheck,
  Wallet,
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
import ProgressPhotos from "./components/ProgressPhotos";
import MessagesPage from "./components/Messages";
import Checkins from "./components/Checkins";
import Announcements, { showLocalNotification } from "./components/Announcements";
import { MemberPayments, currentPeriod } from "./components/Payments";
import { confirmDelete, Modal } from "./components/ui";
import { fetchMembers, displayName } from "@/lib/data";

const THEME_KEY = "dari-theme";

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "auto";
  } catch {
    return "auto";
  }
}

function ThemeSwitch({ theme, onChange }) {
  const opts = [
    { id: "light", label: "Claro", icon: Sun },
    { id: "dark", label: "Oscuro", icon: Moon },
    { id: "auto", label: "Auto", icon: MonitorSmartphone },
  ];
  return (
    <div className="theme-switch" role="group" aria-label="Tema">
      {opts.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" className={theme === id ? "active" : ""} onClick={() => onChange(id)}>
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );
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
  const [theme, setTheme] = useState("auto");
  const [systemDark, setSystemDark] = useState(false);
  const [preview, setPreview] = useState(null); // socio que la entrenadora está "viendo como"
  const [showPicker, setShowPicker] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [badges, setBadges] = useState({ mensajes: 0, avisos: 0 });
  const lastBadges = useRef(null);
  const realIsTrainer = TRAINER_EMAILS.includes(userEmail);

  // En "Ver como socio" la app se comporta como si fuera ese socio
  const isTrainer = realIsTrainer && !preview;
  const viewUserId = preview ? preview.id : userId;
  const viewEmail = preview ? preview.email : userEmail;

  useEffect(() => {
    setTheme(readTheme());
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setSystemDark(mq.matches);
      const onChange = (e) => setSystemDark(e.matches);
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }
  }, []);

  const changeTheme = (t) => {
    setTheme(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  };
  const isDark = theme === "dark" || (theme === "auto" && systemDark);

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
    if (!viewUserId) return;
    const loadStreak = async () => {
      const [{ data }, { data: sets }] = await Promise.all([
        supabase.from("workout_logs").select("log_date").eq("user_id", viewUserId),
        supabase.from("set_logs").select("log_date").eq("user_id", viewUserId),
      ]);
      const dates = [...(data || []), ...(sets || [])].map((d) => d.log_date);
      setStreak(computeStreak(dates));
      setGapDays(gapDaysSinceLastLog(dates));
    };
    loadStreak();
  }, [viewUserId, activeTab]);

  // Registra el service worker (instalar la app y notificaciones)
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/dari-sw.js").catch(() => {});
    }
  }, []);

  // Mensajes sin leer y avisos nuevos (se revisa cada 30 segundos)
  useEffect(() => {
    if (!userId) return;
    const check = async () => {
      let mq = supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .is("read_at", null)
        .neq("sender_id", userId);
      if (!realIsTrainer) mq = mq.eq("member_id", userId);
      const { count: unreadMsgs, error: mErr } = await mq;

      let newAvisos = 0;
      if (!realIsTrainer) {
        const { data: prof } = await supabase.from("profiles").select("last_seen_announcements").eq("id", userId).maybeSingle();
        let aq = supabase.from("announcements").select("id", { count: "exact", head: true });
        if (prof?.last_seen_announcements) aq = aq.gt("created_at", prof.last_seen_announcements);
        const { count } = await aq;
        newAvisos = count || 0;
      }
      if (mErr) return; // V8 sin ejecutar todavía
      const next = { mensajes: unreadMsgs || 0, avisos: newAvisos };
      const prev = lastBadges.current;
      if (prev && document.visibilityState !== "visible") {
        if (next.mensajes > prev.mensajes) showLocalNotification("Nuevo mensaje", "Tienes un mensaje nuevo en El Método Dari");
        if (next.avisos > prev.avisos) showLocalNotification("Nuevo aviso", "Tu entrenadora ha publicado un aviso");
      }
      lastBadges.current = next;
      setBadges(next);
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [userId, realIsTrainer, activeTab]);

  if (loading) {
    return (
      <main className="loading-screen">
        <p>Cargando...</p>
      </main>
    );
  }

  // main = aparece en la barra de abajo del móvil; el resto va en "Más"
  const navItems = isTrainer
    ? [
        { id: "home", label: "Inicio", icon: Home, main: true },
        { id: "socios", label: "Socios", icon: Users, main: true },
        { id: "rutinas", label: "Rutinas", icon: Calendar, main: true },
        { id: "mensajes", label: "Mensajes", icon: MessageCircle, main: true, badge: badges.mensajes },
        { id: "alimentacion", label: "Alimentación", icon: Utensils },
        { id: "ejercicios", label: "Ejercicios", icon: Dumbbell },
        { id: "retos", label: "Retos", icon: Trophy },
        { id: "avisos", label: "Avisos", icon: Megaphone },
        { id: "perfil", label: "Perfil", icon: User },
      ]
    : [
        { id: "home", label: "Inicio", icon: Home, main: true },
        { id: "rutinas", label: "Rutinas", icon: Calendar, main: true },
        { id: "alimentacion", label: "Dieta", icon: Utensils, main: true },
        { id: "progreso", label: "Progreso", icon: TrendingUp, main: true },
        { id: "mensajes", label: "Mensajes", icon: MessageCircle, badge: preview ? 0 : badges.mensajes },
        { id: "avisos", label: "Avisos", icon: Megaphone, badge: preview ? 0 : badges.avisos },
        { id: "retos", label: "Retos", icon: Trophy },
        { id: "ejercicios", label: "Ejercicios", icon: Dumbbell },
        { id: "perfil", label: "Perfil", icon: User },
      ];
  const mainNav = navItems.filter((n) => n.main);
  const moreNav = navItems.filter((n) => !n.main);
  const moreBadge = moreNav.reduce((s, n) => s + (n.badge || 0), 0);
  const moreActive = moreNav.some((n) => n.id === activeTab);

  const initial = viewEmail ? viewEmail.charAt(0).toUpperCase() : "?";

  const startPreview = (member) => {
    setPreview(member);
    setShowPicker(false);
    setActiveTab("home");
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const stopPreview = () => {
    setPreview(null);
    setActiveTab("socios");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const goTo = (tab) => {
    setShowMore(false);
    setActiveTab(tab);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`app-shell ${isDark ? "theme-dark" : ""}`}>
      {/* SIDEBAR (ordenador) */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <Image src="/icon-192.png" alt="El Método Dari" width={34} height={34} />
          </div>
          <span>EL MÉTODO DARI</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => goTo(id)} className={`sidebar-link ${activeTab === id ? "active" : ""}`}>
              <Icon size={18} />
              {label}
              {badge > 0 && <span className="count-badge">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-theme">
            <ThemeSwitch theme={theme} onChange={changeTheme} />
          </div>
          {realIsTrainer && !preview && (
            <button onClick={() => setShowPicker(true)} className="sidebar-link">
              <Eye size={18} />
              Ver como socio
            </button>
          )}
          {isTrainer && <div className="admin-pill">Modo entrenadora</div>}
          <button onClick={handleLogout} className="sidebar-link">
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="app-main" key={viewUserId}>
        {preview && (
          <div className="preview-banner">
            <span>
              <Eye size={15} style={{ verticalAlign: "-2px" }} /> Estás viendo la app como{" "}
              <strong>{displayName(preview)}</strong>. Lo que guardes aquí se guarda en su cuenta.
            </span>
            <button onClick={stopPreview}>Volver a modo entrenadora</button>
          </div>
        )}

        {activeTab === "home" &&
          (isTrainer ? (
            <TrainerHome email={viewEmail} initial={initial} goTo={goTo} userId={userId} />
          ) : (
            <MemberHome
              userId={viewUserId}
              email={viewEmail}
              initial={initial}
              streak={streak}
              gapDays={gapDays}
              onRestLogged={() => setGapDays(0)}
              goTo={goTo}
            />
          ))}

        {activeTab === "socios" && isTrainer && <Members onOpenTab={goTo} onPreview={startPreview} myId={userId} />}

        {activeTab === "ejercicios" && <ExerciseLibrary isTrainer={isTrainer} />}

        {activeTab === "rutinas" && <RoutineBuilder userId={viewUserId} isTrainer={isTrainer} />}

        {activeTab === "alimentacion" && <Nutrition userId={viewUserId} isTrainer={isTrainer} />}

        {activeTab === "retos" && (
          <>
            {!isTrainer && gapDays >= 2 && <RestChallengeBanner userId={viewUserId} onLogged={() => setGapDays(0)} />}
            <Challenges userId={viewUserId} isTrainer={isTrainer} />
          </>
        )}

        {activeTab === "progreso" && (
          <>
            {gapDays >= 2 && <RestChallengeBanner userId={viewUserId} onLogged={() => setGapDays(0)} />}
            <ProgressSection userId={viewUserId} streak={streak} />
            <Checkins userId={viewUserId} isTrainer={false} />
            <ProgressPhotos userId={viewUserId} title="Mis fotos de progreso" />
          </>
        )}

        {activeTab === "mensajes" && <MessagesPage userId={viewUserId} isTrainer={isTrainer} />}

        {activeTab === "avisos" && <Announcements userId={viewUserId} isTrainer={isTrainer} />}

        {activeTab === "perfil" && (
          <>
            <div className="app-topbar">
              <div>
                <h1>Perfil</h1>
                <p>{viewEmail}</p>
              </div>
            </div>
            <div className="content-card">
              <h2 style={{ marginBottom: 14 }}>Mis datos</h2>
              <ProfileForm userId={viewUserId} email={viewEmail} />
            </div>
            {!isTrainer && (
              <div className="content-card">
                <h2 style={{ marginBottom: 12 }}>Mis pagos</h2>
                <MemberPayments member={{ id: viewUserId }} isTrainer={false} />
              </div>
            )}
            <div className="content-card">
              <h2 style={{ marginBottom: 12 }}>Apariencia</h2>
              <ThemeSwitch theme={theme} onChange={changeTheme} />
              <p style={{ fontSize: 12, color: "var(--dark-60)", marginTop: 10 }}>
                "Auto" usa el mismo modo que tu móvil u ordenador.
              </p>
            </div>
            {realIsTrainer && !preview && (
              <div className="content-card">
                <h2 style={{ marginBottom: 6 }}>Ver la app como un socio</h2>
                <p style={{ fontSize: 13, color: "var(--dark-60)", marginBottom: 12 }}>
                  Comprueba exactamente lo que ve un socio: su rutina, su dieta y sus retos.
                </p>
                <button className="btn btn-outline btn-sm" onClick={() => setShowPicker(true)}>
                  <Eye size={15} /> Elegir socio
                </button>
              </div>
            )}
            <div className="content-card">
              <button onClick={handleLogout} className="btn btn-outline">
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </main>

      {showPicker && <PreviewPicker onPick={startPreview} onClose={() => setShowPicker(false)} />}

      {/* BARRA INFERIOR (móvil) */}
      <nav className="bottom-nav">
        {mainNav.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => goTo(id)} className={`bottom-nav-item ${activeTab === id ? "active" : ""}`}>
            <span className="nav-icon-wrap">
              <Icon size={20} />
              {badge > 0 && <span className="nav-dot">{badge}</span>}
            </span>
            <span>{label}</span>
          </button>
        ))}
        <button onClick={() => setShowMore(!showMore)} className={`bottom-nav-item ${moreActive || showMore ? "active" : ""}`}>
          <span className="nav-icon-wrap">
            <MoreHorizontal size={20} />
            {moreBadge > 0 && <span className="nav-dot">{moreBadge}</span>}
          </span>
          <span>Más</span>
        </button>
      </nav>

      {showMore && (
        <div className="more-sheet-overlay" onClick={() => setShowMore(false)}>
          <div className="more-sheet" onClick={(e) => e.stopPropagation()}>
            {moreNav.map(({ id, label, icon: Icon, badge }) => (
              <button key={id} onClick={() => goTo(id)} className={`more-sheet-item ${activeTab === id ? "active" : ""}`}>
                <Icon size={22} />
                <span>{label}</span>
                {badge > 0 && <span className="count-badge">{badge}</span>}
              </button>
            ))}
            {realIsTrainer && !preview && (
              <button onClick={() => { setShowMore(false); setShowPicker(true); }} className="more-sheet-item">
                <Eye size={22} />
                <span>Ver como socio</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   INICIO — ENTRENADORA
============================================================ */
function TrainerHome({ email, initial, goTo, userId }) {
  const [counts, setCounts] = useState({});
  const [pending, setPending] = useState(null);

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

      // Tareas pendientes (si V8 no está instalado, se queda en blanco)
      const [{ count: checkins }, { count: unread }, { data: paid }, { data: profs }] = await Promise.all([
        supabase.from("checkins").select("id", { count: "exact", head: true }).is("trainer_reply", null),
        supabase.from("messages").select("id", { count: "exact", head: true }).is("read_at", null).neq("sender_id", userId),
        supabase.from("payments").select("user_id").eq("period", currentPeriod()),
        supabase.from("profiles").select("id, email, active, monthly_fee"),
      ]);
      const paidIds = new Set((paid || []).map((p) => p.user_id));
      const unpaid = (profs || []).filter(
        (p) => p.active !== false && p.monthly_fee && !TRAINER_EMAILS.includes(p.email) && !paidIds.has(p.id)
      ).length;
      setPending({ checkins: checkins || 0, unread: unread || 0, unpaid });
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

      {pending && (pending.checkins > 0 || pending.unread > 0 || pending.unpaid > 0) && (
        <div className="content-card">
          <h2 style={{ marginBottom: 10 }}>Pendiente</h2>
          <div className="pending-list">
            {pending.unread > 0 && (
              <button className="pending-item" onClick={() => goTo("mensajes")}>
                <MessageCircle size={18} /> {pending.unread} {pending.unread === 1 ? "mensaje sin leer" : "mensajes sin leer"}
              </button>
            )}
            {pending.checkins > 0 && (
              <button className="pending-item" onClick={() => goTo("socios")}>
                <ClipboardCheck size={18} /> {pending.checkins}{" "}
                {pending.checkins === 1 ? "revisión semanal sin responder" : "revisiones semanales sin responder"}
                <span className="pending-hint">(en la ficha del socio → Revisiones)</span>
              </button>
            )}
            {pending.unpaid > 0 && (
              <button className="pending-item" onClick={() => goTo("socios")}>
                <Wallet size={18} /> {pending.unpaid} {pending.unpaid === 1 ? "socio no ha pagado" : "socios no han pagado"} este mes
                <span className="pending-hint">(Socios → Cuotas del mes)</span>
              </button>
            )}
          </div>
        </div>
      )}

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
          <button className="quick-action" onClick={() => goTo("avisos")}>
            <Megaphone size={20} />
            <span>Enviar un aviso a los socios</span>
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
      const [{ data: profile }, { data: routines }, { count: done }, { data: avisos }, { data: lastCheckin }] = await Promise.all([
        supabase.from("profiles").select("full_name, goal").eq("id", userId).maybeSingle(),
        supabase.from("routines").select("id, title, user_id").order("created_at", { ascending: false }),
        supabase.from("challenge_submissions").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("checkins").select("checkin_date").eq("user_id", userId).order("checkin_date", { ascending: false }).limit(1),
      ]);
      const aviso = (avisos || []).find((a) => a.user_id === null || a.user_id === userId) || null;
      const lastCk = (lastCheckin || [])[0]?.checkin_date;
      const checkinDue = !lastCk || (Date.now() - new Date(lastCk).getTime()) / 86400000 >= 6;
      const visibleRoutines = (routines || []).filter((r) => r.user_id === null || r.user_id === userId);
      const routine = visibleRoutines.find((r) => r.user_id === userId) || visibleRoutines[0];

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
      setInfo({ profile, routine, next, done: done || 0, aviso, checkinDue });
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

      {info.aviso && (
        <button className="content-card announcement-home" onClick={() => goTo("avisos")}>
          <Megaphone size={18} />
          <div>
            <strong>{info.aviso.title}</strong>
            {info.aviso.body && <p>{info.aviso.body}</p>}
          </div>
        </button>
      )}

      {info.checkinDue && (
        <div className="content-card">
          <h2 style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ClipboardCheck size={18} /> Toca tu revisión semanal
          </h2>
          <p>5 preguntas rápidas para que tu entrenadora ajuste tu plan.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => goTo("progreso")}>
            Hacer revisión
          </button>
        </div>
      )}

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

/* ============================================================
   ELEGIR SOCIO PARA "VER COMO SOCIO"
============================================================ */
function PreviewPicker({ onPick, onClose }) {
  const [members, setMembers] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchMembers()
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);

  const q = query.trim().toLowerCase();
  const list = (members || []).filter(
    (m) => !q || [m.full_name, m.email].some((x) => (x || "").toLowerCase().includes(q))
  );

  return (
    <Modal title="Ver la app como..." onClose={onClose}>
      <input
        className="input"
        placeholder="Buscar socio..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      {members === null && <p style={{ fontSize: 13 }}>Cargando...</p>}
      {members && list.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--dark-60)" }}>No hay socios todavía.</p>
      )}
      <div className="member-list">
        {list.map((m) => (
          <button key={m.id} className="member-card" onClick={() => onPick(m)}>
            <div className="avatar-chip">{displayName(m).charAt(0).toUpperCase()}</div>
            <div className="member-card-body">
              <div className="member-card-name">{displayName(m)}</div>
              <div className="member-card-meta">{m.email}</div>
            </div>
            <Eye size={18} color="var(--dark-50)" />
          </button>
        ))}
      </div>
    </Modal>
  );
}
