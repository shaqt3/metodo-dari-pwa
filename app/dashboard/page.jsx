'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Home, Dumbbell, BarChart3, User, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <h1 className="text-xl font-black text-[#0f172a]">Hola, {user?.email?.split('@')[0]} 👋</h1>
            <p className="text-xs text-slate-500">Tu mejor versión, sin excusas.</p>
          </div>
          <img src="/icon-192.png" alt="Logo" className="w-10 h-10 rounded-full border-2 border-[#38bdf8]" />
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-md mx-auto px-6 pt-8 space-y-6">
        
        {/* Tarjeta de Bienvenida / Resumen */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#0f172a] to-slate-800 rounded-2xl p-6 text-white shadow-lg"
        >
          <h2 className="text-lg font-bold mb-2">Resumen de Hoy</h2>
          <p className="text-slate-300 text-sm mb-4">Tienes 1 rutina pendiente para hoy. ¡A por ella!</p>
          <button className="bg-[#38bdf8] text-[#0f172a] font-bold py-2 px-4 rounded-lg text-sm hover:bg-sky-300 transition-colors w-full">
            Ver Rutina de Hoy
          </button>
        </motion.div>

        {/* Accesos Rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 aspect-square">
            <Dumbbell className="text-[#38bdf8]" size={32} />
            <span className="font-bold text-sm text-[#0f172a]">Mis Rutinas</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 aspect-square">
            <BarChart3 className="text-[#38bdf8]" size={32} />
            <span className="font-bold text-sm text-[#0f172a]">Mi Progreso</span>
          </div>
        </div>

      </main>

      {/* Barra de Navegación Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 z-20">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <NavButton icon={Home} label="Inicio" active />
          <NavButton icon={Dumbbell} label="Rutinas" />
          <NavButton icon={BarChart3} label="Progreso" />
          <NavButton icon={User} label="Perfil" />
        </div>
      </nav>
    </div>
  );
}

// Componente auxiliar para botones de navegación
function NavButton({ icon: Icon, label, active }) {
  return (
    <button className={`flex flex-col items-center gap-1 ${active ? 'text-[#38bdf8]' : 'text-slate-400'}`}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
