"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Dumbbell, TrendingUp, User, Users, Trash2 } from "lucide-react";
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
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#0f172a]/70">Cargando...</p>
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

  return (
    <main className="flex min-h-screen flex-col bg-white pb-24">
      <div className="flex-1 px-6 pt-16">
        {activeTab === "home" && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-extrabold text-[#0f172a]">
              ¡Hola de nuevo!
            </h1>
            <p className="mt-2 text-sm text-[#0f172a]/70">{userEmail}</p>
            <p className="mt-6 max-w-xs text-sm text-[#0f172a]/60">
              Bienvenido a tu panel de El Método Dari. Aquí verás tus
              rutinas, progreso y perfil.
            </p>
          </div>
        )}

        {activeTab === "rutinas" && (
          <PlaceholderSection title="Rutinas" />
        )}

        {activeTab === "progreso" && (
          <PlaceholderSection title="Progreso" />
        )}

        {activeTab === "usuarios" && isTrainer && <TrainerUsersPanel />}

        {activeTab === "perfil" && (
          <div className="mx-auto max-w-sm pt-8">
            <h2 className="text-lg font-bold text-[#0f172a]">Perfil</h2>
            <p className="mt-1 text-sm text-[#0f172a]/60">{userEmail}</p>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="mt-8 w-full rounded-xl border border-[#0f172a]/20 px-6 py-3 text-sm font-semibold text-[#0f172a] transition hover:bg-[#0f172a]/5"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t border-[#0f172a]/10 bg-white py-3">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex flex-col items-center gap-1 px-3"
            >
              <Icon
                size={22}
                color={isActive ? "#38bdf8" : "#0f172a"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className="text-xs font-medium"
                style={{ color: isActive ? "#38bdf8" : "#0f172a" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function PlaceholderSection({ title }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h2 className="text-lg font-bold text-[#0f172a]">{title}</h2>
      <p className="mt-2 max-w-xs text-sm text-[#0f172a]/60">
        Próximamente disponible.
      </p>
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
    <div className="mx-auto max-w-md pt-8">
      <h2 className="text-lg font-bold text-[#0f172a]">Usuarios</h2>
      <p className="mt-1 text-sm text-[#0f172a]/60">
        Gestiona las cuentas registradas en la app.
      </p>

      {loadingUsers && (
        <p className="mt-8 text-center text-sm text-[#0f172a]/50">
          Cargando usuarios...
        </p>
      )}

      {error && (
        <p className="mt-8 text-center text-sm text-red-500">{error}</p>
      )}

      {!loadingUsers && !error && users.length === 0 && (
        <p className="mt-8 text-center text-sm text-[#0f172a]/50">
          Todavía no hay usuarios registrados.
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between rounded-xl border border-[#0f172a]/10 px-4 py-3"
          >
            <span className="truncate text-sm text-[#0f172a]">
              {u.email}
            </span>
            <button
              onClick={() => handleDelete(u.id, u.email)}
              disabled={deletingId === u.id}
              className="ml-3 flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deletingId === u.id ? "..." : "Eliminar"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
