# Memory.md — Decisiones Cerradas, Estado del Plan y Preferencias

Guarda lo que no queremos volver a discutir ni explicar entre sesiones.

---

## 1. Decisiones Técnicas Cerradas (No Reabrir)
- **Estructura Backend:** Arquitectura estandarizada inspirada en `DIRPOLES-4`:
  - Namespace raíz: `App\` mapeado a `app/`.
  - Capas: `DTOs` $\rightarrow$ `Controllers` (funciones limpias) $\rightarrow$ `Services` (lógica y validación lanzando `ExcepcionApi`) $\rightarrow$ `Repositories` (SQL PDO con filtro obligatorio `academia_id`).
  - Respuestas JSON mediante `App\Core\Respuesta` con formato: `{"exito": true, "datos": ...}` y `{"exito": false, "error": {...}}`.
  - Términos en español para métodos, variables de negocio, clases y excepciones.
- **Aritmética Financiera:** Todos los cálculos monetarios deben realizarse con `App\Core\DecimalMath` (`bcmath`). Se prohíbe el uso de `float`.
- **Modelo de Pagos:** Desacoplamiento entre recibo de pago (`pagos`) y aplicaciones de deuda (`imputaciones_pago`), permitiendo que un solo Pago Móvil cubra las cuotas de varios hermanos.
- **Saldo a Favor:** Bolsa de `saldos_a_favor` asociada al representante para retener excedentes o vueltos.
- **Asistencia Técnica en Cancha:** Toma de asistencia *offline* para entrenadores mediante SQLite local en React Native Expo y sincronización por lote.
- **Esquemas de Base de Datos:** Separación formal en PostgreSQL entre el esquema `seguridad` (usuarios, tokens, auditoría) y `negocio` (academias, jugadores, cobranzas, etc.) dentro de la misma base de datos `fichapp_db`.
- **Identificadores UUIDv4:** Todos los identificadores primarios y foráneos (`id`, `academia_id`, etc.) utilizan UUIDv4. Evitan enumeración maliciosa, facilitan particionamiento multi-tenant y permiten generación de claves únicas offline en dispositivos móviles antes de sincronizar con el backend.
- **Stack Móvil:** React Native 0.88 + React 19 + Expo SDK 58 en **JavaScript puro** (`.js` / `.jsx`), sin TypeScript.
- **FichApp Design System:** Basado en la skill normativa `mobile/.antigravity/SKILLS/fichapp-design-system/`.
  - Tema Claro (Light Theme) sobrio, limpio y moderno estilo Notion/Figma.
  - Paleta oficial: Fondo `#F3F6F2`, Superficies `#FFFFFF`, Primario `#174D50` (Azul Petróleo), Acento `#B9E44A` (Verde Lima), Texto Principal `#252B27`.
  - Tokens centralizados en `mobile/src/theme/tokens.js`. Prohibido hardcodear estilos en componentes individuales.
  - **Patrón Visual Aprobado «Hero Branding Split»:** División en cabecera superior en azul petróleo institucional con tipografía en blanco/lima, y hoja inferior blanca curvada (`borderTopLeftRadius: 32`) con controles táctiles de 48-50px.
  - **Componentes Compartidos Obligatorios:**
    - `FichAppInput`: Validación inline, borde rojo dinámico, toggle contraseña con `Eye`/`EyeOff`.
    - `FichAppModalFeedback`: Desacoplamiento total de `Alert.alert` nativo con modales de confirmación/error estilizados.
    - `FichAppLogoCompleto`: Logo vectorial integrado con isotipo y tipografía trazada oficial (`fichapp-2.svg`).
  - **Formularios en Móvil:** Uso obligatorio de `KeyboardAvoidingView` y `ScrollView` (`keyboardShouldPersistTaps="handled"`) para evitar que el teclado virtual tape campos o botones de acción.
