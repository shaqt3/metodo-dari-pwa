'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white relative overflow-hidden">
      {/* Fondo decorativo sutil */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-dari-light/10 to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm z-10"
      >
        {/* Logo Cartoon */}
        <div className="flex justify-center mb-8">
          <img 
            src="/icon-512.png" 
            alt="Logo El Método Dari" 
            className="w-32 h-32 object-contain drop-shadow-xl"
          />
        </div>

        {/* Títulos */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-dari-dark tracking-tight mb-2">
            EL MÉTODO <span className="text-dari-light">DARI</span>
          </h1>
          <p className="text-slate-500 text-sm">Tu mejor versión, sin excusas.</p>
        </div>

        {/* Formulario de Acceso Rápido */}
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              type="email" 
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dari-light focus:border-transparent transition-all"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              type="password" 
              placeholder="Contraseña"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-dari-light focus:border-transparent transition-all"
            />
          </div>

          <button className="w-full bg-dari-dark text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-dari-dark/20">
            Entrar al Método
            <ArrowRight size={20} />
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          ¿Aún no tienes acceso? Contacta con Dari.
        </p>
      </motion.div>
    </div>
  );
}
