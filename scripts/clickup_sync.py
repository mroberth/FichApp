#!/usr/bin/env python3
"""
clickup_sync.py - Gestor de Sprints y Tareas en ClickUp para FichApp
"""

import json
import os
import sys
import urllib.request
import urllib.error

API_KEY = "pk_118025677_1XG5YSH7KYYTCZOA518C4Y9ZQLJ35RES"
TEAM_ID = "90171306703"
BASE_URL = "https://api.clickup.com/api/v2"
MAPPING_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "clickup_mapping.json")

HEADERS = {
    "Authorization": API_KEY,
    "Content-Type": "application/json"
}

SPRINTS_DATA = [
    {
        "name": "Sprint 0: Cimientos, DB & Auth",
        "tasks": [
            {
                "code": "T0.1",
                "name": "[T0.1] Setup PHP 8.5 puro, PSR-4 y Conexión PDO",
                "priority": 2, # High
                "description": """### Objetivo
Inicializar la estructura del backend en PHP 8.5 sin frameworks, configurando autoloading PSR-4, lectura de variables de entorno (.env), contenedor ligero de inyección de dependencias y conexión singleton/pool a PostgreSQL vía PDO.

### Criterios de Aceptación (DoD)
- [ ] Archivo `composer.json` con soporte PSR-4 (`FichApp\\`).
- [ ] Clase `Database` configurada con opciones PDO estrictas (`ERRMODE_EXCEPTION`, `EMULATE_PREPARES => false`).
- [ ] Variables de entorno cargadas con soporte para variables de test y producción.
- [ ] Prueba de conexión a PostgreSQL exitosa."""
            },
            {
                "code": "T0.2",
                "name": "[T0.2] Router HTTP Ligero y Middlewares de Contexto",
                "priority": 2,
                "description": """### Objetivo
Implementar un enrutador HTTP modular que soporte verbos REST, parámetros en ruta (`/api/v1/.../{id}`), y la cadena de middlewares para aislamiento multi-tenant y autenticación.

### Criterios de Aceptación (DoD)
- [ ] Router que maneja `GET`, `POST`, `PATCH`, `DELETE` y respuestas JSON estándar.
- [ ] `CorsMiddleware` configurado para llamadas desde la app Expo.
- [ ] `TenantContextMiddleware` que extrae y valida el `academia_id` de la sesión.
- [ ] Pruebas de rutas básicas respondiendo `200 OK` y `404 Not Found`."""
            },
            {
                "code": "T0.3",
                "name": "[T0.3] Migraciones Base PostgreSQL: Tenants, Usuarios y Auditoría",
                "priority": 1, # Urgent
                "description": """### Objetivo
Crear y ejecutar los scripts SQL de migración iniciales para las tablas maestras de aislamiento y seguridad.

### Criterios de Aceptación (DoD)
- [ ] Tablas creadas: `academias`, `usuarios`, `registros_auditoria`.
- [ ] Extensión `uuid-ossp` o generación nativa de UUIDs.
- [ ] Restricciones `CHECK` para roles (`superadmin`, `administrador`, `entrenador`) y estados.
- [ ] Índices compuestos y restricción de unicidad `(academia_id, identificador_acceso)`."""
            },
            {
                "code": "T0.4",
                "name": "[T0.4] Servicio de Autenticación, Hashes y Tokens Bearer",
                "priority": 2,
                "description": """### Objetivo
Implementar el login seguro para administradores y entrenadores, almacenamiento de contraseñas con `password_hash` (Argon2id/Bcrypt) y emisión/validación de tokens de sesión.

### Criterios de Aceptación (DoD)
- [ ] Endpoint `POST /api/v1/auth/login`.
- [ ] Endpoint `GET /api/v1/auth/me` con datos del usuario y tenant.
- [ ] `AuthMiddleware` que protege rutas privadas verificando validez y expiración del token."""
            },
            {
                "code": "T0.5",
                "name": "[T0.5] Setup de App Móvil Expo y Navegación por Roles",
                "priority": 3, # Normal
                "description": """### Objetivo
Inicializar el proyecto móvil con React Native + Expo (SDK 52), configuración de almacenamiento seguro (Expo SecureStore) para el token JWT y navegación condicional para Administradores y Entrenadores.

### Criterios de Aceptación (DoD)
- [ ] Proyecto Expo inicializado y compilando en Android/iOS.
- [ ] Flujo de Login con almacenamiento seguro del token.
- [ ] Separación de stacks de navegación: `AdminStack` vs `CoachStack`."""
            }
        ]
    },
    {
        "name": "Sprint 1: Núcleo Deportivo & Familias",
        "tasks": [
            {
                "code": "T1.1",
                "name": "[T1.1] Migraciones: Categorías, Equipos, Jugadores y Representantes",
                "priority": 2,
                "description": """### Objetivo
Crear las tablas de la estructura deportiva y el padrón de familias en PostgreSQL.

### Criterios de Aceptación (DoD)
- [ ] Tablas: `categorias`, `equipos`, `representantes`, `jugadores`, `jugadores_representantes`, `asignaciones_jugadores_equipos`, `asignaciones_entrenadores_equipos`.
- [ ] Claves foráneas con restricción estricta (`ON DELETE RESTRICT`).
- [ ] Índices de búsqueda por apellidos, nombres y cédula."""
            },
            {
                "code": "T1.2",
                "name": "[T1.2] Repositorios PDO y Servicios de Fichas Deportivas",
                "priority": 2,
                "description": """### Objetivo
Implementar los repositorios y servicios de dominio para gestión de jugadores, equipos y parentescos familiares (un padre con múltiples hijos).

### Criterios de Aceptación (DoD)
- [ ] `PlayerRepository` y `RepresentativeRepository` con consultas parametrizadas.
- [ ] Servicio para registrar jugador vinculándolo a su representante legal y equipo.
- [ ] Soporte para consulta de grupo familiar (hijos asociados a un representante)."""
            },
            {
                "code": "T1.3",
                "name": "[T1.3] Endpoints REST Deportivos",
                "priority": 3,
                "description": """### Objetivo
Exponer los endpoints REST para categorías, equipos, jugadores y representantes.

### Criterios de Aceptación (DoD)
- [ ] `GET /api/v1/players` (con filtros por equipo y categoría).
- [ ] `POST /api/v1/players` (creación de ficha).
- [ ] `GET /api/v1/teams` y `GET /api/v1/categories`.
- [ ] `GET /api/v1/representatives/{id}/family`."""
            },
            {
                "code": "T1.4",
                "name": "[T1.4] UI Móvil: Directorio de Jugadores y Búsqueda",
                "priority": 3,
                "description": """### Objetivo
Pantalla en React Native con listado rápido de jugadores, buscador en tiempo real y vista de ficha detallada.

### Criterios de Aceptación (DoD)
- [ ] Lista con tarjetas de jugadores con foto/iniciales y categoría.
- [ ] Barra de búsqueda con debounce por nombre o cédula.
- [ ] Vista de detalle del jugador con datos de contacto del representante."""
            }
        ]
    },
    {
        "name": "Sprint 1.5: Hardening & Feedback Visual",
        "tasks": [
            {
                "code": "T1.5.1",
                "name": "[T1.5.1] Rate Limiting y Auditoría de Intrusión en Login",
                "priority": 1, # Urgent
                "description": """### Objetivo
Proteger el endpoint `POST /api/v1/auth/login` contra ataques de fuerza bruta y registrar intentos con usuarios inexistentes en la bitácora de auditoría.

### Criterios de Aceptación (DoD)
- [ ] Mecanismo de limitación de tasa (Rate Limiting) de máximo 5 intentos fallidos cada 15 minutos por IP / identificador.
- [ ] Registro en `seguridad.registros_auditoria` con acción `LOGIN_FALLIDO` aun si el usuario no existe en la academia.
- [ ] Respuesta con código HTTP 429 Too Many Requests cuando se excede el umbral de seguridad."""
            },
            {
                "code": "T1.5.2",
                "name": "[T1.5.2] Interceptor Global 401 y Auto-Logout Reactivo en Móvil",
                "priority": 2, # High
                "description": """### Objetivo
Garantizar que ante cualquier respuesta HTTP 401 (token expirado o revocado en base de datos), la app móvil purgue la sesión y redirija automáticamente al Login sin quedar colgada.

### Criterios de Aceptación (DoD)
- [ ] `apiService.js` o interceptor que captura respuestas con status 401.
- [ ] Invocación inmediata a `limpiarTodo()` de `storage.js` y actualización del estado en `AuthContext`.
- [ ] Redirección automática a `LoginScreen` con feedback visual desacoplado ("Tu sesión ha expirado")."""
            },
            {
                "code": "T1.5.3",
                "name": "[T1.5.3] Componente Input con Validación Inline y Toggle Password (Design System)",
                "priority": 2, # High
                "description": """### Objetivo
Crear componente de entrada reutilizable bajo `fichapp-design-system` para mostrar errores inline y visibilidad de contraseña sin alertas nativas.

### Criterios de Aceptación (DoD)
- [ ] Soporte para estados: normal, enfocado, deshabilitado y error (`COLORES.danger` en borde).
- [ ] Renderizado de mensaje de error inline debajo del campo (`error.detalles`).
- [ ] Toggle para ver/ocultar contraseña con iconos de Lucide (`Eye` / `EyeOff`).
- [ ] Cero emojis, apego estricto a `tokens.js`."""
            },
            {
                "code": "T1.5.4",
                "name": "[T1.5.4] Endurecimiento UX en CreatePlayerScreen y LoginScreen",
                "priority": 2, # High
                "description": """### Objetivo
Eliminar `Alert.alert` nativo en formularios de atletas y login, agregando `KeyboardAvoidingView` para pantallas de teléfonos reales.

### Criterios de Aceptación (DoD)
- [ ] `KeyboardAvoidingView` en `CreatePlayerScreen` para evitar que el teclado tape los inputs y botones de acción.
- [ ] Reemplazar todos los `Alert.alert()` nativos por banners de error y modales de confirmación con tokens del sistema de diseño.
- [ ] Validación previa en frontend con `.trim()` y feedback visual inmediato."""
            },
            {
                "code": "T1.5.5",
                "name": "[T1.5.5] Resiliencia de Transacciones y Manejo de Conflictos HTTP 409",
                "priority": 2, # High
                "description": """### Objetivo
Mejorar la consistencia transaccional y el manejo de excepciones de base de datos en el backend.

### Criterios de Aceptación (DoD)
- [ ] Cédulas duplicadas en `JugadorService` retornan `ExcepcionApi::yaExiste()` con código HTTP 409 Conflict.
- [ ] Captura controlada de colisiones únicas de PostgreSQL (`SQLSTATE 23505`) para evitar errores 500 no controlados.
- [ ] Transacciones atómicas con `Database::transaction()` en todas las operaciones compuestas."""
            }
        ]
    },
    {
        "name": "Sprint 2: Cancha Offline-First (Asistencia)",
        "tasks": [
            {
                "code": "T2.1",
                "name": "[T2.1] Migraciones Backend: Sesiones y Registros de Asistencia",
                "priority": 2,
                "description": """### Objetivo
Crear las tablas `sesiones_asistencia` y `registros_asistencia` preparadas para recibir UUIDs generados desde el móvil.

### Criterios de Aceptación (DoD)
- [ ] Tablas creadas con claves primarias UUID sin `DEFAULT uuid_generate_v4()` para admitir IDs de cliente.
- [ ] Restricción de unicidad `uq_asistencia_jugador_sesion`."""
            },
            {
                "code": "T2.2",
                "name": "[T2.2] Base de Datos Local SQLite en App Móvil",
                "priority": 1,
                "description": """### Objetivo
Configurar Expo SQLite en la app móvil para almacenar localmente las convocatorias, sesiones y asistencias tomadas sin red.

### Criterios de Aceptación (DoD)
- [ ] Tablas locales `local_sesiones` y `local_asistencias`.
- [ ] Generación de UUIDs v4 en el dispositivo móvil.
- [ ] Estado `sync_status = 'pending' | 'synced'`."""
            },
            {
                "code": "T2.3",
                "name": "[T2.3] UI Móvil Entrenador: Toma de Asistencia Táctil Rápida",
                "priority": 2,
                "description": """### Objetivo
Pantalla optimizada para uso en cancha con un solo pulgar: marcar presente, ausente o justificado en segundos.

### Criterios de Aceptación (DoD)
- [ ] Listado de jugadores del equipo con botones rápidos (Verde: Presente, Rojo: Ausente, Amarillo: Justificado).
- [ ] Campo para observaciones rápidas (ej. lesión o fiebre).
- [ ] Indicador visual: 'Guardado localmente (Offline)' o 'Sincronizado'."""
            },
            {
                "code": "T2.4",
                "name": "[T2.4] Sincronización en Lote Idempotente (Mobile & API)",
                "priority": 1,
                "description": """### Objetivo
Worker móvil en segundo plano que detecta conectividad y envía lotes de asistencia a `POST /api/v1/attendance/sync` con resolución de conflictos en backend.

### Criterios de Aceptación (DoD)
- [ ] Endpoint `POST /api/v1/attendance/sync` con soporte transaccional y `ON CONFLICT DO UPDATE`.
- [ ] Marcar en SQLite local como 'synced' al recibir `200 OK`.
- [ ] Prueba de reintento doble sin duplicar registros."""
            }
        ]
    },
    {
        "name": "Sprint 3: Obligaciones & Pronto-Pago",
        "tasks": [
            {
                "code": "T3.1",
                "name": "[T3.1] Migraciones: Políticas de Cobranza y Obligaciones",
                "priority": 2,
                "description": """### Objetivo
Crear tablas `politicas_cobranza`, `excepciones_cobro_jugadores`, `obligaciones` y `ajustes_obligaciones`.

### Criterios de Aceptación (DoD)
- [ ] Tipos decimales exactos `NUMERIC(12,2)` para montos en USD.
- [ ] Restricción de unicidad para impedir duplicar la mensualidad del mismo mes por jugador."""
            },
            {
                "code": "T3.2",
                "name": "[T3.2] Servicio Generador Masivo Idempotente de Mensualidades",
                "priority": 1,
                "description": """### Objetivo
Servicio backend en PHP que toma un período (mes) y genera las obligaciones de todos los jugadores activos del club.

### Criterios de Aceptación (DoD)
- [ ] Evaluación de políticas vigentes ($25 ordinario, $20 pronto-pago al día 15).
- [ ] Detección automática de tarifas reducidas o exoneraciones vigentes por jugador.
- [ ] Ejecución idempotente: correrlo dos veces para el mismo mes no genera duplicados."""
            },
            {
                "code": "T3.3",
                "name": "[T3.3] UI Móvil Admin: Tablero de Facturación y Obligaciones",
                "priority": 3,
                "description": """### Objetivo
Pantalla administrativa móvil para consultar las cuotas del mes, morosidad y estatus de cobro.

### Criterios de Aceptación (DoD)
- [ ] Vista resumida de obligaciones: Pendientes, Parciales, Pagadas, Vencidas.
- [ ] Botón para generar mensualidades del mes corriente con confirmación."""
            }
        ]
    },
    {
        "name": "Sprint 4: Pagos Multihijo & Tasa BCV",
        "tasks": [
            {
                "code": "T4.1",
                "name": "[T4.1] Migraciones: Pagos Desacoplados, Imputaciones y Saldo a Favor",
                "priority": 1,
                "description": """### Objetivo
Crear tablas `tasas_cambio`, `pagos`, `imputaciones_pago` y `saldos_a_favor`.

### Criterios de Aceptación (DoD)
- [ ] Tabla `pagos` desacoplada con clave de idempotencia única.
- [ ] Tabla `imputaciones_pago` con clave foránea a `obligaciones`.
- [ ] Tabla `saldos_a_favor` asociada al representante."""
            },
            {
                "code": "T4.2",
                "name": "[T4.2] Módulo de Tasas de Cambio Oficial BCV",
                "priority": 2,
                "description": """### Objetivo
Gestión de tasas de cambio históricas con fecha de vigencia y soporte para registro manual por el administrador.

### Criterios de Aceptación (DoD)
- [ ] `POST /api/v1/exchange-rates` y `GET /api/v1/exchange-rates/latest`.
- [ ] Validación de fecha efectiva y protección contra tasas cero o negativas."""
            },
            {
                "code": "T4.3",
                "name": "[T4.3] Servicio RegistrarPagoFamiliarService y Aritmética BCMath",
                "priority": 1,
                "description": """### Objetivo
El corazón transaccional del sistema: registrar el pago recibido en USD o VES, convertirlo exactamente a USD y distribuirlo en 1 o varias obligaciones familiares.

### Criterios de Aceptación (DoD)
- [ ] Bloqueo pesimista `FOR UPDATE` en obligaciones.
- [ ] Conversión con `bcdiv` para VES y validación estricta de sumas.
- [ ] Acreditación automática de remanentes en `saldos_a_favor`.
- [ ] Protección por clave de idempotencia."""
            },
            {
                "code": "T4.4",
                "name": "[T4.4] Motor de Pronto-Pago Acumulativo y Descuentos",
                "priority": 1,
                "description": """### Objetivo
Evaluar si la suma de abonos confirmados recibidos hasta el día 15 alcanza la meta de pronto-pago ($20) y registrar la nota de descuento de -$5.

### Criterios de Aceptación (DoD)
- [ ] Abonos múltiples en días distintos suman para la meta.
- [ ] Registro de nota de descuento en `ajustes_obligaciones` con monto negativo.
- [ ] Pérdida automática del beneficio si no se completa el monto antes del cierre del día 15."""
            },
            {
                "code": "T4.5",
                "name": "[T4.5] Servicio de Reversión Financiera Auditable",
                "priority": 2,
                "description": """### Objetivo
Permitir anular un pago registrado por error sin borrar el registro físico de la base de datos.

### Criterios de Aceptación (DoD)
- [ ] Marcar pago como `revertido` con fecha, responsable y motivo.
- [ ] Anular imputaciones y recalcular inmediatamente el saldo de las obligaciones.
- [ ] Revocación del descuento de pronto-pago si el pago anulado era necesario para cumplir la meta."""
            },
            {
                "code": "T4.6",
                "name": "[T4.6] UI Móvil Admin: Formulario de Cobro Rápido Familiar",
                "priority": 2,
                "description": """### Objetivo
Pantalla en la app móvil donde el administrador selecciona al representante, ingresa el Pago Móvil o Efectivo y distribuye el monto entre las cuotas de los hijos.

### Criterios de Aceptación (DoD)
- [ ] Calculadora automática en vivo del equivalente en USD según tasa BCV del día.
- [ ] Selector con casillas de verificación de las mensualidades de los hijos.
- [ ] Opción para subir captura o número de referencia bancaria."""
            }
        ]
    },
    {
        "name": "Sprint 5: Gastos & Piloto Obelisco FC",
        "tasks": [
            {
                "code": "T5.1",
                "name": "[T5.1] Módulo de Egresos y Gastos Operativos",
                "priority": 3,
                "description": """### Objetivo
Registro de gastos de la academia categorizados (canchas, arbitraje, salarios, material deportivo).

### Criterios de Aceptación (DoD)
- [ ] Tabla `gastos` con soporte para moneda USD o VES.
- [ ] Endpoints `POST /api/v1/expenses` y `GET /api/v1/expenses`."""
            },
            {
                "code": "T5.2",
                "name": "[T5.2] Reportes de Cuadre de Caja y Morosidad",
                "priority": 2,
                "description": """### Objetivo
Generar los resúmenes financieros diarios y mensuales para la directiva de la academia.

### Criterios de Aceptación (DoD)
- [ ] Reporte de ingresos recibidos por método de pago (desglosado en VES y USD).
- [ ] Reporte de obligaciones vencidas por categoría deportiva."""
            },
            {
                "code": "T5.3",
                "name": "[T5.3] Auditoría de Seguridad Multi-Tenant y Concurrencia",
                "priority": 1,
                "description": """### Objetivo
Pruebas exhaustivas para garantizar que ninguna petición pueda acceder a datos de otra academia y pruebas de estrés concurrente.

### Criterios de Aceptación (DoD)
- [ ] Test automatizado que intenta consultar un jugador de la Academia B con un token de la Academia A (debe responder 403/404).
- [ ] Verificación de bloqueos pesimistas en pagos simultáneos."""
            },
            {
                "code": "T5.4",
                "name": "[T5.4] Despliegue de Servidor y Carga de Datos Piloto Obelisco FC",
                "priority": 1,
                "description": """### Objetivo
Poner en marcha el entorno de producción con la base de datos PostgreSQL, desplegar la API PHP 8.5 y cargar el padrón de prueba de Obelisco FC.

### Criterios de Aceptación (DoD)
- [ ] API desplegada con SSL/HTTPS activo.
- [ ] Academia piloto 'Obelisco FC' creada con sus administradores y entrenadores.
- [ ] Generación de binario APK de prueba para los teléfonos del club."""
            }
        ]
    }
]

