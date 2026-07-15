"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

      // Si Supabase tiene activada la confirmación por email, no habrá
      // sesión todavía: avisamos al usuario para que revise su correo.
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

      setInfo("Te hemos enviado un correo con el enlace para cambiar tu contraseña.");
      setMode("login");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xs"
      >
        <h1 className="mb-1 text-center text-2xl font-extrabold text-[#0f172a]">
          {mode === "login" && "Iniciar Sesión"}
          {mode === "register" && "Crear cuenta"}
          {mode === "forgot" && "Recuperar contraseña"}
        </h1>
        <p className="mb-8 text-center text-sm text-[#0f172a]/70">
          {mode === "login" && "Accede a tu método de entrenamiento"}
          {mode === "register" && "Regístrate para empezar a entrenar"}
          {mode === "forgot" &&
            "Te enviaremos un enlace a tu correo para restablecerla"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[#0f172a]/20 px-4 py-3 text-sm text-[#0f172a] outline-none focus:border-[#38bdf8]"
          />

          {mode !== "forgot" && (
            <input
              type="password"
              required
              minLength={6}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#0f172a]/20 px-4 py-3 text-sm text-[#0f172a] outline-none focus:border-[#38bdf8]"
            />
          )}

          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setInfo("");
                setMode("forgot");
              }}
              className="-mt-2 text-right text-xs text-[#0f172a]/60 underline underline-offset-2"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}
          {info && (
            <p className="text-center text-sm text-[#0369a1]">{info}</p>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#0f172a] px-6 py-3 text-base font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
          >
            {loading && "Un momento..."}
            {!loading && mode === "login" && "Ingresar"}
            {!loading && mode === "register" && "Crear cuenta"}
            {!loading && mode === "forgot" && "Enviar enlace"}
          </motion.button>
        </form>

        {mode !== "forgot" && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setInfo("");
              setMode(mode === "login" ? "register" : "login");
            }}
            className="mt-6 w-full text-center text-sm text-[#0f172a]/70 underline underline-offset-2"
          >
            {mode === "login"
              ? "¿No tienes cuenta? Crea una"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        )}

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setInfo("");
              setMode("login");
            }}
            className="mt-6 w-full text-center text-sm text-[#0f172a]/70 underline underline-offset-2"
          >
            Volver a iniciar sesión
          </button>
        )}
      </motion.div>
    </main>
  );
}
