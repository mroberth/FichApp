# Skills.md — Procedimientos y Runbooks Reutilizables

Define los procedimientos estándar que el agente debe ejecutar de forma consistente ante tareas repetitivas en FichApp.

---

## 1. Procedimiento: Gestionar Tareas en ClickUp
Cada vez que se inicie o finalice una tarea del sprint:

1. **Al iniciar una tarea:**
   - Ejecutar: `python3 scripts/clickup_sync.py update <CODIGO_TAREA> "in progress"`
   - Actualizar el estado en `Memory.md` indicando la tarea activa.
2. **Al completar una tarea:**
   - Ejecutar la suite de tests relevante (PHPUnit, tests de integración o comprobación Expo).
   - Ejecutar: `python3 scripts/clickup_sync.py update <CODIGO_TAREA> "complete"`
   - Agregar comentario de cierre: `python3 scripts/clickup_sync.py comment <CODIGO_TAREA> "Tarea implementada y testeada con éxito."`
   - Actualizar `Memory.md` marcando la tarea como `[x]`.

---

## 2. Procedimiento: Crear un Nuevo Servicio de Dominio en PHP 8.5
Para crear un caso de uso o servicio en `backend/app/Services/`:

1. Añadir siempre la declaración estricta: `declare(strict_types=1);`.
2. Crear la clase como `final class <Nombre>Service`.
3. Inyectar dependencias (repositorios o PDO) en el constructor mediante *Constructor Promotion*:
   ```php
   public function __construct(
       private JugadorRepository $jugadorRepository,
       private AuditoriaRepository $auditoriaRepository
   ) {}
   ```
4. Lanzar siempre `App\Core\ExcepcionApi` ante fallos de validación o no encontrados:
   ```php
   if (!$jugador) {
       throw ExcepcionApi::noEncontrado('Jugador no encontrado en esta academia.');
   }
   ```
5. Si la operación involucra escrituras financieras o múltiples tablas, orquestar mediante `App\Core\Database::transaction()`.
6. Utilizar **`DecimalMath`** (`bcmath`) para cualquier cálculo monetario o de tasas.

---

## 3. Procedimiento: Escribir una Migración SQL para PostgreSQL
Al crear un archivo de migración en `backend/migrations/`:

1. Nombrar el archivo con prefijo numérico y descripción en snake_case:
   `001_crear_tablas_base_seguridad_y_tenants.sql`, `002_crear_tablas_deportivas_y_familias.sql`.
2. Especificar explícitamente el esquema de destino (`seguridad.` o `negocio.`).
3. Utilizar tipos nativos robustos:
   - Identificadores: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
   - Claves foráneas: `ON DELETE RESTRICT` para evitar eliminaciones accidentales en cascada.
   - Montos en USD: `NUMERIC(12,2)`.
   - Montos en VES: `NUMERIC(18,2)`.
   - Tasas de cambio: `NUMERIC(18,8)`.
   - Marcas de tiempo: `TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`.
4. Agregar siempre índices para columnas de filtrado frecuente: `(academia_id, ...)`.
5. Incluir restricciones `CHECK` para campos con estados o tipos controlados.
6. Ejecutar y verificar con `composer migrate`.

---

## 4. Procedimiento: Escribir Tests Unitarios e Integración en PHPUnit
Para cada nuevo servicio o caso de uso:

1. Ubicar el test en `backend/tests/Unit/` o `backend/tests/Integration/`.
2. Nombrar la clase con sufijo `Test` (ej. `DeportivoMigrationTest`).
3. Usar el atributo PHP 8 `#[Depends('nombreTestAnterior')]` en lugar de docblocks `@depends`.
4. Cubrir:
   - El caso de éxito habitual.
   - Casos borde de validación y límites.
   - Aislamiento multi-tenant (asegurar que no se accede a datos de otra academia).
5. Ejecutar la suite con `composer test` o `vendor/bin/phpunit`.

---

## 5. Procedimiento: Crear o Modificar Pantallas y Componentes Móviles (FichApp Design System)
Al diseñar o codificar interfaces en `mobile/src/`:

1. **Revisar normativa:** Consultar `mobile/.antigravity/SKILLS/fichapp-design-system/`.
2. **Tokens Obligatorios:** Importar colores, espaciados, bordes y tipografía desde `src/theme/tokens.js`. Nunca colocar colores hexadecimales sueltos en estilos locales.
3. **Manejo de Áreas Seguras:** Envolver la pantalla en `<SafeAreaView>` o usar `useSafeAreaInsets` de `react-native-safe-area-context` para evitar solapamientos con la barra de estado y notch.
4. **Iconografía:** Usar exclusivamente componentes de `lucide-react-native` (ej. `User`, `Calendar`, `ShieldCheck`, `LogOut`, etc.). Prohibido usar emojis como iconos.
5. **Estados de UI:** Asegurar que cada pantalla implemente visualmente:
   - Estado de carga (`ActivityIndicator` con `colores.marcaPrimario`).
   - Estado vacío (ilustración/icono sobrio y mensaje claro).
   - Estado de error (mensaje legible y opción de reintentar).
   - Estado normal (densidad equilibrada, sin saturar de tarjetas).
6. **Lenguaje:** Mantener JavaScript puro (`.js` / `.jsx`), sin TypeScript.

---

## 6. Procedimiento: Diagnóstico y Verificación Móvil
Antes de dar por finalizada una tarea en frontend móvil:

1. Ejecutar `npx expo-doctor` dentro del directorio `mobile/` para confirmar que las dependencias y el SDK 58 estén perfectamente sincronizados:
   ```bash
   cd mobile && npx expo-doctor
   ```
2. Comprobar que no existan errores de empaquetado ejecutando una prueba de bundling o iniciando Metro:
   ```bash
   cd mobile && npx expo export --platform android --dump-sourcemap (o inicio limpio con npx expo start)
   ```
