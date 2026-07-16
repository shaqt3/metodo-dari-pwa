"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasSession(!!session);
      setChecking(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setHasSession(!!session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  if (checking) {
    return (
      <main className="loading-screen">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="page-center">
        <div className="auth-card text-center">
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
            Enlace no válido
          </h1>
          <p style={{ fontSize: 14, color: "var(--dark-60)", marginBottom: 24 }}>
            Este enlace de recuperación no es válido o ha caducado. Solicita
            uno nuevo desde la pantalla de inicio de sesión.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="btn btn-primary btn-block"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
      >
        <div className="auth-header">
          <h1>Nueva contraseña</h1>
          <p>Elige una contraseña nueva para tu cuenta</p>
        </div>

        {success ? (
          <p className="form-message form-message-info">
            Contraseña actualizada. Te llevamos a tu panel...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="password"
                required
                minLength={6}
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                required
                minLength={6}
                placeholder="Confirma la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
              />
            </div>

            {error && (
              <p className="form-message form-message-error">{error}</p>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block"
            >
              {loading ? "Guardando..." : "Guardar contraseña"}
            </motion.button>
          </form>
        )}
      </motion.div>
    </main>
  );
}
