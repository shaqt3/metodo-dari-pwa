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
    // Cuando el usuario llega desde el enlace del correo, Supabase crea
    // una sesión temporal automáticamente a partir de la URL.
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
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#0f172a]/70">Cargando...</p>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-xl font-extrabold text-[#0f172a]">
          Enlace no válido
        </h1>
        <p className="mt-2 max-w-xs text-sm text-[#0f172a]/60">
          Este enlace de recuperación no es válido o ha caducado. Solicita
          uno nuevo desde la pantalla de inicio de sesión.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-8 rounded-xl bg-[#0f172a] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Volver al inicio de sesión
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xs"
      >
        <h1 className="mb-1 text-center text-2xl font-extrabold text-[#0f172a]">
          Nueva contraseña
        </h1>
        <p className="mb-8 text-center text-sm text-[#0f172a]/70">
          Elige una contraseña nueva para tu cuenta
        </p>

        {success ? (
          <p className="text-center text-sm text-[#0369a1]">
            Contraseña actualizada. Te llevamos a tu panel...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              required
              minLength={6}
