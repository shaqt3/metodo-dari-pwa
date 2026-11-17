# Cómo instalar la actualización (paso a paso)

Son 2 pasos y se hacen una sola vez. Después, Dari lo gestiona todo desde la app.

## Paso 1: actualizar la base de datos (Supabase), unos 2 minutos

1. Entra en https://supabase.com y abre el proyecto de El Método Dari.
2. En el menú de la izquierda pulsa **SQL Editor** y después **New query**.
3. Abre el archivo `supabase/sql/V6_PANEL_ADMIN.sql`, copia **todo** su contenido y pégalo.
4. Pulsa **Run** (abajo a la derecha).
5. Debe salir **"Success"**. Si sale algo en rojo, copia el texto del error.

Este script **no borra nada**: solo añade cosas. Se puede ejecutar varias veces sin problema.

> ⚠️ No ejecutes nada de la carpeta `antiguos_NO_EJECUTAR`. En concreto, `RUN_THIS.sql` borraría todos los datos.

## Paso 2: subir el código nuevo a GitHub, unos 5 minutos

Vercel publica la app automáticamente cada vez que cambia el código en GitHub.

**Opción fácil (desde el navegador):**
1. Entra en https://github.com/shaqt3/metodo-dari-pwa
2. Pulsa **Add file → Upload files**.
3. Descomprime el zip y arrastra **todo el contenido de la carpeta** `el-metodo-dari` (las carpetas `app`, `lib`, `supabase`, `public` y los archivos sueltos) a la ventana de GitHub.
4. Abajo escribe un mensaje, por ejemplo "Panel de administración V6", y pulsa **Commit changes**.
5. (Recomendado) Subir archivos no borra los antiguos. Para que nadie ejecute por error el script que borra los datos, entra en la carpeta `supabase/sql` de GitHub, abre `RUN_THIS.sql`, pulsa los tres puntos `…` → **Delete file** → **Commit changes**.
6. Espera 1 o 2 minutos: Vercel lo publica solo. Puedes ver el progreso en https://vercel.com, en la pestaña **Deployments**.

**Si GitHub no deja subir carpetas** (pasa en algunos navegadores): usa GitHub Desktop, o pide a Claude que lo suba directamente conectando GitHub en Ajustes → Conectores.

## Comprobación rápida

1. Abre la app y entra con el email de Dari.
2. En el menú debe aparecer **Socios** y en el inicio el panel "¡Hola, Dari!".
3. Entra en **Ejercicios**: cada tarjeta tiene un lápiz ✏️ y una papelera 🗑️.

Si en algún sitio aparece "Falta actualizar la base de datos", es que el Paso 1 no se ha ejecutado.

---

# Mini manual para Dari

- **Añadir un socio:** Socios → "Añadir socio" → envíale el mensaje por WhatsApp. Cuando se registre y entre, aparecerá en la lista.
- **Ficha del socio:** toca su nombre. Pestañas: Ficha (datos, objetivo, celiaquía, notas privadas), Rutinas, Dietas y Progreso (peso y medidas).
- **Darle una rutina o dieta:** en su ficha → Rutinas/Dietas → elige una plantilla → "Asignar". Se crea una copia solo para él/ella, que puedes cambiar sin tocar la original. Las plantillas que encajan con su objetivo salen primero.
- **Crear una dieta desde cero:** Alimentación → "Crear dieta" → ábrela → elige el día → "Añadir alimento". Con "Copiar este día a otros" rellenas la semana en un momento.
- **Celíacos:** marca "Celiaquía" en su ficha. La app avisa ⚠️ si su dieta tiene algo con gluten. En Alimentos tienes el filtro "Solo sin gluten" y la plantilla "Sin gluten (celíacos)".
- **Subir un vídeo:** al crear o editar un ejercicio o un reto, pulsa "Subir" y elige el vídeo del móvil (máximo 50 MB). Para vídeos largos es mejor subirlos a YouTube y pegar el enlace.
- **Editar o borrar:** lápiz ✏️ = editar, papelera 🗑️ = borrar. Siempre pide confirmación antes de borrar.
