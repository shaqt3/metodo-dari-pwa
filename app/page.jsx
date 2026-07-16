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
    <main>
      {/* NAVBAR */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <div className="navbar-logo">
              <Image
                src="/icon-192.png"
                alt="El Método Dari"
                width={42}
                height={42}
                priority
              />
            </div>
            <span className="navbar-title">EL MÉTODO DARI</span>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => router.push("/login")}>
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="eyebrow">Entrenamiento personal</span>

          <h1>Transforma tu cuerpo con el método Dari</h1>

          <p>
            Rutinas a tu medida, seguimiento cercano y la disciplina que
            necesitas para conseguir resultados que se noten de verdad.
          </p>

          <div className="hero-actions">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="btn btn-primary"
              onClick={() => router.push("/login")}
            >
              Comenzar ahora
              <ArrowRight size={18} />
            </motion.button>

            <a href="#modalidades" className="btn btn-outline">
              Ver modalidades
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="hero-visual"
        >
          <div className="hero-blob" />
          <div className="hero-photo">
            <Image
              src="/icon-192.png"
              alt="El Método Dari"
              width={280}
              height={280}
              priority
            />
          </div>
        </motion.div>
      </section>

      {/* BENEFICIOS */}
      <section className="section section-dark">
        <h2 className="section-title">Mucho más que un entrenador</h2>
        <p className="section-subtitle">
          Un método pensado para que entrenar deje de ser una lucha y se
          convierta en un hábito que disfrutas.
        </p>

        <div className="feature-grid">
          {[
            {
              icon: Dumbbell,
              title: "Rutinas a tu medida",
              desc: "Planes de entrenamiento adaptados a tu nivel y a tu objetivo.",
            },
            {
              icon: Users,
              title: "Acompañamiento real",
              desc: "Seguimiento cercano en cada sesión, no estás solo en esto.",
            },
            {
              icon: TrendingUp,
              title: "Progreso medible",
              desc: "Sigue tu evolución de forma clara, sesión a sesión.",
            },
            {
              icon: Award,
              title: "Resultados reales",
              desc: "Sin promesas vacías: cambios físicos que se sostienen.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon">
                <Icon size={22} color="#38bdf8" />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODALIDADES */}
      <section id="modalidades" className="section">
        <h2 className="section-title">Elige tu modalidad</h2>
        <p className="section-subtitle">
          Dos formas de entrenar con el mismo objetivo: tu mejor versión.
        </p>

        <div className="modalities-grid">
          <div className="modality-card">
            <div className="modality-icon">
              <Dumbbell size={20} color="#ffffff" />
            </div>
            <h3>Presencial</h3>
            <p>
              Sesiones cara a cara con corrección técnica y supervisión
              directa en cada ejercicio.
            </p>
            <ul className="modality-list">
              {[
                "Sesiones individuales o en grupos reducidos",
                "Corrección técnica en tiempo real",
                "Horarios flexibles",
              ].map((item) => (
                <li key={item}>
                  <CheckCircle2 size={16} color="#38bdf8" style={{ marginTop: 2, flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="modality-card">
            <div className="modality-icon">
              <MonitorSmartphone size={20} color="#ffffff" />
            </div>
            <h3>Online</h3>
            <p>
              Entrena donde quieras con seguimiento continuo desde la app y
              ajustes a tu plan.
            </p>
            <ul className="modality-list">
              {[
                "Rutinas actualizadas periódicamente",
                "Seguimiento de tu progreso en la app",
                "Contacto directo con tu entrenador",
              ].map((item) => (
                <li key={item}>
                  <CheckCircle2 size={16} color="#38bdf8" style={{ marginTop: 2, flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="cta-banner">
          <h2>Tu cambio empieza hoy</h2>
          <p>No esperes más para entrenar con un método que se adapta a ti.</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="btn btn-accent"
            onClick={() => router.push("/login")}
          >
            Comenzar ahora
          </motion.button>
        </div>
      </section>

      <footer className="site-footer">
        © {new Date().getFullYear()} El Método Dari. Todos los derechos reservados.
      </footer>
    </main>
  );
}