def request_api(method, endpoint, payload=None):
    url = f"{BASE_URL}/{endpoint}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"Error {e.code} en {method} {url}: {err_msg}", file=sys.stderr)
        raise

def get_or_create_space():
    # 1. Consultar espacios existentes
    spaces_resp = request_api("GET", f"team/{TEAM_ID}/space")
    for space in spaces_resp.get("spaces", []):
        if space["name"].lower() == "fichapp (saas deportivo)":
            print(f"[OK] Space encontrado: {space['name']} (ID: {space['id']})")
            return space["id"]

    # 2. Si no existe, crearlo
    print("[+] Creando nuevo Space 'FichApp (SaaS Deportivo)'...")
    payload = {
        "name": "FichApp (SaaS Deportivo)",
        "multiple_assignees": True,
        "features": {
            "due_dates": {"enabled": True, "start_date": True},
            "time_tracking": {"enabled": True},
            "priorities": {"enabled": True},
            "checklists": {"enabled": True},
            "custom_fields": {"enabled": True}
        }
    }
    new_space = request_api("POST", f"team/{TEAM_ID}/space", payload)
    print(f"[OK] Space creado exitosamente (ID: {new_space['id']})")
    return new_space["id"]

def get_or_create_list(space_id, list_name):
    lists_resp = request_api("GET", f"space/{space_id}/list")
    for lst in lists_resp.get("lists", []):
        if lst["name"].lower() == list_name.lower():
            return lst["id"]

    # Crear lista sin carpeta (folderless list)
    payload = {"name": list_name}
    new_lst = request_api("POST", f"space/{space_id}/list", payload)
    return new_lst["id"]

