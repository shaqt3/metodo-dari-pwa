"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Users,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowRight,
  MonitorSmartphone,
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#0f172a]/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="relative overflow-hidden rounded-full border-2 border-[#0f172a]"
              style={{ width: "40px", height: "40px" }}
            >
              <Image
                src="/icon-192.png"
                alt="El Método Dari"
                width={40}
                height={40}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-[#0f172a] sm:text-base">
              EL MÉTODO DARI
            </span>
          </div>

          <button
            onClick={() => router.push("/login")}
            className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:px-5 sm:py-2.5"
          >
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-32 md:grid-cols-2 md:items-center md:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block rounded-full bg-[#38bdf8]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#0369a1]">
            Entrenamiento personal
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-[#0f172a] sm:text-5xl md:text-6xl">
            Transforma tu cuerpo con el método Dari
          </h1>

          <p className="mt-5 max-w-md text-base text-[#0f172a]/70 sm:text-lg">
            Rutinas a tu medida, seguimiento real y la disciplina que
            necesitas para conseguir resultados que se noten de verdad.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:opacity-90"
            >
              Comenzar ahora
              <ArrowRight size={18} />
            </motion.button>

            <motion.a
              whileTap={{ scale: 0.95 }}
              href="#modalidades"
              className="flex items-center gap-2 rounded-xl border border-[#0f172a]/20 px-6 py-3.5 text-base font-semibold text-[#0f172a] transition hover:bg-[#0f172a]/5"
            >
              Ver modalidades
            </motion.a>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-[#0f172a]/10 pt-8">
            <div>
              <p className="text-2xl font-extrabold text-[#0f172a]">+500</p>
              <p className="text-xs text-[#0f172a]/60">Alumnos</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#0f172a]">4.9/5</p>
              <p className="text-xs text-[#0f172a]/60">Valoración</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#0f172a]">+8</p>
              <p className="text-xs text-[#0f172a]/60">Años exp.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative flex items-center justify-center"
        >
          <div className="absolute h-64 w-64 rounded-full bg-[#38bdf8]/15 sm:h-80 sm:w-80" />
          <div
            className="relative overflow-hidden rounded-3xl border-4 border-[#0f172a] bg-white shadow-xl"
            style={{ width: "280px", height: "280px" }}
          >
            <Image
              src="/icon-192.png"
              alt="El Método Dari"
              width={280}
              height={280}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </motion.div>
      </section>

      {/* BENEFICIOS */}
      <section className="bg-[#0f172a] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-extrabold text-white sm:text-3xl">
            Mucho más que un entrenador
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/60 sm:text-base">
            Un método pensado para que entrenar deje de ser una lucha y se
            convierta en un hábito que disfrutas.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Dumbbell,
                title: "Rutinas a tu medida",
                desc: "Planes de entrenamiento adaptados a tu nivel y objetivo.",
              },
              {
                icon: Users,
                title: "Acompañamiento real",
                desc: "Seguimiento cercano en cada sesión, no estás solo.",
              },
              {
                icon: TrendingUp,
                title: "Progreso medible",
                desc: "Datos y métricas claras de tu evolución semana a semana.",
              },
              {
                icon: Award,
                title: "Resultados reales",
                desc: "Sin promesas vacías: cambios físicos que se sostienen.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white/5 p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#38bdf8]/20">
                  <Icon size={22} color="#38bdf8" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-white/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODALIDADES */}
      <section id="modalidades" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-2xl font-extrabold text-[#0f172a] sm:text-3xl">
          Elige tu modalidad
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#0f172a]/60 sm:text-base">
          Dos formas de entrenar con el mismo objetivo: tu mejor versión.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-[#0f172a]/10 p-8 transition hover:border-[#0f172a]/30">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f172a]">
              <Dumbbell size={20} color="#ffffff" />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a]">Presencial</h3>
            <p className="mt-2 text-sm text-[#0f172a]/60">
              Sesiones cara a cara con corrección técnica y máxima
              supervisión en cada ejercicio.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                "Sesiones individuales o en grupos reducidos",
                "Corrección técnica en tiempo real",
                "Horarios flexibles",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-[#0f172a]/70"
                >
                  <CheckCircle2
                    size={16}
                    color="#38bdf8"
                    className="mt-0.5 shrink-0"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#0f172a]/10 p-8 transition hover:border-[#0f172a]/30">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f172a]">
              <MonitorSmartphone size={20} color="#ffffff" />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a]">Online</h3>
            <p className="mt-2 text-sm text-[#0f172a]/60">
              Entrena donde quieras con seguimiento continuo desde la app y
              ajustes semanales a tu plan.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                "Rutinas actualizadas cada semana",
                "Seguimiento de progreso en la app",
                "Contacto directo con tu entrenador",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-[#0f172a]/70"
                >
                  <CheckCircle2
                    size={16}
                    color="#38bdf8"
                    className="mt-0.5 shrink-0"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl rounded-3xl bg-[#38bdf8] px-8 py-14 text-center sm:py-16">
          <h2 className="text-2xl font-extrabold text-[#0f172a] sm:text-3xl">
            Tu cambio empieza hoy
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#0f172a]/80 sm:text-base">
            No esperes más para entrenar con un método que se adapta a ti.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/login")}
            className="mt-8 rounded-xl bg-[#0f172a] px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:opacity-90"
          >
            Comenzar ahora
          </motion.button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#0f172a]/10 px-6 py-8">
        <p className="text-center text-xs text-[#0f172a]/50">
          © {new Date().getFullYear()} El Método Dari. Todos los derechos
          reservados.
        </p>
      </footer>
    </main>
  );
}
