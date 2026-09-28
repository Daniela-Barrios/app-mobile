---
name: token-rules
description: Reglas de negocio y máquina de estados de los tokens de acceso (único token activo por usuario a nivel global, sin caducidad, invalidación al validar biometría, historial cronológico, baja lógica). Úsala al generar, validar o revocar tokens.
---

# Reglas de tokens

## Máquina de estados
```
activo --validación biométrica--> inválido
activo --revocación manual (admin)--> inválido
```
- Solo dos estados: `activo` e `inválido`. **No existe `vencido`, no hay TTL ni `expiresAt`.**
- `inválido` es terminal; nunca se reactiva (se emite un token nuevo).
- Cada transición agrega una fila en `tokenHistory` y un evento en `events`, en la **misma operación de servicio** (no llamadas sueltas al mock).

## Reglas confirmadas
1. **Único token activo por usuario, GLOBAL en todo el sistema (no por zona).** Antes de generar un token nuevo, la capa de servicios verifica que el usuario no tenga ya **ningún** token `activo`, sin importar la zona. Si ya tiene uno activo en "Entrada Principal", no puede generarse otro para "Bodega" ni ninguna otra zona hasta que el primero sea validado o revocado. Cada token sigue perteneciendo a una única zona; validarlo en otra zona se rechaza (`wrong_zone`).
2. **Sin caducidad.** Un token vive `activo` indefinidamente hasta que ocurre una de las dos transiciones válidas. No se implementa ningún job ni evaluación de vencimiento.
3. **La invalidación ocurre al validar contra el biométrico**, no por un "uso" genérico: el flujo es *usuario presenta token → sistema simula lectura biométrica → si coincide, el token pasa `activo → inválido`* (`validatedAt`, `tokenHistory` con motivo `biometric_validation`) **y** se crea el `accessLog` (`result: autorizado`) en la misma operación. Solo después de esa invalidación el usuario puede recibir un token nuevo, para cualquier zona.
4. **Revocación manual** (acción de administrador): invalida el token activo del usuario en cualquier momento, sin necesidad de biometría (`tokenHistory` con motivo `manual_revocation`). También libera al usuario para que se le genere un token nuevo.
5. Validar un token que ya está `inválido` no lo modifica: genera un `accessLog` (`result: rechazado`, `denyReason: token_invalid`) y su evento.
6. Solo usuarios `activo` (no dados de baja) pueden tener/validar tokens; si el usuario se da de baja (soft), su token activo (si lo tiene) se invalida (motivo `user_deactivated`).
7. Toda validación, exitosa o rechazada, genera `accessLogs` + `events`.
8. Códigos legibles `TK-###` generados por secuencia/contador en el mock, no tecleados por el usuario.
9. Nada se borra físicamente: `tokenHistory` es append-only y el propio registro de `tokens` nunca se elimina, solo cambia de estado o se marca `deletedAt` si se retira de las listas activas (baja lógica, no borrado).

## Pruebas obligatorias
- Generar un segundo token para el mismo usuario en **otra** zona mientras el primero sigue `activo` → debe rechazarse (regla global, no por zona).
- Validar un token `activo` → pasa a `inválido`, crea `accessLog` autorizado y evento; solo entonces se puede generar uno nuevo para cualquier zona.
- Validar un token ya `inválido` → `accessLog` rechazado, el token no cambia.
- Validar en la zona incorrecta → rechazado, el token no cambia.
- Revocar manualmente un token activo → pasa a `inválido` con motivo `manual_revocation`; el usuario queda libre para uno nuevo.
- Desactivar (soft) al usuario con un token `activo` → el token se invalida automáticamente.
- Confirmar que ningún token cambia de estado por el mero paso del tiempo (no hay TTL).
- Historial cronológico de estados visible y completo para cualquier token.
