"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { friendlyError } from "@/lib/data";
import { Modal, confirmDelete, ErrorMsg, Loading } from "./ui";

const BUCKET = "progress-photos";

// Fotos de progreso PRIVADAS: solo las ven el socio y la entrenadora.
export default function ProgressPhotos({ userId, title = "Fotos de progreso" }) {
  const [photos, setPhotos] = useState([]);
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [takenOn, setTakenOn] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", userId)
      .order("taken_on", { ascending: false });
    if (err) {
      setError(/does not exist|schema cache/i.test(err.message)
        ? "Falta actualizar la base de datos: ejecuta el script V7_FOTOS_Y_MAS.sql en Supabase."
        : friendlyError(err));
      setLoading(false);
      return;
    }
    const list = data || [];
    setPhotos(list);
    if (list.length) {
      // Enlaces temporales (1 hora): las fotos no son públicas
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(list.map((p) => p.storage_path), 3600);
      const map = {};
      (signed || []).forEach((s) => {
        if (s.signedUrl) map[s.path] = s.signedUrl;
      });
      setUrls(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    for (const file of files) {
      const safe = file.name.normalize("NFD").replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (upErr) {
        setError(/exceeded|too large|size/i.test(upErr.message)
          ? "La foto es demasiado grande (máximo 20 MB)."
          : "No se pudo subir la foto. (" + upErr.message + ")");
        continue;
      }
      const { error: insErr } = await supabase.from("progress_photos").insert({
        user_id: userId,
        taken_on: takenOn,
        storage_path: path,
        note: note || null,
      });
      if (insErr) setError(friendlyError(insErr));
    }
    setNote("");
    setUploading(false);
    e.target.value = "";
    load();
  };

  const handleDelete = async (p) => {
    if (!confirmDelete("esta foto")) return;
    await supabase.storage.from(BUCKET).remove([p.storage_path]);
    await supabase.from("progress_photos").delete().eq("id", p.id);
    load();
  };

  return (
    <div className="content-card">
      <h2>{title}</h2>
      <p style={{ fontSize: 13, color: "var(--dark-60)", margin: "4px 0 12px" }}>
        🔒 Privadas: solo las veis tú y tu entrenadora. Ideal una foto al mes, con la misma luz y postura.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label className="field-label">Fecha</label>
          <input type="date" className="input" value={takenOn} onChange={(e) => setTakenOn(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="field-label">Nota (opcional)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: de frente" />
        </div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
        <Camera size={15} /> {uploading ? "Subiendo..." : "Subir fotos"}
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />

      <ErrorMsg>{error}</ErrorMsg>
      {loading && <Loading />}
      {!loading && !error && photos.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--dark-60)", marginTop: 12 }}>Todavía no hay fotos.</p>
      )}

      <div className="photo-grid">
        {photos.map((p) => (
          <div key={p.id} className="photo-tile">
            {urls[p.storage_path] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[p.storage_path]} alt="" onClick={() => setViewing(p)} />
            ) : (
              <div style={{ aspectRatio: "3 / 4" }} />
            )}
            <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(p)} title="Borrar">
              <Trash2 size={13} />
            </button>
            <div className="photo-tile-info">
              {new Date(p.taken_on).toLocaleDateString("es-ES")}
              {p.note ? ` · ${p.note}` : ""}
            </div>
          </div>
        ))}
      </div>

      {viewing && (
        <Modal
          title={`${new Date(viewing.taken_on).toLocaleDateString("es-ES")}${viewing.note ? " · " + viewing.note : ""}`}
          onClose={() => setViewing(null)}
          wide
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[viewing.storage_path]} alt="" className="photo-viewer" />
        </Modal>
      )}
    </div>
  );
}