def get_existing_tasks(list_id):
    tasks_resp = request_api("GET", f"list/{list_id}/task?include_closed=true")
    existing = {}
    for t in tasks_resp.get("tasks", []):
        existing[t["name"]] = t["id"]
    return existing

def create_task(list_id, task_data):
    payload = {
        "name": task_data["name"],
        "description": task_data["description"],
        "priority": task_data.get("priority", 3),
        "status": "to do"
    }
    res = request_api("POST", f"list/{list_id}/task", payload)
    return res["id"]

def provision_all():
    space_id = get_or_create_space()
    mapping = {
        "space_id": space_id,
        "sprints": {}
    }

    for sprint in SPRINTS_DATA:
        sprint_name = sprint["name"]
        print(f"\n📁 Procesando {sprint_name}...")
        list_id = get_or_create_list(space_id, sprint_name)
        existing_tasks = get_existing_tasks(list_id)

        mapping["sprints"][sprint_name] = {
            "list_id": list_id,
            "tasks": {}
        }

        for t in sprint["tasks"]:
            task_name = t["name"]
            if task_name in existing_tasks:
                task_id = existing_tasks[task_name]
                print(f"  ✓ [Existe] {t['code']}: {task_name} (ID: {task_id})")
            else:
                task_id = create_task(list_id, t)
                print(f"  + [Creada] {t['code']}: {task_name} (ID: {task_id})")

            mapping["sprints"][sprint_name]["tasks"][t["code"]] = {
                "id": task_id,
                "name": task_name,
                "priority": t.get("priority", 3)
            }

    with open(MAPPING_FILE, "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    print(f"\n🎉 ¡Estructura completa de ClickUp sincronizada y guardada en {MAPPING_FILE}!")

def get_task_id_by_code(code):
    if not os.path.exists(MAPPING_FILE):
        return code
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        mapping = json.load(f)
    for sprint in mapping.get("sprints", {}).values():
        if code in sprint.get("tasks", {}):
            return sprint["tasks"][code]["id"]
    return code

def update_task_status(task_code_or_id, status):
    task_id = get_task_id_by_code(task_code_or_id)
    payload = {"status": status}
    res = request_api("PUT", f"task/{task_id}", payload)
    print(f"[OK] Tarea {task_code_or_id} actualizada a '{status}'.")
    return res

def add_task_comment(task_code_or_id, comment):
    task_id = get_task_id_by_code(task_code_or_id)
    payload = {"comment_text": comment}
    res = request_api("POST", f"task/{task_id}/comment", payload)
    print(f"[OK] Comentario agregado a la tarea {task_code_or_id}.")
    return res

def show_summary():
    if not os.path.exists(MAPPING_FILE):
        print("Mapeo no encontrado. Ejecuta sin argumentos para aprovisionar.")
        return
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        mapping = json.load(f)
    print("\n=======================================================")
    print(f"📊 ESPACIO CLICKUP: FichApp (ID: {mapping['space_id']})")
    print("=======================================================")
    for sprint_name, sdata in mapping["sprints"].items():
        print(f"\n📁 {sprint_name} (List ID: {sdata['list_id']})")
        for code, tdata in sdata["tasks"].items():
            print(f"   [{code}] {tdata['name']} (ID: {tdata['id']})")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "status":
            show_summary()
        elif cmd == "update" and len(sys.argv) >= 4:
            update_task_status(sys.argv[2], sys.argv[3])
        elif cmd == "comment" and len(sys.argv) >= 4:
            add_task_comment(sys.argv[2], " ".join(sys.argv[3:]))
        else:
            print("Uso:")
            print("  python3 clickup_sync.py status")
            print("  python3 clickup_sync.py update <codigo_o_id> <status>")
            print("  python3 clickup_sync.py comment <codigo_o_id> <comentario>")
    else:
        provision_all()