- **Iconografía Vectorial:** Prohibido el uso de emojis como iconos de interfaz. Uso obligatorio de `lucide-react-native` y `react-native-svg`.
- **Manejo de Áreas Seguras:** Prohibido el componente nativo `SafeAreaView` de React Native (deprecado). Uso obligatorio de `SafeAreaView` o `useSafeAreaInsets` de `react-native-safe-area-context`.
- **Resolución de Red Móvil en Desarrollo:** Configuración en `mobile/src/config/api.js` que detecta dinámicamente la IP de la máquina de desarrollo (`Constants.expoConfig.hostUri` vía `expo-constants`, fallback `192.168.50.117:8000`) para garantizar conectividad desde teléfonos físicos en la red Wi-Fi sin colgarse en `localhost` o `10.0.2.2`. Timeout de 8s en `fetch` con `AbortController`.
- **Ubicación del Código:** `/home/mroberth/Proyectos/fichapp/`.
- **Repositorio Remoto Oficial:** `https://github.com/mroberth/FichApp.git` (Rama principal: `main`).

## 2. Errores Resueltos y Soluciones
- **Estandarización de Excepciones:** Se implementó `App\Core\ExcepcionApi` y `App\Core\ErrorCodes` para que los Servicios lancen excepciones con código, estado HTTP y mensaje en español.
- **Autenticación PostgreSQL en Fedora:** Se reconfiguró `pg_hba.conf` de `ident` a `scram-sha-256` para permitir conexión de la app con credenciales seguras.
- **Driver `pdo_pgsql` en Servidor PHP:** El servidor `php -S` debe ejecutarse con `0.0.0.0:8000` y con el paquete `php-pgsql` activo.
- **Deprecación de PHPUnit 11:** Reemplazado `@depends` en docblocks por el atributo nativo `#[Depends('testMethodName')]`.
- **Crash `ReferenceError: Property Platform doesn't exist` en Móvil:** Solucionado importando explícitamente `Platform` desde `'react-native'`.
- **Carga Infinita en Login Móvil en Celulares Físicos:** Se resolvió sustituyendo la IP fija `10.0.2.2` (solo para emuladores PC) por resolución dinámica con `expo-constants` apuntando a la IP Wi-Fi de la laptop (`192.168.50.117`), y agregando un timeout de 8s con `AbortController` en `apiService.js`.
- **Carga de Atletas y Flujo Interactivo Móvil [T1.4]:** Se corrigió la extracción del token Bearer en `PlayerDirectoryScreen` y `PlayerDetailScreen` utilizando `token` del contexto de autenticación con fallback asíncrono a `obtenerToken()` de SecureStore. Además, se implementó el flujo interactivo completo con pantalla modal para asignación y cambio de equipo/dorsal en tiempo real, baja lógica auditada y pantalla de alta de atletas `CreatePlayerScreen` con gestión de tutores legales.
- **Contenido Solapado con Notch / Advertencia SafeAreaView:** Se migró toda la navegación y pantallas al componente `SafeAreaView` de `react-native-safe-area-context`.
- **Endurecimiento Técnico (Sprint 1.5):**
  - **Rate Limiting:** Implementado algoritmo Token Bucket (`App\Services\TokenBucketLimiter` con tabla `seguridad.rate_limits`) y middleware `RateLimitMiddleware` en `POST /api/v1/auth/login` (5 peticiones de ráfaga, reposición constante de 5 tokens cada 15 min, cabeceras estándar y código `HTTP 429 Too Many Requests`).
  - **Auditoría de Intentos Inexistentes:** Registro en `seguridad.registros_auditoria` con acción `LOGIN_FALLIDO` aun si el identificador no existe en la academia.
  - **Interceptor 401 y Auto-Logout:** En `apiService.js`, respuestas 401 en llamadas autenticadas disparan desautenticación automática en `AuthContext.js`, limpiando `SecureStore` y devolviendo al usuario a `LoginScreen` con mensaje descriptivo ("Tu sesión ha expirado").
  - **Resiliencia Transaccional:** Mapeo formal de colisiones de cédula a `ExcepcionApi::yaExiste()` (`HTTP 409 Conflict`), captura controlada de `SQLSTATE 23505` en PostgreSQL y transacciones atómicas con `Database::transaction()`.
  - **Ergonomía de Formularios Móviles:** Se integró `KeyboardAvoidingView` en `CreatePlayerScreen` y se erradicó `Alert.alert()` nativo en favor de `FichAppModalFeedback` y validaciones inline con `FichAppInput`.

