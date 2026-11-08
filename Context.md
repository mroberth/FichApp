# Context.md — Contexto y Arquitectura de FichApp

Explica qué es el proyecto, cómo está construido y por qué.

---

## 1. Propósito del Proyecto
**FichApp** es una plataforma SaaS móvil-first para la administración y gestión deportiva de academias, clubes y escuelas deportivas en América Latina, con una validación inicial en la academia piloto **Obelisco FC** (Barquisimeto, Venezuela). Resuelve el control de cobranza bimonetaria (USD/VES), pagos familiares múltiples, descuentos por pronto-pago y asistencia técnica *offline-first* en cancha.

## 2. Stack Tecnológico Completo
- **Backend:** PHP 8.5 puro sin frameworks pesados, con extensiones nativas `pdo`, `pdo_pgsql` y `bcmath`.
- **Autoloading & Estándares:** Composer con PSR-4 (`FichApp\`), PSR-7 / PSR-15 para manejo HTTP, PSR-12 para estilo de código.
- **Base de Datos:** PostgreSQL 16+ con UUIDs, tipos `NUMERIC(12,2)` para dólares, `NUMERIC(18,2)` para bolívares y `NUMERIC(18,8)` para tasas BCV.
- **Frontend Móvil:** React Native + Expo (SDK 52), Expo SQLite para almacenamiento local en cancha y TanStack Query.
- **Gestión de Proyecto:** ClickUp API v2 integrado mediante `scripts/clickup_sync.py` (Espacio ID: `90178086008`).

## 3. Arquitectura General (Capas y Patrones)
El backend implementa una arquitectura limpia basada en **Service-Repository Pattern**:
- **Capa HTTP (`src/Infrastructure/Http/`):**
  - `Router.php`: Enrutador REST ligero con soporte de rutas dinámicas `/api/v1/.../{id}`.
  - `Middlewares/`: `CorsMiddleware`, `TenantContextMiddleware` (resuelve e inyecta `academia_id`), `AuthMiddleware` (valida Bearer token).
  - `Controllers/`: Manejadores que extraen parámetros, delegan en servicios y devuelven respuestas JSON estándar.
- **Capa de Aplicación (`src/Application/`):**
  - Servicios de casos de uso (ej. `RegistrarPagoFamiliarService`, `EvaluarProntoPagoService`, `SincronizarAsistenciaService`).
  - Orquestan transacciones de base de datos con `PDO::beginTransaction()` y `commit()`.
- **Capa de Dominio (`src/Domain/`):**
  - Entidades, Enums puros (`EstadoPago`, `EstadoObligacion`, `RolUsuario`) y Value Objects inmutables.
- **Capa de Persistencia (`src/Infrastructure/Persistence/`):**
  - `Database.php`: Conexión PDO Singleton configurada con `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION` y `PDO::ATTR_EMULATE_PREPARES => false`.
  - `Repositories/`: Clases de acceso a datos con consultas SQL preparadas y filtros obligatorios por `academia_id`.

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
│   ├── composer.json                    # Dependencias mínimas y autoloading PSR-4
│   ├── public/                          # Punto de entrada HTTP (index.php)
│   ├── config/                          # Configuración y conexión de BD
│   ├── src/                             # Código fuente en capas (Domain, App, Infra)
│   ├── migrations/                      # Scripts SQL versionados para PostgreSQL
│   └── tests/                           # Tests unitarios e integración (PHPUnit)
└── mobile/                              # App móvil en React Native + Expo SDK 52
```

## 5. Integraciones Externas
- **ClickUp API REST v2:** Gestión y seguimiento del roadmap y los 6 Sprints del MVP mediante `scripts/clickup_sync.py`.
- **Tasas de Cambio Oficiales:** Soporte para registro manual y futura consulta automatizada de la tasa BCV (VES/USD).

## 6. Decisiones Técnicas Clave
- **PHP 8.5 puro sobre frameworks:** Máxima velocidad de ejecución, menor consumo de memoria, cero deuda técnica por upgrades de versiones y dominio pleno del stack.
- **Desacoplamiento Pagos/Imputaciones:** Un pago bancario único (`pagos`) puede distribuirse en múltiples cuotas (`imputaciones_pago`) para soportar familias con varios hijos.
- **Bolsa de Saldo a Favor:** Excedentes de pago o redondeos quedan acreditados al representante (`saldos_a_favor`) para amortizar futuras cuotas.
- **Asistencia Offline en Cancha:** Los entrenadores operan sin conexión mediante SQLite local en React Native; los registros se envían al backend por lote con resolución idempotente de conflictos.
