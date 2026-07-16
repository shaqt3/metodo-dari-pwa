"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "login") {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      setLoading(false);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data?.session) {
        router.push("/dashboard");
      }
      return;
    }

    if (mode === "register") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data?.session) {
        router.push("/dashboard");
        return;
      }

      setInfo("Cuenta creada. Revisa tu correo para confirmar el acceso.");
      setMode("login");
      return;
    }

    if (mode === "forgot") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      setLoading(false);

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setInfo(
        "Te hemos enviado un correo con el enlace para cambiar tu contraseña."
      );
      setMode("login");
    }
  };

  return (
    <main className="page-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
      >
        <div className="auth-header">
          <div className="auth-logo">
            <Image src="/icon-192.png" alt="El Método Dari" width={56} height={56} />
          </div>
          <h1>
            {mode === "login" && "Iniciar Sesión"}
            {mode === "register" && "Crear cuenta"}
            {mode === "forgot" && "Recuperar contraseña"}
          </h1>
          <p>
            {mode === "login" && "Accede a tu método de entrenamiento"}
            {mode === "register" && "Regístrate para empezar a entrenar"}
            {mode === "forgot" &&
              "Te enviaremos un enlace a tu correo para restablecerla"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              required
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          {mode !== "forgot" && (
            <div className="form-group">
              <input
                type="password"
                required
                minLength={6}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>
          )}

          {mode === "login" && (
            <div className="form-link-row">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setInfo("");
                  setMode("forgot");
                }}
                className="link-btn"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {error && <p className="form-message form-message-error">{error}</p>}
          {info && <p className="form-message form-message-info">{info}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading && "Un momento..."}
            {!loading && mode === "login" && "Ingresar"}
            {!loading && mode === "register" && "Crear cuenta"}
            {!loading && mode === "forgot" && "Enviar enlace"}
          </motion.button>
        </form>

        {mode !== "forgot" && (
          <div className="form-switch">
            <button
              type="button"
              onClick={() => {
                setError("");
                setInfo("");
                setMode(mode === "login" ? "register" : "login");
              }}
              className="link-btn"
            >
              {mode === "login"
                ? "¿No tienes cuenta? Crea una"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        )}

        {mode === "forgot" && (
          <div className="form-switch">
            <button
              type="button"
              onClick={() => {
                setError("");
                setInfo("");
                setMode("login");
              }}
              className="link-btn"
            >
              Volver a iniciar sesión
            </button>
          </div>
        )}
      </motion.div>
    </main>
  );
}
