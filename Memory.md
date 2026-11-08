# Memory.md — Decisiones Cerradas, Estado del Plan y Preferencias

Guarda lo que no queremos volver a discutir ni explicar entre sesiones.

---

## 1. Decisiones Técnicas Cerradas (No Reabrir)
- **Backend:** Se utilizará exclusivamente **PHP 8.5 puro con arquitectura modular Service-Repository**. Se descartó el uso de frameworks pesados (Laravel, Symfony, etc.).
- **Aritmética Financiera:** Todos los cálculos monetarios deben realizarse con la biblioteca nativa **`bcmath`**. Se prohibió el uso de `float` para evitar pérdida de centavos.
- **Modelo de Pagos:** Se aprobó el desacoplamiento entre el recibo de pago (`pagos`) y las aplicaciones de deuda (`imputaciones_pago`), permitiendo que un solo Pago Móvil cubra las cuotas de varios hermanos.
- **Saldo a Favor:** Se incluye la entidad `saldos_a_favor` asociada al representante para retener excedentes o vueltos.
- **Asistencia Técnica en Cancha:** Se incluye en el MVP la toma de asistencia *offline* para entrenadores mediante SQLite local en React Native Expo y sincronización por lote.
- **Ubicación del Código:** Todos los proyectos del usuario residen en `/home/mroberth/Proyectos/`. El proyecto oficial es `/home/mroberth/Proyectos/fichapp/`.

## 2. Errores Resueltos y Soluciones
- **Conectividad de ClickUp en Sandbox:** Las llamadas de red a ClickUp requieren ejecución fuera del aislamiento del sandbox o mediante el script `scripts/clickup_sync.py` con permisos de red.
- **Sincronización de Tareas en ClickUp:** Se creó el espacio dedicado **`FichApp (SaaS Deportivo)`** (ID: `90178086008`) en la organización *Entorno de Desarrollo | RobDev*, con 6 listas de Sprints y 26 tareas registradas en `scripts/clickup_mapping.json`.

## 3. Preferencias de Trabajo del Desarrollador
- **Metodología Paso a Paso:** Trabajar una sola tarea a la vez del backlog de ClickUp.
- **Validación Continua:** No avanzar a una nueva tarea sin haber probado y aprobado la tarea en curso.
- **Transparencia y Rigor:** Explicar decisiones arquitectónicas y mantener los 4 archivos de contexto actualizados.

## 4. Estado Actual del Plan

```
Sprint 0: Cimientos, DB & Auth (List ID: 901718120307)
  [x] T0.1: Setup PHP 8.5 puro, PSR-4 y Conexión PDO (ID: 86e3zm74p)  <-- COMPLETADA
  [ ] T0.2: Router HTTP Ligero y Middlewares de Contexto (ID: 86e3zm74q)  <-- SIGUIENTE TAREA
  [ ] T0.3: Migraciones Base PostgreSQL: Tenants, Usuarios y Auditoría (ID: 86e3zm74r)
  [ ] T0.4: Servicio de Autenticación, Hashes y Tokens Bearer (ID: 86e3zm74t)
  [ ] T0.5: Setup de App Móvil Expo y Navegación por Roles (ID: 86e3zm74u)

Sprints 1 a 5: Pendientes en ClickUp
```
