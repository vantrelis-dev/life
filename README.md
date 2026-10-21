# Life

Agenda personal de Juan Pablo Merizalde. Interfaz de libreta: día, semana, mes,
matriz, metas anidadas, rutinas y tareas recurrentes. Formato visible AM/PM.

Repositorio: https://github.com/vantrelis-dev/life
Publicación de código con historial limpio. El historial anterior se conserva en
un respaldo privado separado; no se incluye en este repositorio público.
`vantrelis-dev` agrupa los repositorios personales y `life` contiene esta agenda.

## Estado de la implementación

Interfaz desplegada: https://life-mu-jet.vercel.app/
Panel: https://vercel.com/life-286d/life
La pantalla pública permanece cerrada mientras no se configure Supabase.

El código incluye una puerta de acceso por enlace de correo, guardado con revisión,
recuperación de borradores y restauración JSON con confirmación en una agenda vacía.
Sin configuración de Supabase, la aplicación queda cerrada: no se cargan tareas.
La publicación y las pruebas reales de acceso dependen de completar el proyecto
dedicado, autorizar al propietario y configurar las URLs de retorno.

Los datos iniciales nuevos están vacíos. El prototipo original y su almacenamiento
no se modificaron. Las pruebas usan una fixture sintética que no se publica.

## Verificación local

Node 24 o superior. Dependencias fijadas y lockfile incluido:

```sh
npm ci
npm run build
npm test
npm run check
python3 -m http.server 8896 --bind 127.0.0.1 --directory dist
```

Abrir http://127.0.0.1:8896 y detener el servidor al terminar.
`vercel.json` publica exclusivamente `dist/`; no publica pruebas, exports o Brain.
`noindex` no es un control de acceso.

## Bloque actual: llevarlo entre dispositivos

- Resultado: poder usar la misma agenda privada desde computador y celular.
- Acción habilitada al cerrar el bloque: capturar, editar y consultar pendientes.
- Éxito: una tarea creada en celular aparece en computador tras iniciar sesión;
  cerrar/borrar el navegador no borra el dato guardado en servidor.
- Riesgo que debe reducirse: pérdida de datos locales y exposición pública.
- Mantenimiento: repositorio, despliegue, acceso y respaldo verificable.
- Siguiente paso: completar el proyecto personal de Supabase y verificar las
  políticas y el acceso real. Vercel ya está con la cuenta personal,
  usuario `jpbuilds`, espacio `Life` (`life-286d`).

El código será público temporalmente por decisión del propietario para conectar
la organización a Vercel Hobby. No se ha activado Pro ni aceptado un cobro.
Volver a privado no elimina copias que terceros hayan podido realizar.
Código público no significa datos públicos: la agenda debe usar autenticación y
políticas por propietario antes de incorporar datos reales al servidor.

Propietario: Juan Pablo Merizalde; GitHub `jpmerizalde`.
Organización personal creada: **Juan Pablo Merizalde**, plan Free, separada de VIUU.
No se reutiliza la organización ni base de datos de VIUU.

## Antes de publicar

1. Completar el proyecto dedicado de Supabase. Mantener desactivado el alta pública.
2. Crear/invitar solo al propietario verificado, anotar su UUID y ejecutar
   `database/setup.sql` como administrador del proyecto nuevo. Insertar ese UUID
   en `life_private.owners` desde el administrador (nunca desde el navegador).
3. Configurar URL, clave publicable y UUID en `dist/config.js`, más Site URL y
   redirects permitidos en Supabase Auth. No usar claves secretas en el cliente.
   El enlace de correo usa el flujo implícito documentado; no requiere Google OAuth.
4. Exportar desde el origen real del prototipo y revisar la importación antes de
   migrar. No importar datos de pruebas ni reemplazar tareas sin confirmación.
5. Ejecutar `database/verify.sql`, verificar rechazo de anon y de otro usuario,
   y probar dos dispositivos, fallo de red, conflicto y exportación/restauración.
6. Publicar en la cuenta personal de Vercel, separada de las empresas.

No se ha añadido conexión a Brain, Google Calendar, Gmail ni agentes. La pestaña
de Finanzas sigue siendo un espacio reservado. Menú y diseño quedan sin rediseñar.

## Datos y secretos

No subir `.env`, claves secretas, sesiones, backups, exportaciones personales,
archivos del Brain ni datos clínicos. Una clave publicable de Supabase no sustituye
las políticas de acceso. Nunca usar `service_role` en el navegador.

El almacenamiento local original usa `mi-dia.pastel-v2.demo`; cada origen/puerto
y perfil tiene datos independientes. No borrar ni reiniciar el prototipo para migrar.

El nuevo caché usa `life.owner.<UUID>`; no lee automáticamente la demo anterior.
Los conflictos paran la escritura, no la fuerzan. El borrador se conserva localmente
y puede descargarse. Actualizar desde el servidor exige no tener ediciones locales
pendientes ni tarjetas abiertas. No hay fusión automática de dos agendas.

La PWA guarda solo archivos públicos de la interfaz en su caché. No almacena
respuestas de Auth o de la API en el service worker. El primer acceso requiere red.
La exportación JSON es manual; el plan gratuito no se trata como un backup garantizado.

## Verificado / pendiente

- Despliegue correcto en Vercel; se comprobó que sin configuración no muestra la agenda.
- Pruebas de fechas, jerarquía, libreta, recurrencias y formato AM/PM pasan.
- Pruebas aisladas de guardado serial, conflicto, borrador y recuperación pasan.
- Dependencias de producción auditadas sin vulnerabilidades conocidas al preparar esta versión.
- Pendiente: crear el proyecto personal de Supabase y aplicar/verificar el SQL.
- Pendiente: verificar rechazo de usuarios ajenos en la API real y entrada del propietario.
- Pendiente: probar sincronización real y migrar únicamente la copia elegida por el propietario.
