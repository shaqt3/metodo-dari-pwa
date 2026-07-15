"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center"
      >
        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-[#0f172a] shadow-lg">
          <Image
            src="/icon-192.png"
            alt="El Método Dari"
            fill
            className="object-cover"
            priority
          />
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#0f172a]">
          EL MÉTODO DARI
        </h1>

        <p className="mt-2 max-w-xs text-sm text-[#0f172a]/70">
          Entrena con disciplina, mide tu progreso, transforma tu cuerpo.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/login")}
        className="mt-10 w-full max-w-xs rounded-xl bg-[#0f172a] px-6 py-3 text-base font-semibold text-white shadow-md transition hover:opacity-90"
      >
        Comenzar
      </motion.button>
    </main>
  );
}
