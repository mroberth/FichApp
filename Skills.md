# Skills.md — Procedimientos y Runbooks Reutilizables

Define los procedimientos estándar que el agente debe ejecutar de forma consistente ante tareas repetitivas en FichApp.

---

## 1. Procedimiento: Gestionar Tareas en ClickUp
Cada vez que se inicie o finalice una tarea del sprint:

1. **Al iniciar una tarea:**
   - Ejecutar: `python3 scripts/clickup_sync.py update <CODIGO_TAREA> "in progress"`
   - Actualizar el estado en `Memory.md` indicando la tarea activa.
2. **Al completar una tarea:**
   - Ejecutar la suite de tests relevante.
   - Ejecutar: `python3 scripts/clickup_sync.py update <CODIGO_TAREA> "complete"`
   - Agregar comentario de cierre: `python3 scripts/clickup_sync.py comment <CODIGO_TAREA> "Tarea implementada y testeada con éxito."`
   - Actualizar `Memory.md` marcando la tarea como `[x]`.

---

## 2. Procedimiento: Crear un Nuevo Servicio de Dominio en PHP 8.5
Para crear un caso de uso o servicio en `src/Application/`:

1. Añadir siempre la declaración estricta: `declare(strict_types=1);`.
2. Crear la clase como `final class <Nombre>Service`.
3. Inyectar dependencias (conexión `PDO` o repositorios) en el constructor mediante *Constructor Promotion*:
   ```php
   public function __construct(
       private PDO $pdo,
       private PlayerRepository $playerRepository
   ) {}
   ```
4. Si la operación involucra escrituras financieras o múltiples tablas, envolver en transacción explícita:
   ```php
   $this->pdo->beginTransaction();
   try {
       // Operaciones con aislamiento por academia_id
       $this->pdo->commit();
   } catch (\Throwable $e) {
       $this->pdo->rollBack();
       throw $e;
   }
   ```
5. Utilizar **`bcmath`** para cualquier cálculo monetario o de tasas.

---

## 3. Procedimiento: Escribir una Migración SQL para PostgreSQL
Al crear un archivo de migración en `backend/migrations/`:

1. Nombrar el archivo con prefijo numérico y descripción en snake_case:
   `001_crear_tablas_base.sql`, `002_crear_tablas_deportivas.sql`.
2. Utilizar tipos nativos robustos:
   - Identificadores: `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`.
   - Claves foráneas: `ON DELETE RESTRICT` para evitar eliminaciones accidentales en cascada.
   - Montos en USD: `NUMERIC(12,2)`.
   - Montos en VES: `NUMERIC(18,2)`.
   - Tasas de cambio: `NUMERIC(18,8)`.
   - Marcas de tiempo: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`.
3. Agregar siempre índices para columnas de filtrado frecuente: `(academia_id, ...)`.
4. Incluir restricciones `CHECK` para campos con estados o tipos controlados.

---

## 4. Procedimiento: Escribir Tests Unitarios en PHPUnit
Para cada nuevo servicio o caso de uso:

1. Ubicar el test en `backend/tests/Unit/` o `backend/tests/Integration/`.
2. Nombrar la clase con sufijo `Test` (ej. `RegistrarPagoFamiliarServiceTest`).
3. Cubrir:
   - El caso de éxito habitual.
   - Casos borde de redondeo y fechas límite (ej. pronto-pago ganado a las 23:59:59 del día 15 vs perdido a las 00:00:01 del día 16).
   - Manejo de excepciones ante datos inválidos o intentos de violar el aislamiento multi-tenant.
