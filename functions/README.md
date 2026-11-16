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

## Convivencia con el frontend actual
Mientras el cliente siga escribiendo publicStatus y sumando stats, los contadores se duplican (+2). Tras desplegar la funcion, quitar esas escrituras del cliente y cerrar reglas (ver `docs/plan-cloud-function-publicstatus.md`); luego usar **Sincronizar** en el panel para recalcular `stats/summary`.
