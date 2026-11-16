# Cloud Functions - Reto al Filo

`onRegistrationCreate` (Gen 2, `southamerica-east1`): al crearse `registrations/{id}` crea
`publicStatus/code-{code}` y suma a `stats/summary` en una transaccion idempotente
(marcador `publicSyncedAt` en la inscripcion). Si el publicStatus existe con datos ajenos no lo pisa y marca `codeConflict: true`.

## Probar
```bash
cd functions && npm install && npm test            # tests unitarios (sin Firebase)
firebase emulators:start --only functions,firestore # desde la raiz del repo
```
Con el emulador (UI en http://localhost:4000) crear un doc en `registrations` con `code: "RAF-12345"`, `fullName`, `distance`, `status: "pendiente"`; verificar `publicStatus/code-RAF-12345` y `stats/summary`.

## Desplegar (solo la funcion)
```bash
firebase use <project-id>
firebase deploy --only functions
```
Requiere plan Blaze y APIs de Cloud Functions/Cloud Build/Artifact Registry habilitadas.

## Orden de despliegue (importante)
El cliente ya NO escribe `publicStatus` ni `stats` al inscribirse; lo hace solo esta funcion. Por eso:
1. `firebase deploy --only functions` (primero, antes de publicar el frontend o las reglas).
2. Publicar el frontend (Render, automatico con el push).
3. `firebase deploy --only firestore:rules` (reglas cerradas: `publicStatus`/`stats` solo admin; `registrations` create con campos y codigo validados).
4. Una vez, **Sincronizar** en el panel para recalcular `stats/summary` y reconstruir `publicStatus`.
Si el frontend sale antes que la funcion, las inscripciones nuevas quedan sin `publicStatus` hasta desplegarla o usar **Sincronizar**.