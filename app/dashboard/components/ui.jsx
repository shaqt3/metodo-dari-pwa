"use client";

import { useRef, useState } from "react";
import { X, Upload, Trash2, Pencil, Link2 } from "lucide-react";
import {
  uploadMedia,
  getYoutubeEmbedUrl,
  getVimeoEmbedUrl,
  isVideoFile,
} from "@/lib/media";

/* Ventana emergente reutilizable */
export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-card ${wide ? "modal-card-wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* Botones pequeños de editar / borrar */
export function EditDeleteButtons({ onEdit, onDelete, deleting, small = true }) {
  return (
    <div className="icon-actions">
      {onEdit && (
        <button
          type="button"
          className="icon-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          title="Editar"
          aria-label="Editar"
        >
          <Pencil size={small ? 14 : 16} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="icon-btn icon-btn-danger"
          disabled={deleting}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          title="Borrar"
          aria-label="Borrar"
        >
          <Trash2 size={small ? 14 : 16} />
        </button>
      )}
    </div>
  );
}

export function confirmDelete(what) {
  return window.confirm(
    `¿Seguro que quieres borrar ${what}?\n\nEsta acción no se puede deshacer.`
  );
}

/* Fila de "chips" para elegir una opción */
export function ChipFilter({ options, value, onChange }) {
  return (
    <div className="exercise-filters">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`filter-chip ${value === o.id ? "active" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* Casillas para elegir varias opciones */
export function CheckboxGroup({ options, values, onChange }) {
  const toggle = (id) =>
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  return (
    <div className="check-grid">
      {options.map((o) => {
        const id = o.id || o;
        const label = o.label || o;
        return (
          <label key={id} className={`check-pill ${values.includes(id) ? "on" : ""}`}>
            <input
              type="checkbox"
              checked={values.includes(id)}
              onChange={() => toggle(id)}
            />
            {label}
          </label>
        );
      })}
    </div>
  );
}

/* Muestra una foto, un vídeo subido o un vídeo de YouTube/Vimeo */
export function MediaView({ url, title = "", className = "" }) {
  if (!url) return null;
  const embed = getYoutubeEmbedUrl(url) || getVimeoEmbedUrl(url);
  if (embed) {
    return (
      <div className={`video-wrap ${className}`}>
        <iframe
          src={embed}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (isVideoFile(url)) {
    return (
      <video className={`media-video ${className}`} src={url} controls playsInline preload="metadata" />
    );
  }
  if (/^https?:\/\//.test(url) && !/\.(jpe?g|png|gif|webp|avif|heic)(\?|$)/i.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="exercise-video-link">
        <Link2 size={14} /> Abrir enlace
      </a>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={title} className={`media-img ${className}`} />;
}

/* Campo para poner una foto o vídeo: pegando un enlace o subiéndolo */
export function MediaInput({ label, value, onChange, kind = "image", folder = "general" }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const accept = kind === "video" ? "video/*" : kind === "any" ? "image/*,video/*" : "image/*";
  const placeholder =
    kind === "video" ? "Pega un enlace de YouTube o sube el vídeo" : "Pega un enlace o sube una foto";

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadMedia(file, folder);
      onChange(url);
    } catch (err) {
      setError(err.message);
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="form-group">
      <label className="field-label">{label}</label>
      <div className="media-input-row">
        <input
          className="input"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={14} />
          {uploading ? "Subiendo..." : "Subir"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>
      {error && <p className="form-message form-message-error" style={{ marginTop: 8 }}>{error}</p>}
      {value && (
        <div className="media-preview">
          <MediaView url={value} />
          <button type="button" className="link-btn" onClick={() => onChange("")}>
            Quitar
          </button>
        </div>
      )}
    </div>
  );
}

export function ErrorMsg({ children }) {
  if (!children) return null;
  return <p className="form-message form-message-error">{children}</p>;
}

export function Loading({ text = "Cargando..." }) {
  return <p style={{ fontSize: 13, color: "var(--dark-60)" }}>{text}</p>;
}
