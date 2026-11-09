# UX por módulo y contexto

## Finanzas y cobros

La precisión financiera tiene prioridad sobre la simplificación estética.

Mostrar cuando corresponda:
- Importe.
- Moneda.
- Concepto.
- Fecha.
- Persona relacionada.
- Estado de la operación.
- Tasa de cambio y referencia, cuando aplique.
- Resumen antes de confirmar operaciones sensibles.

Diferenciar claramente:
- Deuda.
- Pago recibido.
- Saldo a favor.
- Monto pendiente.
- Operación anulada/revertida.
- Operación pendiente de sincronización.

No presentar un pago como confirmado si el servidor no lo ha confirmado. No ocultar moneda,
tasa o contexto relevante. No usar solo color para distinguir estados.

## Asistencia y entrenamiento

Diseñar para uso rápido y posible conectividad limitada:
- Identificación clara de jugadores.
- Estados de asistencia inequívocos.
- Controles táctiles cómodos.
- Pocos pasos para registrar asistencia.
- Feedback inmediato del guardado local.
- Indicador separado de sincronización.
- Resolución comprensible de conflictos.

No tratar la asistencia como un formulario administrativo largo.

## Personas, jugadores y familias

- Mostrar claramente quién es cada persona.
- Diferenciar jugadores y representantes.
- Hacer comprensible la relación entre representante y uno o varios jugadores.
- Evitar confusiones entre nombres similares.
- Mostrar solo los datos personales necesarios para la tarea.
- Clarificar quién es responsable de cada pago o gestión.

## Dashboards por rol

- Administrador: resumen operativo y financiero útil.
- Entrenador: próximos entrenamientos, equipos y asistencia.
- Representante: jugadores relacionados, pagos y avisos.

Son orientaciones de producto; la implementación debe respetar los módulos y permisos realmente
existentes. No inventar funcionalidades no disponibles.
