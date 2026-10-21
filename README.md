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
La pantalla pública pide acceso por enlace de correo; nunca muestra la agenda sin sesión.

El código incluye una puerta de acceso por enlace de correo, guardado con revisión,
recuperación de borradores y restauración JSON con confirmación en una agenda vacía.
Sin configuración de Supabase, la aplicación queda cerrada: no se cargan tareas.
El proyecto dedicado, el propietario y las URLs de retorno ya están configurados.
El primer ingreso por correo y la sincronización real entre dispositivos todavía
deben comprobarse con el propietario.

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
- Siguiente paso: entrar mediante el enlace de correo y verificar el acceso y
  guardado reales entre dispositivos. Vercel está con la cuenta personal,
  usuario `jpbuilds`, espacio `Life` (`life-286d`).

El código será público temporalmente por decisión del propietario para conectar
la organización a Vercel Hobby. No se ha activado Pro ni aceptado un cobro.
Volver a privado no elimina copias que terceros hayan podido realizar.
Código público no significa datos públicos: la agenda debe usar autenticación y
políticas por propietario antes de incorporar datos reales al servidor.

Propietario: Juan Pablo Merizalde; GitHub `jpmerizalde`.
Organización personal creada: **Juan Pablo Merizalde**, plan Free, separada de VIUU.
No se reutiliza la organización ni base de datos de VIUU.

## Configuración y recuperación

1. El proyecto dedicado de Supabase está creado. Mantener desactivada el alta pública.
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
6. Los cambios de `main` se publican en la cuenta personal de Vercel, separada de las empresas.

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
- Proyecto personal creado; SQL aplicado con un solo propietario autorizado.
- RLS habilitado y forzado en ambas tablas, cuatro políticas; sin lectura anónima
  ni permiso de borrado desde el cliente.
- Prueba SQL transaccional real: propietario puede insertar/leer/actualizar;
  otros usuarios no pueden leer/insertar/actualizar ni ver la membresía;
  no se puede reasignar propietario y la revisión obsoleta no modifica la fila.
  Todos los datos de prueba se revirtieron. `database/access-test.sql` conserva
  esta prueba inicial y se niega a correr si ya hay una agenda real.
- Petición HTTP real con clave publicable y sin sesión: rechazada con HTTP 401
  y `permission denied for table planner_documents`.
- Se retiró EXECUTE público de la función interna `rls_auto_enable()` detectada
  por el Advisor; no se desactivó el trigger ni RLS.
- Pendiente: verificar la entrada real del propietario mediante correo.
- Pendiente: probar sincronización real y migrar únicamente la copia elegida por el propietario.
