# Catálogo de componentes UI

## Reglas generales

- Buscar equivalentes existentes antes de crear componentes.
- Reutilizar tokens y componentes compartidos.
- No crear un componente global solo por una diferencia cosmética.
- Se permite crear componentes nuevos sin autorización individual.
- Los componentes compartidos deben tener responsabilidad clara, API consistente y estados
  documentados.
- Los componentes locales no deben introducir estilos que contradigan la identidad.

## Botones

Variantes:
- Primario: acción principal de la vista.
- Secundario: acción complementaria.
- Terciario/ghost: acción de bajo énfasis.
- Destructivo: acción irreversible o peligrosa.
- Icon button: acción compacta con icono reconocible y nombre accesible.

Estados:
- Default, pressed, focused, disabled, loading.

Reglas:
- Evitar dos acciones primarias competidoras en una misma sección.
- Etiquetas con verbos claros.
- No usar solo iconos cuando el significado no sea evidente.
- Deshabilitar durante operaciones para prevenir envíos duplicados, sin perder feedback.

## Campos y formularios

- Etiquetas visibles; el placeholder no sustituye la etiqueta.
- Marcar campos obligatorios cuando corresponda.
- Usar teclado apropiado para el tipo de dato.
- Mostrar errores junto al campo.
- Conservar valores ingresados ante errores recuperables.
- Explicar formatos esperados.
- Agrupar formularios largos en secciones.
- Evitar pedir datos que ya están disponibles.

Estados: default, focused, filled, disabled, invalid, validating.

## Listas, filas y fichas

- Priorizar información principal y secundaria.
- Usar separadores discretos cuando sean suficientes.
- Acciones contextuales sin saturar cada fila.
- Evitar tarjetas individuales por registro cuando una lista sea más clara.
- Elegir presentación según complejidad del contenido y tamaño de pantalla.

## Tarjetas y paneles

Usar para agrupar información que realmente forma una unidad: resumen financiero, perfil,
indicadores o resumen de asistencia. No envolver cada botón, fila o pequeño dato.

## Badges y estados

- Texto claro y breve.
- Color semántico acompañado de texto o icono cuando sea necesario.
- No usar color como único medio de comunicar estado.
- No convertir cada dato en un badge.

## Diálogos y bottom sheets

- Diálogo: confirmaciones importantes y decisiones breves.
- Bottom sheet: acciones rápidas o selección contextual en móvil.
- Pantalla independiente: formularios extensos y procesos complejos.
- Evitar diálogos anidados.
- Explicar consecuencias en acciones destructivas.

## Tablas

- Reservar para pantallas con espacio suficiente y datos comparables.
- En móvil, transformar a filas/fichas adaptativas; no comprimir columnas hasta volverlas
  ilegibles.
- Mantener encabezados y relaciones entre valores comprensibles.
- Permitir filtros y orden cuando aporten valor real.

## Componentes nuevos

Se permite crearlos. Antes:
1. Buscar un equivalente.
2. Identificar la necesidad y el contexto.
3. Elegir componente local o compartido.
4. Usar tokens oficiales.
5. Definir estados, accesibilidad y comportamiento responsive.
6. Documentar componentes compartidos.
7. Evitar nuevas dependencias salvo justificación.
