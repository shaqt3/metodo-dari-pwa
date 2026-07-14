'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell, CheckCircle2, Zap } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-dari-dark overflow-x-hidden">
      {/* Navbar Simple */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="font-bold text-xl tracking-tighter text-dari-dark">EL MÉTODO DARI</div>
        <button 
          onClick={() => router.push('/login')}
          className="text-sm font-semibold text-slate-500 hover:text-dari-light transition-colors"
        >
          Acceso Clientes
        </button>
      </nav>

      {/* Hero Section con Logo Protagonista */}
      <main className="max-w-5xl mx-auto px-6 pt-8 pb-16 flex flex-col items-center text-center">
        
        {/* Logo Animado */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          className="relative mb-8"
        >
          <img 
            src="/icon-512.png" 
            alt="Logo El Método Dari" 
            className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl"
          />
          {/* Efecto de brillo detrás del logo */}
          <div className="absolute inset-0 bg-dari-light/20 blur-3xl -z-10 rounded-full"></div>
        </motion.div>

        {/* Titular Principal */}
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight"
        >
          Tu mejor versión, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-dari-light to-blue-600">
            sin excusas.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-slate-500 max-w-xl mb-10"
        >
          Entrenamiento personalizado en Basic-Fit Valladolid. Rutinas adaptadas, seguimiento real y resultados garantizados con Dari.
        </motion.p>

        {/* Botón de Acción Principal */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/login')}
          className="bg-dari-dark text-white font-bold py-4 px-8 rounded-full shadow-xl shadow-dari-dark/20 flex items-center gap-3 text-lg hover:bg-slate-800 transition-all"
        >
          Empezar mi transformación
          <ArrowRight size={20} />
        </motion.button>

        {/* Beneficios Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
          {[
            { icon: Dumbbell, title: "Rutinas a Medida", desc: "Diseñadas para tu nivel y objetivos." },
            { icon: Zap, title: "Energía Pura", desc: "Motivación constante y seguimiento weekly." },
            { icon: CheckCircle2, title: "Resultados Reales", desc: "Gráficas de progreso y corrección técnica." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-dari-light/30 transition-colors"
            >
              <item.icon className="text-dari-light mb-4" size={32} />
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="text-center py-8 text-slate-400 text-sm border-t border-slate-100">
        © 2024 El Método Dari. Entrena con propósito.
      </footer>
    </div>
  );
}
