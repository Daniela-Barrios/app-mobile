# Requerimientos — Dashboard Fase 0

Entregable Fase 0 (3 PM). El dashboard es la **capa inicial de monitoreo y administración**: usa información simulada con estructura preparada para datos reales en fases posteriores. No se conecta a hardware.

## 1. Información a visualizar
- **Usuarios:** total, activos, inactivos, recientes.
- **Ingresos:** cantidad, últimos registrados, por zona (Ingreso Principal, Lobby, Área Restringida).
- **Actividad reciente:** lista cronológica (token generado, usuario registrado, acceso autorizado, biometría registrada). Fuente futura: biométricos, cámaras, videoporteros, portal de vigilancia.
- **Eventos simulados:** acceso aprobado/rechazado, token utilizado, vigilante atendió solicitud, nuevo usuario registrado.
- **Estado del sistema:** sistema operativo, vigilante virtual disponible, tokens activos, eventos del día.

## 2. Módulo de usuarios
Nombre, identificación, fotografía, estado, biometría registrada. Crear, editar, consultar, desactivar.

## 3. Simulación de biometría
Subir foto → generar biometría simulada → asociar a usuario → guardar. Se almacena usuario, foto, ID biométrico. Mostrar biometrías registradas vs pendientes.

## 4. Tokens
- Un usuario puede obtener tokens de acceso (ej. `TK-001`, zona, estado).
- **Un solo uso:** Activo → Utilizado → Inválido.
- **Un token por zona.**
- Dashboard: generados, activos, utilizados, vencidos/invalidados. Admin: generar, consultar, invalidar.

## 5. Registro de accesos
Cada uso de token genera registro con: usuario, zona, fecha, hora, token, fotografía. Ver historial, buscar, filtrar.

## 6. Trazabilidad
Usuario → Fotografía → Token → Zona → Registro. Todo acceso rastreable de punta a punta.

## 7. Vigilante virtual (simulado)
Chat (usuario solicita ingreso / vigilante responde), botón "Llamar vigilante", botón "Iniciar videollamada". No requieren funcionar realmente.

## 8. Administración
Todo administrable: usuarios, tokens, registros (historial/buscar/filtrar), eventos (visualizar/auditar).

## 9. Preparación Fase A
- Biométricos: registrar, verificar, identificar.
- Cámaras: relacionar acceso, evidencia, video.
- Portal de vigilancia: chat, llamadas y videollamadas reales.
- Control de puertas: abrir, cerrar, bloquear, autorizar.

## KPIs de la demo
Total usuarios · ingresos del día · accesos por zona · tokens generados · tokens utilizados · biometrías registradas · eventos registrados · solicitudes atendidas por vigilante · estado operativo.

## Restricciones de infraestructura
Cero despliegues (todo local). Todo servicio emulado con Docker.
