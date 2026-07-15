# El Método Dari

PWA construida con Next.js 14 (App Router), Tailwind CSS y Supabase.

## Instalación

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

- `app/page.jsx` — Landing page
- `app/login/page.jsx` — Login con Supabase Auth
- `app/dashboard/page.jsx` — Panel protegido (requiere sesión activa)
- `lib/supabaseClient.js` — Cliente de Supabase (credenciales incluidas en el código)
- `public/manifest.json` — Manifest de la PWA

## Notas

- Las credenciales de Supabase están hardcodeadas en `lib/supabaseClient.js` tal como se solicitó. Para producción, se recomienda migrarlas a variables de entorno.
- El service worker de PWA (`next-pwa`) se genera automáticamente en build (`npm run build`) y está deshabilitado en modo desarrollo.
- Debes crear un usuario en Supabase Auth (Authentication > Users) para poder iniciar sesión desde `/login`.
