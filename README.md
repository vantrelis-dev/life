# Life

Agenda personal de Juan Pablo Merizalde. Interfaz de libreta: día, semana, mes,
matriz, metas anidadas, rutinas y tareas recurrentes. Formato visible AM/PM.

Repositorio: https://github.com/vantrelis-dev/life
Publicación de código con historial limpio. El historial anterior se conserva en
un respaldo privado separado; no se incluye en este repositorio público.
`vantrelis-dev` agrupa los repositorios personales y `life` contiene esta agenda.

## Estado real

Código preparado para Vercel; **la app todavía no está publicada**. Sigue siendo un prototipo
con guardado local por navegador. No tiene login ni sincronización entre equipos.
No usarlo como único almacenamiento de pendientes importantes.

Los datos iniciales nuevos están vacíos. El prototipo original y su almacenamiento
no se modificaron. Las pruebas usan una fixture sintética que no se publica.

## Verificación local

Node 24 o superior, sin dependencias de frontend:

```sh
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
- Siguiente paso: autorizar la organización personal de Supabase en el conector;
  después añadir acceso y persistencia. Vercel ya está con el correo personal,
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

1. Crear el proyecto de Supabase en la organización personal autorizada.
2. Login de un único usuario y políticas por propietario, no solo ocultar la UI.
3. Guardado duradero con aviso de errores y protección contra sobrescrituras
   entre dos dispositivos.
4. Exportar desde el origen real del prototipo y revisar la importación antes de
   migrar. No importar datos de pruebas ni reemplazar tareas sin confirmación.
5. Verificar acceso denegado a terceros y flujo de recuperación/backup.
6. Publicar en la cuenta personal de Vercel, separada de las empresas.

No se ha añadido conexión a Brain, Google Calendar, Gmail ni agentes. La pestaña
de Finanzas sigue siendo un espacio reservado. Menú y diseño quedan sin rediseñar.

## Datos y secretos

No subir `.env`, claves secretas, sesiones, backups, exportaciones personales,
archivos del Brain ni datos clínicos. Una clave publicable de Supabase no sustituye
las políticas de acceso. Nunca usar `service_role` en el navegador.

El almacenamiento local original usa `mi-dia.pastel-v2.demo`; cada origen/puerto
y perfil tiene datos independientes. No borrar ni reiniciar el prototipo para migrar.
