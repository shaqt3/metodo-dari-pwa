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
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { TRAINER_EMAIL } from "@/lib/config";

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const isTrainer = userEmail === TRAINER_EMAIL;

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
      setLoading(false);
    };

    checkSession();
  }, [router]);

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
                  <Flame size={16} color="#38bdf8" />
                </div>
                <div className="stat-value">—</div>
                <div className="stat-label">Racha actual</div>
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
            </div>

            <div className="content-card">
              <h2>Bienvenido a El Método Dari</h2>
              <p>
                Aquí verás tus rutinas, tu progreso y tu perfil a medida que
                tu entrenador vaya añadiendo contenido para ti.
              </p>
            </div>
          </>
        )}

        {activeTab === "rutinas" && (
          <>
            <div className="app-topbar">
              <div>
                <h1>Rutinas</h1>
                <p>Tus planes de entrenamiento</p>
              </div>
            </div>
            <div className="content-card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Dumbbell size={22} color="#38bdf8" />
                </div>
                <h3>Todavía no tienes rutinas asignadas</h3>
                <p>
                  Cuando tu entrenador te asigne una rutina, aparecerá
                  aquí.
                </p>
              </div>
            </div>
          </>
        )}

        {activeTab === "progreso" && (
          <>
            <div className="app-topbar">
              <div>
                <h1>Progreso</h1>
                <p>Tu evolución a lo largo del tiempo</p>
              </div>
            </div>
            <div className="content-card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <TrendingUp size={22} color="#38bdf8" />
                </div>
                <h3>Aún no hay datos de progreso</h3>
                <p>
                  Tu progreso se irá registrando a medida que completes
                  sesiones.
                </p>
              </div>
            </div>
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

        {error && (
          <p className="form-message form-message-error">{error}</p>
        )}

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
