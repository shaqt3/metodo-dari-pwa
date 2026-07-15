"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Dumbbell, TrendingUp, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

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
    { id: "perfil", label: "Perfil", icon: User },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-white pb-24">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-extrabold text-[#0f172a]">
          ¡Hola de nuevo!
        </h1>
        <p className="mt-2 text-sm text-[#0f172a]/70">{userEmail}</p>
        <p className="mt-6 max-w-xs text-sm text-[#0f172a]/60">
          Bienvenido a tu panel de El Método Dari. Aquí verás tus rutinas,
          progreso y perfil.
        </p>
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
