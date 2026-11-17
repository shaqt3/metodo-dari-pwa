# El Método Dari

App de entrenamiento (PWA) hecha con Next.js 14 y Supabase, publicada en Vercel.

## Qué hace

**Socios** (cualquier persona que se registra):
- Ve su rutina de la semana, con fotos y vídeos de cada ejercicio.
- Ve su dieta día a día con calorías y macros, y avisos si un alimento no es apto para él/ella (por ejemplo, gluten si es celíaco).
- Completa retos, registra entrenamientos, peso y medidas.
- Rellena su ficha (objetivo, datos, alimentación especial).

**Entrenadora** (emails de `lib/config.js`), todo desde la propia app:
- **Socios**: ficha completa, notas privadas, alta/baja, medidas, progreso y asignar rutinas/dietas a partir de plantillas con un clic.
- **Ejercicios**: añadir, editar, borrar, subir fotos y vídeos desde el móvil o pegar un enlace de YouTube.
- **Rutinas**: planes por días de la semana; editar, borrar, reordenar ejercicios y copiar a otro socio.
- **Alimentación**: dietas por tipo (adelgazar, ganar peso, volumen, definición, sin gluten/celíacos, sin lactosa, vegetariana...), copiar un día a otros, totales de kcal y macros; biblioteca de alimentos con categorías y filtro "sin gluten".
- **Retos**: con foto/vídeo y fecha límite; se ve quién lo ha completado.

## Instalar la actualización

Mira `GUIA_ACTUALIZACION.md`.

## Estructura

- `app/page.jsx`: página de inicio pública
- `app/login/page.jsx`: entrar / crear cuenta / recuperar contraseña
- `app/dashboard/page.jsx`: la app (inicio, menú y secciones)
- `app/dashboard/components/`: cada sección (Socios, Rutinas, Ejercicios, Alimentación, Retos...)
- `lib/options.js`: listas de opciones (objetivos, tipos de dieta, categorías de alimentos...). **Para añadir un tipo nuevo, basta con añadir una línea aquí.**
- `lib/config.js`: emails con permisos de entrenadora
- `supabase/sql/V6_PANEL_ADMIN.sql`: actualización de la base de datos
- `supabase/functions/admin-users`: función para borrar cuentas de socios

## Añadir otra persona como entrenadora

Hay que añadir su email en 3 sitios: `lib/config.js`, `supabase/functions/admin-users/index.ts` y la función `is_trainer()` de Supabase (SQL Editor).
