# Context.md — Contexto y Arquitectura de FichApp

Explica qué es el proyecto, cómo está construido y por qué.

---

## 1. Propósito del Proyecto
**FichApp** es una plataforma SaaS móvil-first para la administración y gestión deportiva de academias, clubes y escuelas deportivas en América Latina, con una validación inicial en la academia piloto **Obelisco FC** (Barquisimeto, Venezuela). Resuelve el control de cobranza bimonetaria (USD/VES), pagos familiares múltiples, descuentos por pronto-pago y asistencia técnica *offline-first* en cancha.

## 2. Stack Tecnológico Completo
- **Backend:** PHP 8.5 puro sin frameworks pesados, con extensiones nativas `pdo`, `pdo_pgsql` y `bcmath`.
- **Autoloading & Estándares:** Composer con PSR-4 (`App\` $\rightarrow$ `app/`), PSR-12 para estilo de código.
- **Base de Datos:** PostgreSQL 16+ con UUIDs v4, tipos `NUMERIC(12,2)` para dólares, `NUMERIC(18,2)` para bolívares y `NUMERIC(18,8)` para tasas BCV. Esquemas separados: `seguridad` y `negocio`.
- **Frontend Móvil:** React Native 0.88 + React 19 + Expo SDK 58 en **JavaScript puro** (`.js` / `.jsx`, sin TypeScript).
- **Sistema de Diseño Móvil:** FichApp Design System (`mobile/.antigravity/SKILLS/fichapp-design-system/`) con tokens centralizados en `mobile/src/theme/tokens.js`, Tema Claro (Light Theme) sobrio tipo Notion/Figma, e iconografía vectorial con `lucide-react-native` + `react-native-svg` (cero emojis).
  - **Patrón Visual Aprobado:** Arquitectura *Hero Branding Split* (cabecera en azul petróleo con tipografía blanca y verde lima, superpuesta a una hoja inferior blanca curvada `borderTopLeftRadius: 32` para controles y contenido táctil).
  - **Componentes Base Compartidos:** `FichAppInput` (validación inline, foco dinámico, toggle `Eye`/`EyeOff`), `FichAppModalFeedback` (feedback y confirmaciones desacopladas de `Alert.alert`), `FichAppLogo` y `FichAppLogoCompleto` (vectorizados desde `fichapp-2.svg`).
- **Manejo de Áreas Seguras Móvil:** `react-native-safe-area-context`.
- **Almacenamiento Seguro Móvil:** `expo-secure-store` para persistencia de tokens de sesión y contexto del usuario autenticado.
- **Conectividad y Red:** Detección dinámica de IP LAN (`expo-constants` / `hostUri`) con fallback a `192.168.50.117:8000`, timeout de 8 segundos con `AbortController` en peticiones HTTP, e interceptor global `401 Unauthorized` en `apiService.js` con purga y auto-logout reactivo en `AuthContext.js`.
- **Almacenamiento Local en Cancha:** Expo SQLite (para la toma de asistencia offline en Sprint 2).
- **Gestión de Proyecto:** ClickUp API v2 integrado mediante `scripts/clickup_sync.py` (Espacio ID: `90178086008`, Equipo: `90171306703`).

## 3. Arquitectura General Backend (Patrón DTO - Controller - Service - Repository)
El backend implementa una arquitectura desacoplada, estandarizada en español e inspirada en el flujo probado de `DIRPOLES-4`:
- **Capa DTO (`app/DTOs/`):**
  - Clases inmutables (`readonly class`) fuertemente tipadas en PHP 8.5.
  - Sanitizan y estructuran los datos de entrada antes de llegar a la lógica de negocio (`desdePeticion()`).
- **Capa Controladores (`app/Controllers/`):**
  - Funciones limpias e independientes (ej. `apiLogin()`, `apiCerrarSesion()`, `apiRegistrarPago()`).
  - Obtienen los datos de la petición, instancian el DTO, ejecutan el Servicio y devuelven la respuesta mediante `App\Core\Respuesta::exito()` o atrapan con `App\Core\Respuesta::error($e)`.
- **Capa Servicios (`app/Services/`):**
  - El cerebro del negocio: Reglas financieras, autenticación, cálculo de pronto-pago, tasa BCV y validaciones de dominio.
  - Si una validación falla, **LANZA** `throw ExcepcionApi::validacion(...)`, `ExcepcionApi::noEncontrado(...)`, etc.
  - Orquesta transacciones seguras con `Database::transaction()`.
- **Capa Repositorios (`app/Repositories/`):**
  - Acceso directo a base de datos mediante consultas preparadas con PDO.
  - Filtro obligatorio por `academia_id`.
  - Cero validaciones en el repositorio.
- **Capa Núcleo (`app/Core/`):**
  - `Respuesta.php`: Contrato JSON único: `{"exito": true, "datos": ...}` y `{"exito": false, "error": {...}}`.
  - `ExcepcionApi.php`: Única excepción de negocio que transporta código, estado HTTP y mensaje en español (incluye `demasiadasPeticiones()` HTTP 429 y `yaExiste()` HTTP 409).
  - `ErrorCodes.php`: Constantes estables para que el frontend programe contra ellas (incluye `DEMASIADAS_PETICIONES`, `YA_EXISTE`, `NO_AUTENTICADO`).
  - `Database.php`: Conexión PDO estricta y transacciones atómicas.
  - `DecimalMath.php`: Aritmética fija en USD y VES mediante `bcmath`.
  - `Env.php`: Parser de entorno `.env`.
- **Capa Middlewares (`app/Middlewares/`):**
  - `CorsMiddleware.php`: Soporte para pre-flights OPTIONS y cabeceras CORS.
  - `TenantMiddleware.php`: Resolución y validación del contexto multi-tenant (`academia_id`).
  - `AuthMiddleware.php`: Extracción de Bearer token y resolución de `Auth` y roles permitidos.
  - `RateLimitMiddleware.php`: Token Bucket limiter para mitigar ataques de fuerza bruta emitiendo HTTP 429 y cabeceras estándar.

## 4. Arquitectura General Frontend Móvil (React Native + Expo SDK 58)
- **Tema y Tokens (`mobile/src/theme/`):**
  - `tokens.js`: Define colores (`fondo: #F3F6F2`, `superficie: #FFFFFF`, `marcaPrimario: #174D50`, `marcaAcento: #B9E44A`, `textoPrimario: #252B27`), espaciados (4, 8, 12, 16, 20, 24, 32), radios de borde (4, 8, 12, 16, 999), sombras sutiles y estilos tipográficos.
  - `index.js`: Reexporta tokens listos para consumir en componentes.
- **Navegación Condicional por Rol (`mobile/src/navigation/`):**
  - `RootNavigator.js`: Escucha el estado de `AuthContext`.
  - Si no está autenticado $\rightarrow$ `LoginScreen`.
  - Si el rol es `admin` o `superadmin` $\rightarrow$ `AdminDashboardScreen`.
  - Si el rol es `entrenador` $\rightarrow$ `CoachDashboardScreen`.
  - Si el rol es `representante` $\rightarrow$ Flujo de familias y pagos.
- **Servicios e Integración (`mobile/src/services/` y `mobile/src/config/`):**
  - `api.js`: Resuelve la URL base (`http://<IP_LAN>:8000/api/v1`) evitando la trampa de `localhost`/`10.0.2.2` para dispositivos reales en red Wi-Fi.
  - `apiService.js`: Wrapper de `fetch` con timeout (8s), inyección automática del token Bearer y manejo normalizado de errores `{ exito: false, error: ... }`.
  - `storage.js`: Almacenamiento seguro en el llavero nativo mediante `expo-secure-store`.
- **Contexto Global (`mobile/src/context/`):**
  - `AuthContext.js`: Provee `usuario`, `sesion`, `cargando`, funciones `iniciarSesion(identificador, contrasena)` y `cerrarSesion()`.

## 5. Estructura de Carpetas del Proyecto
```
/home/mroberth/Proyectos/fichapp/
├── AGENTS.md                            # Límites de autonomía y reglas del agente
├── Context.md                           # Arquitectura y mapa del proyecto
├── Memory.md                            # Decisiones cerradas y estado actual
├── Skills.md                            # Procedimientos y runbooks reutilizables
├── docs/                                # Especificación técnica V0.3
├── scripts/                             # Scripts de ClickUp y automatización
├── backend/                             # API REST en PHP 8.5 puro
│   ├── composer.json                    # Autoloading App\ -> app/ y scripts
│   ├── public/                          # Punto de entrada HTTP (index.php)
│   ├── app/
│   │   ├── Config/                      # Configuración de base de datos y entorno
│   │   ├── Core/                        # Respuesta, ExcepcionApi, ErrorCodes, Database, DecimalMath, Env
│   │   ├── Controllers/                 # Funciones controladoras (ej. AuthController.php)
│   │   ├── DTOs/                        # Clases de transferencia de datos tipadas
│   │   ├── Services/                    # Lógica de negocio y validaciones (ej. AuthService.php)
│   │   ├── Repositories/                # Consultas SQL preparadas con PDO
│   │   ├── Models/                      # Modelos/Entidades de datos
│   │   ├── Middlewares/                 # TenantMiddleware, AuthMiddleware, CorsMiddleware
│   │   └── routes/                      # Definición de rutas REST (api.php)
│   ├── migrations/                      # Scripts SQL versionados para PostgreSQL
│   ├── scripts/                         # Scripts CLI (migrate.php, seed.php)
│   └── tests/                           # Tests unitarios e integración (PHPUnit)
└── mobile/                              # App móvil en React Native + Expo SDK 58 (JavaScript puro)
    ├── App.js                           # Punto de entrada principal y envoltura AuthProvider
    ├── app.json                         # Configuración oficial Expo SDK 58
    ├── package.json                     # Dependencias (react 19, react-native 0.88, lucide-react-native, etc.)
    ├── .antigravity/SKILLS/
    │   └── fichapp-design-system/       # Normativa oficial del Sistema de Diseño FichApp
    └── src/
        ├── config/                      # Configuración de endpoints y red LAN (api.js)
        ├── context/                     # Contextos globales de React (AuthContext.js)
        ├── navigation/                  # Navegación condicional por roles (RootNavigator.js)
        ├── screens/                     # Pantallas de la aplicación
        │   ├── auth/                    # LoginScreen.js
        │   ├── admin/                   # AdminDashboardScreen.js
        │   └── coach/                   # CoachDashboardScreen.js
        ├── services/                    # Clientes de API (apiService.js) y almacenamiento (storage.js)
        └── theme/                       # Tokens de diseño oficiales (tokens.js, index.js)
```
