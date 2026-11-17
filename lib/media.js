import { supabase } from "@/lib/supabaseClient";

// Sube una foto o vídeo al almacenamiento "media" de Supabase y
// devuelve su enlace público.
export async function uploadMedia(file, folder = "general") {
  const cleanName = file.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${Date.now()}-${cleanName}`;

  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    if (/exceeded|too large|size/i.test(error.message)) {
      throw new Error(
        "El archivo es demasiado grande (máximo 50 MB). Para vídeos largos, súbelo a YouTube y pega aquí el enlace."
      );
    }
    throw new Error(
      "No se pudo subir el archivo. Comprueba que se ha ejecutado el script V6 en Supabase. (" +
        error.message +
        ")"
    );
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2];
    else if (u.pathname.startsWith("/embed/")) return url;
    else if (u.searchParams.get("v")) id = u.searchParams.get("v");
    if (!id || !u.hostname.includes("youtu")) return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}

export function getVimeoEmbedUrl(url) {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

export function isVideoFile(url) {
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url || "");
}

export function isImageFile(url) {
  return /\.(jpe?g|png|gif|webp|avif|heic)(\?|$)/i.test(url || "");
}
