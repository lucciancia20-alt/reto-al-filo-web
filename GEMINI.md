# Contexto y Reglas del Proyecto - Reto al Filo

- **Stack Técnico:** Frontend en React/Vite, base de datos en Firebase Firestore y despliegue en Cloudflare Pages.
- **Flujo de Despliegue:** Nunca ejecutes `git commit` ni `git push` sin autorización explícita. Todo cambio debe verificarse primero en `http://localhost:5173/` y compilar sin errores con `npm run build`.
- **Reglas de Firebase:** Los cambios en `firestore.rules` no se publican con Git. Cada vez que se edite ese archivo, recordá desplegarlo por separado ejecutando `firebase deploy --only firestore:rules`.
- **Lógica de Cobros y Cupones:** Los descuentos nunca se suman entre sí (prevalece siempre el porcentaje mayor entre el 20% de residente y el cupón). Si el total queda en `$0`, omití la exigencia de subir comprobante de pago y usá transacciones atómicas para descontar cupos.
- **Estabilidad Visual (Layout Shift):** En botones que cambian de texto o muestran íconos dinámicos (como `×` o contadores), asigná siempre anchos mínimos fijos (`min-w-...`) para evitar que desplacen a los elementos vecinos.
