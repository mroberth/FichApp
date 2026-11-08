# AGENTS.md — Reglas de Comportamiento y Autonomía para FichApp

Define los límites de autonomía del agente de IA, comandos oficiales y reglas inquebrantables del proyecto.

---

## 1. Puede Hacer Sin Preguntar
- Escribir y ejecutar tests unitarios con `phpunit`.
- Corregir errores de sintaxis, tipos y advertencias del linter (PHPStan / PSR-12).
- Actualizar comentarios en código, documentación técnica y el archivo `Memory.md` al completar tareas.
- Ejecutar scripts de consulta y sincronización de ClickUp (`python3 scripts/clickup_sync.py`).
- Crear clases de servicio, repositorios y entidades dentro de las especificaciones aprobadas en el Sprint activo.

## 2. Debe Validar Antes de Actuar (Requiere Aprobación Humana)
- Cualquier alteración en el esquema de base de datos (`/backend/migrations`).
- Cambios en las firmas, métodos o códigos de respuesta de los endpoints de la API pública `/api/v1/`.
- Adición, actualización o eliminación de dependencias en `composer.json` o `package.json`.
- Modificación en las reglas de cálculo financiero (pronto-pago, conversión de tasa BCV o imputaciones).
- Iniciar una nueva tarea de ClickUp sin haber cerrado la anterior.

## 3. Comandos Oficiales del Proyecto
- **Servidor local Backend:** `php -S localhost:8000 -t backend/public`
- **Tests Backend:** `vendor/bin/phpunit`
- **Análisis estático:** `vendor/bin/phpstan analyse`
- **Sincronización ClickUp:** 
  - Ver tareas: `python3 scripts/clickup_sync.py status`
  - Actualizar tarea: `python3 scripts/clickup_sync.py update <CODIGO_O_ID> <STATUS>`
  - Comentar tarea: `python3 scripts/clickup_sync.py comment <CODIGO_O_ID> <TEXTO>`
- **App Móvil Expo:** `cd mobile && npx expo start`

## 4. Reglas Técnicas Inquebrantables
1. **PHP 8.5 Puro:** No utilizar frameworks pesados (Laravel, Symfony). Toda la arquitectura se basa en PHP moderno, modular, con el patrón *Service-Repository* y estándares PSR (PSR-4, PSR-7, PSR-11, PSR-12).
2. **Tipado Estricto Obligatorio:** Todos los archivos PHP deben iniciar con `declare(strict_types=1);` sin excepción.
3. **Aritmética Decimal Exacta:** Prohibido el uso de tipos de coma flotante (`float`) para dinero o tasas. Todos los cálculos financieros se realizan con la extensión nativa **`bcmath`** (`bcadd`, `bcsub`, `bcmul`, `bcdiv`, `bccomp`).
4. **Inmutabilidad Financiera:** Los registros de la tabla `pagos` confirmados **NUNCA se borran** físicamente (`DELETE` prohibido). Todo error se solventa mediante reversos auditables.
5. **Aislamiento Multi-Tenant Estricto:** Toda consulta o mutación SQL DEBE filtrar explícitamente por `academia_id`.
6. **Seguridad y Secretos:** Jamás imprimir en logs contraseñas, tokens JWT, credenciales ni la API Key de ClickUp.
7. **Formato de Commits:** Seguir estrictamente *Conventional Commits*:
   - `feat: [T0.X] descripción de la funcionalidad`
   - `fix: descripción de la corrección`
   - `test: pruebas añadidas o modificadas`
   - `docs: cambios en documentación o memoria`
   - `refactor: optimización de código sin alterar comportamiento`
