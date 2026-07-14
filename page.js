'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Consulta de prueba (ajusta 'metodo_dari_items' al nombre real de tu tabla)
        const { data, error } = await supabase.from('metodo_dari_items').select('*');
        if (error) throw error;
        setData(data);
      } catch (error) {
        console.error('Error al obtener datos:', error.message);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#0f172a] text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-[#38bdf8] bg-opacity-20">
            <BookOpen size={48} className="text-[#38bdf8]" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight text-[#38bdf8]">
          El Método Dari
        </h1>
        
        <p className="text-xl text-gray-300 leading-relaxed">
          Bienvenido a la aplicación PWA oficial. Diseñada para optimizar tu flujo de trabajo con la máxima eficiencia y elegancia.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-xl border border-[#38bdf8] border-opacity-30 bg-[#0f172a] bg-opacity-50"
          >
            <CheckCircle className="mx-auto mb-4 text-[#38bdf8]" size={32} />
            <h3 className="text-lg font-semibold mb-2 text-[#38bdf8]">Eficiencia</h3>
            <p className="text-sm text-gray-400">Procesos optimizados para ahorrar tiempo.</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-xl border border-[#38bdf8] border-opacity-30 bg-[#0f172a] bg-opacity-50"
          >
            <Star className="mx-auto mb-4 text-[#38bdf8]" size={32} />
            <h3 className="text-lg font-semibold mb-2 text-[#38bdf8]">Calidad</h3>
            <p className="text-sm text-gray-400">Estándares altos en cada funcionalidad.</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-xl border border-[#38bdf8] border-opacity-30 bg-[#0f172a] bg-opacity-50"
          >
            <BookOpen className="mx-auto mb-4 text-[#38bdf8]" size={32} />
            <h3 className="text-lg font-semibold mb-2 text-[#38bdf8]">Aprendizaje</h3>
            <p className="text-sm text-gray-400">Recursos estructurados para tu crecimiento.</p>
          </motion.div>
        </div>

        {data && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 p-4 rounded-lg bg-[#38bdf8] bg-opacity-10 border border-[#38bdf8] border-opacity-30"
          >
            <p className="text-[#38bdf8] font-medium">
              Datos cargados desde Supabase: {data.length} registros encontrados.
            </p>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}