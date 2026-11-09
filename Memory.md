# Memory.md — Decisiones Cerradas, Estado del Plan y Preferencias

Guarda lo que no queremos volver a discutir ni explicar entre sesiones.

---

## 1. Decisiones Técnicas Cerradas (No Reabrir)
- **Estructura Backend:** Arquitectura estandarizada inspirada en `DIRPOLES-4`:
  - Namespace raíz: `App\` mapeado a `app/`.
  - Capas: `DTOs` $\rightarrow$ `Controllers` (funciones) $\rightarrow$ `Services` (lógica/validación con `ExcepcionApi`) $\rightarrow$ `Repositories` (SQL PDO).
  - Respuestas JSON mediante `App\Core\Respuesta` con formato: `{"exito": true, "datos": ...}` y `{"exito": false, "error": {...}}`.
  - Términos en español para métodos, variables de negocio, clases y excepciones.
- **Aritmética Financiera:** Todos los cálculos monetarios deben realizarse con `App\Core\DecimalMath` (`bcmath`). Se prohibió el uso de `float`.
- **Modelo de Pagos:** Desacoplamiento entre recibo de pago (`pagos`) y aplicaciones de deuda (`imputaciones_pago`), permitiendo que un solo Pago Móvil cubra las cuotas de varios hermanos.
- **Saldo a Favor:** Bolsa de `saldos_a_favor` asociada al representante para retener excedentes o vueltos.
- **Asistencia Técnica en Cancha:** Toma de asistencia *offline* para entrenadores mediante SQLite local en React Native Expo y sincronización por lote.
- **Esquemas de Base de Datos:** Separación formal en PostgreSQL entre el esquema `seguridad` (usuarios, tokens, auditoría) y `negocio` (academias, jugadores, cobranzas, etc.) dentro de la misma base de datos `fichapp_db`.
- **Ubicación del Código:** `/home/mroberth/Proyectos/fichapp/`.
- **Repositorio Remoto Oficial:** `https://github.com/mroberth/FichApp.git` (Rama principal: `main`).

## 2. Errores Resueltos y Soluciones
- **Estandarización de Excepciones:** Se implementó `App\Core\ExcepcionApi` y `App\Core\ErrorCodes` para que los Servicios lancen excepciones con código, estado HTTP y mensaje en español.

## 3. Preferencias de Trabajo del Desarrollador
- **Metodología Paso a Paso:** Trabajar una sola tarea a la vez del backlog de ClickUp.
- **Familiaridad y Productividad:** Mantener la estética, convenciones en español y simplicidad de `DIRPOLES-4`.
- **Lenguaje Frontend Móvil:** JavaScript puro (`.js` / `.jsx`) en React Native + Expo SDK 58, sin TypeScript, por preferencia de comprensión y mantenibilidad del desarrollador.

## 4. Estado Actual del Plan

```
Sprint 0: Cimientos, DB & Auth (List ID: 901718120307) -- 100% COMPLETADO 🎉
  [x] T0.1: Setup PHP 8.5 puro, PSR-4 y Conexión PDO (ID: 86e3zm74p)  <-- COMPLETADA
  [x] T0.2: Router HTTP Ligero y Middlewares de Contexto (ID: 86e3zm74q)  <-- COMPLETADA
  [x] T0.3: Migraciones Base PostgreSQL: Tenants, Usuarios y Auditoría (ID: 86e3zm74r)  <-- COMPLETADA
  [x] T0.4: Servicio de Autenticación, Hashes y Tokens Bearer (ID: 86e3zm74t)  <-- COMPLETADA
  [x] T0.5: Setup de App Móvil Expo (SDK 58) y Navegación por Roles (ID: 86e3zm74u)  <-- COMPLETADA

Sprint 1: Núcleo Deportivo & Familias (List ID: 901718120308)
  [ ] T1.1: Migraciones: Categorías, Equipos, Jugadores y Representantes (ID: 86e3zm74w)  <-- SIGUIENTE TAREA
  [ ] T1.2: Repositorios PDO y Servicios de Fichas Deportivas (ID: 86e3zm74y)
  [ ] T1.3: Endpoints REST Deportivos (ID: 86e3zm74z)
  [ ] T1.4: UI Móvil: Directorio de Jugadores y Búsqueda (ID: 86e3zm750)

Sprints 2 a 5: Pendientes en ClickUp
```