## 3. Preferencias de Trabajo del Desarrollador
- **Metodología Paso a Paso:** Trabajar una sola tarea a la vez del backlog de ClickUp.
- **Cero Ejecución de Comandos en Terminal:** Para ahorrar consumo de tokens y maximizar velocidad, el agente no debe invocar la herramienta de comandos en terminal (`run_command`). Toda ejecución por consola (pruebas unitarias, linters, verificaciones sintácticas, sincronización ClickUp, migraciones, git) debe presentarse al final del mensaje para ejecución manual por parte del desarrollador.
- **Transparencia Visual / Pruebas:** Indicar siempre dónde ubicarse visualmente en la app para ver los cambios (si es UI), o cómo probarlos con Postman y dónde verlos en base de datos (si es backend).
- **Mantener Resumen de lo Implementado:** Incluir en cada entrega la sección estructurada con el resumen de cambios.
- **Familiaridad y Productividad:** Mantener la estética, convenciones en español y simplicidad de `DIRPOLES-4`.
- **Lenguaje Frontend Móvil:** JavaScript puro (`.js` / `.jsx`) en React Native + Expo SDK 58, sin TypeScript.
- **Diseño Móvil:** Sobrio, claro y balanceado. No convertir todo en tarjetas, no abusar de sombras pesadas ni degradados invasivos, y nunca usar emojis como iconos funcionales.

## 4. Estado Actual del Plan

```
Sprint 0: Cimientos, DB & Auth (List ID: 901718120307) -- 100% COMPLETADO 🎉
  [x] T0.1: Setup PHP 8.5 puro, PSR-4 y Conexión PDO (ID: 86e3zm74p)  <-- COMPLETADA
  [x] T0.2: Router HTTP Ligero y Middlewares de Contexto (ID: 86e3zm74q)  <-- COMPLETADA
  [x] T0.3: Migraciones Base PostgreSQL: Tenants, Usuarios y Auditoría (ID: 86e3zm74r)  <-- COMPLETADA
  [x] T0.4: Servicio de Autenticación, Hashes y Tokens Bearer (ID: 86e3zm74t)  <-- COMPLETADA
  [x] T0.5: Setup de App Móvil Expo (SDK 58) y Navegación por Roles (ID: 86e3zm74u)  <-- COMPLETADA

Sprint 1: Núcleo Deportivo & Familias (List ID: 901718120308) -- 100% COMPLETADO 🎉
  [x] T1.1: Migraciones: Categorías, Equipos, Jugadores y Representantes (ID: 86e3zm74w)  <-- COMPLETADA
  [x] T1.2: Repositorios PDO y Servicios de Fichas Deportivas (ID: 86e3zm74y)  <-- COMPLETADA
  [x] T1.3: Endpoints REST Deportivos (ID: 86e3zm74z)  <-- COMPLETADA
  [x] T1.4: UI Móvil: Directorio de Jugadores y Búsqueda (ID: 86e3zm750)  <-- COMPLETADA

Sprint 1.5: Hardening & Feedback Visual -- 100% COMPLETADO 🎉
  [x] T1.5.1: Rate Limiting (Token Bucket) y Auditoría de Intrusión en Login (429)  <-- COMPLETADA
  [x] T1.5.2: Interceptor Global 401 y Auto-Logout Reactivo en Móvil  <-- COMPLETADA
  [x] T1.5.3: Componente Input con Validación Inline y Toggle Password (Design System)  <-- COMPLETADA
  [x] T1.5.4: Endurecimiento UX en CreatePlayerScreen, LoginScreen y FichAppModalFeedback  <-- COMPLETADA
  [x] T1.5.5: Resiliencia de Transacciones y Manejo de Conflictos HTTP 409  <-- COMPLETADA

Sprint 2: Cancha Offline-First (Asistencia) (List ID: 901718120309) -- SIGUIENTE SPRINT 🚀
  [ ] T2.1: Migraciones Backend: Sesiones y Registros de Asistencia (ID: 86e3zm751)  <-- SIGUIENTE TAREA
  [ ] T2.2: Base de Datos Local SQLite en App Móvil (ID: 86e3zm752)
  [ ] T2.3: UI Móvil Entrenador: Toma de Asistencia Táctil Rápida (ID: 86e3zm753)
  [ ] T2.4: Sincronización en Lote Idempotente (Mobile & API) (ID: 86e3zm754)
Sprint 3: Obligaciones & Pronto-Pago (List ID: 901718120310) -- PENDIENTE
Sprint 4: Pagos Multihijo & Tasa BCV (List ID: 901718120311) -- PENDIENTE
Sprint 5: Gastos & Piloto Obelisco FC (List ID: 901718120313) -- PENDIENTE
```
