# Patrones de interfaz

## Navegación

Modelo: híbrido, adaptativo y mobile-first.

### Teléfono
- Barra inferior con 4 o 5 destinos frecuentes, según rol y permisos.
- Destinos secundarios dentro de una sección «Más» o menú contextual.
- Encabezados con título, contexto y acciones relevantes.
- Navegación interna predecible y retorno claro.

### Tablet y pantallas grandes
- Menú lateral expandible/contraíble cuando mejore la navegación.
- Mayor aprovechamiento horizontal.
- Tablas y paneles cuando faciliten consulta y comparación.
- No estirar sin criterio una composición móvil.

## Navegación por rol

La navegación se adapta al rol y permisos. No crear una aplicación visualmente distinta por
rol. La estructura y componentes compartidos permanecen consistentes.

Ejemplos de destinos, sujetos al alcance real del producto:
- Administración: Inicio, Personas, Equipos, Finanzas, Más.
- Entrenador: Inicio, Equipos, Asistencia, Jugadores, Más.
- Representante: Inicio, Mis jugadores, Pagos, Avisos, Más.

No inferir permisos solo desde el rol mostrado en la interfaz. Respetar autorización real
proveniente de la aplicación/backend.

## Listados adaptativos

- Registros simples: filas compactas.
- Registros que requieren contexto: fichas más completas.
- Datos comparables en pantallas grandes: tablas.
- Buscar y filtrar cuando el volumen lo justifique.
- Mantener visibles los criterios de filtro activos.
- Definir estados vacío, error, carga y sin resultados.
- No mostrar tablas de escritorio comprimidas en móvil.

## Dashboard

- Priorizar información y acciones relevantes al rol.
- Evitar gráficos decorativos.
- No llenar la pantalla de tarjetas KPI sin jerarquía.
- Mostrar tendencias solo cuando haya datos suficientes y una interpretación útil.
- Ofrecer accesos rápidos a tareas frecuentes.

## Formularios

- Agrupar por secciones lógicas.
- Ordenar campos según el flujo natural de la tarea.
- Validar progresivamente sin interrumpir innecesariamente.
- Conservar datos ante errores recuperables.
- Para procesos extensos, considerar pasos y progreso.

## Detalle

- Presentar primero identidad y contexto del registro.
- Agrupar datos relacionados.
- Mantener acciones principales visibles y secundarias en menú contextual cuando convenga.
- Evitar duplicar información en múltiples secciones.

## Operaciones sensibles

- Mostrar un resumen previo a confirmar.
- Describir consecuencias concretas.
- Evitar confirmaciones para acciones triviales.
- Impedir envíos duplicados durante procesamiento.
- Mostrar resultado real y referencia/comprobante cuando corresponda.
