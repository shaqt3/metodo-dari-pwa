'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell, Zap, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <nav className="flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <div className="font-black text-xl tracking-tighter uppercase">El Método Dari</div>
        <button onClick={() => router.push('/login')} className="text-sm font-bold text-slate-500 hover:text-[#38bdf8]">Acceso Privado</button>
      </nav>
      <main className="max-w-4xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="mb-8">
          <img src="/icon-512.png" alt="Logo" className="w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-2xl" />
        </motion.div>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
          Tu mejor versión, <br /><span className="text-[#38bdf8]">sin excusas.</span>
        </motion.h1>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg md:text-xl text-slate-500 max-w-2xl mb-10">
          Entrenamiento personalizado de alto rendimiento. Rutinas adaptadas y resultados garantizados.
        </motion.p>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => router.push('/login')} className="bg-[#0f172a] text-white font-bold py-4 px-10 rounded-full shadow-2xl flex items-center gap-3 text-lg hover:bg-slate-800 transition-all">
          Empezar mi transformación <ArrowRight size={20} />
        </motion.button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full">
          {[
            { icon: Dumbbell, title: "Rutinas a Medida", desc: "Diseñadas para tu nivel." },
            { icon: Zap, title: "Energía Pura", desc: "Motivación constante." },
            { icon: CheckCircle2, title: "Resultados Reales", desc: "Seguimiento técnico." }
          ].map((item, i) => (
            <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 + (i * 0.1) }} className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
              <item.icon className="text-[#38bdf8] mb-4" size={32} />
              <h3 className="font-bold text-xl mb-3">{item.title}</h3>
              <p className="text-slate-500">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
      <footer className="text-center py-10 text-slate-400 text-sm">© 2024 El Método Dari.</footer>
    </div>
  );
}
