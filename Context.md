# Context.md — Contexto y Arquitectura de FichApp

Explica qué es el proyecto, cómo está construido y por qué.

---

## 1. Propósito del Proyecto
**FichApp** es una plataforma SaaS móvil-first para la administración y gestión deportiva de academias, clubes y escuelas deportivas en América Latina, con una validación inicial en la academia piloto **Obelisco FC** (Barquisimeto, Venezuela). Resuelve el control de cobranza bimonetaria (USD/VES), pagos familiares múltiples, descuentos por pronto-pago y asistencia técnica *offline-first* en cancha.

## 2. Stack Tecnológico Completo
- **Backend:** PHP 8.5 puro sin frameworks pesados, con extensiones nativas `pdo`, `pdo_pgsql` y `bcmath`.
- **Autoloading & Estándares:** Composer con PSR-4 (`App\` $\rightarrow$ `app/`), PSR-12 para estilo de código.
- **Base de Datos:** PostgreSQL 16+ con UUIDs, tipos `NUMERIC(12,2)` para dólares, `NUMERIC(18,2)` para bolívares y `NUMERIC(18,8)` para tasas BCV.
- **Frontend Móvil:** React Native + Expo (SDK 52), Expo SQLite para almacenamiento local en cancha y TanStack Query.
- **Gestión de Proyecto:** ClickUp API v2 integrado mediante `scripts/clickup_sync.py` (Espacio ID: `90178086008`).

## 3. Arquitectura General (Patrón DTO - Controller - Service - Repository)
El backend implementa una arquitectura desacoplada, estandarizada en español e inspirada en el flujo probado de `DIRPOLES-4`:
- **Capa DTO (`app/DTOs/`):**
  - Clases inmutables (`readonly class`) fuertemente tipadas en PHP 8.5.
  - Sanitizan y estructuran los datos de entrada antes de llegar a la lógica de negocio.
- **Capa Controladores (`app/Controllers/`):**
  - Funciones limpias e independientes (ej. `apiRegistrarPago()`, `apiListarJugadores()`).
  - Obtienen los datos de la petición, instancian el DTO, ejecutan el Servicio y devuelven la respuesta mediante `App\Core\Respuesta::exito()` o atrapan con `App\Core\Respuesta::error($e)`.
- **Capa Servicios (`app/Services/`):**
  - El cerebro del negocio: Reglas financieras, cálculo de pronto-pago, tasa BCV, y validaciones de datos.
  - Si una validación falla, **LANZA** `throw ExcepcionApi::validacion(...)`, `ExcepcionApi::noEncontrado(...)`, etc.
  - Orquesta transacciones seguras con `Database::transaction()`.
- **Capa Repositorios (`app/Repositories/`):**
  - Acceso directo a base de datos mediante consultas preparadas con PDO.
  - Filtro obligatorio por `academia_id`.
  - Cero validaciones en el repositorio.
- **Capa Núcleo (`app/Core/`):**
  - `Respuesta.php`: Contrato JSON único: `{"exito": true, "datos": ...}` y `{"exito": false, "error": {...}}`.
  - `ExcepcionApi.php`: Única excepción de negocio que transporta código, estado HTTP y mensaje en español.
  - `ErrorCodes.php`: Constantes estables para que el frontend programe contra ellas.
  - `Database.php`: Conexión PDO estricta y transacciones.
  - `DecimalMath.php`: Aritmética fija en USD y VES.
  - `Env.php`: Parser de entorno.

## 4. Estructura de Carpetas del Proyecto
```
/home/mroberth/Proyectos/fichapp/
├── AGENTS.md                            # Límites de autonomía y reglas del agente
├── Context.md                           # Arquitectura y mapa del proyecto
├── Memory.md                            # Decisiones cerradas y estado actual
├── Skills.md                            # Procedimientos repetibles del proyecto
├── docs/                                # Especificación técnica V0.3
├── scripts/                             # Scripts de ClickUp y automatización
├── backend/                             # API REST en PHP 8.5 puro
│   ├── composer.json                    # Autoloading App\ -> app/
│   ├── public/                          # Punto de entrada HTTP (index.php)
│   ├── app/
│   │   ├── Config/                      # Configuración de base de datos y entorno
│   │   ├── Core/                        # Respuesta, ExcepcionApi, ErrorCodes, Database, DecimalMath
│   │   ├── Controllers/                 # Funciones controladoras (ej. pagoController.php)
│   │   ├── DTOs/                        # Clases de transferencia de datos tipadas
│   │   ├── Services/                    # Lógica de negocio y validaciones
│   │   ├── Repositories/                # Consultas SQL preparadas con PDO
│   │   ├── Models/                      # Modelos/Entidades de datos
│   │   ├── Middlewares/                 # TenantMiddleware, AuthMiddleware, CorsMiddleware
│   │   └── routes/                      # Rutas de la API (api.php)
│   ├── migrations/                      # Scripts SQL versionados para PostgreSQL
│   └── tests/                           # Tests unitarios e integración (PHPUnit)
└── mobile/                              # App móvil en React Native + Expo SDK 52
```
