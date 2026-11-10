---
name: fichapp-design-system
description: >
  Diseña, implementa, revisa y mejora interfaces de FichApp respetando su identidad
  visual, patrones UX, componentes compartidos, accesibilidad y experiencia mobile-first.
---

# FichApp Design System

## Propósito

Esta skill define cómo diseñar e implementar interfaces de FichApp. Su objetivo es mantener
una experiencia coherente, clara, accesible y funcional en todos los módulos y roles.

No es una inspiración visual opcional. Es la referencia normativa para cualquier tarea de
interfaz de usuario y experiencia de usuario.

## Cuándo utilizarla

Consultar esta skill cuando se solicite:
- Crear o modificar pantallas, componentes o flujos.
- Implementar navegación, formularios, listados, dashboards o diálogos.
- Mejorar UX, accesibilidad o consistencia visual.
- Añadir estados de carga, error, vacío, éxito u operación sin conexión.
- Revisar visualmente una implementación.

No utilizarla para modificar reglas de negocio, contratos API, modelo de datos o seguridad
del backend salvo que la tarea lo solicite expresamente.

## Contexto del producto

FichApp es una plataforma SaaS mobile-first para administrar academias, clubes y escuelas
deportivas, con validación inicial en una academia de fútbol. Sus contextos principales son:

1. Administración: personas, equipos, cobros, finanzas, configuración y reportes.
2. Entrenamiento: equipos, jugadores, asistencia y tareas rápidas en cancha.
3. Representantes y familias: jugadores relacionados, pagos, información y avisos.

La aplicación comparte un lenguaje visual, pero adapta navegación, accesos y acciones al
rol y permisos del usuario. No se deben crear aplicaciones visualmente independientes por rol.

## Principios no negociables

1. Claridad antes que decoración.
2. Mobile-first: diseñar primero para teléfonos y adaptar conscientemente a pantallas mayores.
3. Densidad equilibrada: mostrar lo necesario sin saturar ni esconder información importante.
4. Reutilizar componentes y patrones existentes antes de crear otros.
5. No convertir todo en tarjetas.
6. No inventar colores, tipografías, radios, sombras ni estilos fuera del sistema.
7. Las acciones y operaciones deben comunicar sus estados.
8. La interfaz nunca sustituye la autorización del backend.
9. No mostrar una operación como sincronizada o confirmada si no existe confirmación real.
10. No alterar reglas de negocio para simplificar una interfaz.

## Flujo obligatorio antes de implementar

1. Inspeccionar la estructura real del proyecto, las convenciones y los componentes existentes.
2. Identificar plataforma, librerías, versiones y sistema de navegación efectivamente instalados.
3. Leer las referencias pertinentes de esta skill.
4. Identificar rol, permisos, objetivo del usuario y tarea principal de la pantalla.
5. Determinar si existe un patrón o componente reutilizable.
6. Diseñar estados normales, carga, vacío, error, éxito y offline cuando correspondan.
7. Implementar respetando arquitectura, convenciones y dependencias existentes.
8. Ejecutar pruebas disponibles y revisar la interfaz en tamaños representativos.
9. Informar qué se implementó, qué se verificó y qué limitaciones quedaron pendientes.

No asumir nombres de carpetas, librerías, componentes ni versiones. Inspeccionar el repositorio
antes de decidir dónde implementar.

## Autonomía para componentes

Se permite crear componentes nuevos sin solicitar autorización individual.

- Componente local: puede crearse para resolver una necesidad concreta de una pantalla.
- Componente compartido: puede incorporarse al catálogo cuando tenga una responsabilidad
  clara, sea potencialmente reutilizable, use tokens oficiales y tenga estados documentados.
- Antes de crear, buscar componentes equivalentes existentes.
- No duplicar componentes con diferencias cosméticas menores.
- No introducir dependencias nuevas si las existentes resuelven la necesidad.
- Si una nueva dependencia es realmente necesaria, justificarla y comunicarlo; no incorporarla
  silenciosamente.
- No cambiar la identidad visual ni los tokens aprobados por iniciativa propia.

## Límites de autoridad

Antigravity puede decidir composición, jerarquía, agrupación y creación de componentes dentro
de las reglas aprobadas.

Requiere autorización del usuario para:
- Cambiar la paleta o asignación semántica de colores.
- Cambiar Inter por otra familia tipográfica.
- Cambiar la geometría general o escala de espaciado.
- Cambiar el modelo de navegación adaptativa.
- Introducir una nueva familia de iconos o dependencia visual.
- Cambiar principios UX transversales.
- Eliminar o reemplazar patrones financieros, offline o de seguridad.

Los valores cromáticos y métricos de esta primera especificación son una base provisional
hasta su validación visual y de contraste. No tratarlos como inmutables hasta que el usuario
apruebe la versión final de tokens.

## Referencias

Consultar según la tarea:

- `references/IDENTIDAD_VISUAL.md`: personalidad, dirección de arte y decisiones aprobadas.
- `references/PALETA_Y_TOKENS.md`: colores, roles semánticos y tokens provisionales.
- `references/TIPOGRAFIA_Y_ESPACIADO.md`: Inter, jerarquía, espaciado y radios.
- `references/COMPONENTES_UI.md`: catálogo y comportamiento de componentes.
- `references/PATRONES_DE_INTERFAZ.md`: navegación, listados, formularios y flujos. Incluye la arquitectura visual oficial «Hero Branding Split».
- `references/PRINCIPIOS_UX.md`: principios y leyes UX aplicadas.
- `references/UX_POR_MODULO.md`: finanzas, asistencia y personas/familias.
- `references/ACCESIBILIDAD.md`: contraste, interacción y contenido accesible.
- `references/ANTIPATRONES_Y_VALIDACION.md`: prohibiciones y checklist de revisión.

## Reglas de implementación visual

- Centralizar colores, tipografía, espaciado, radios y demás valores compartidos en el
  mecanismo de tokens que ya utilice el proyecto.
- No dispersar valores hexadecimales o estilos repetidos por las pantallas.
- Utilizar una única familia tipográfica: Inter, con los pesos realmente disponibles.
- Mantener consistencia de iconos; preferencia inicial: Lucide, previa comprobación de
  compatibilidad con el proyecto.
- Respetar áreas seguras, teclado, gestos y tamaños reales de dispositivos.
- Evitar que tablas de escritorio se compriman en móvil; elegir una presentación adaptada.
- No añadir animaciones por decoración. Usarlas para feedback, continuidad y comprensión.

## Criterios de aceptación de una tarea UI

Una tarea no está terminada solo porque compile. Verificar:

- Consistencia con identidad y tokens.
- Jerarquía y claridad de la tarea principal.
- Reutilización razonable.
- Adaptación a tamaños móviles y mayores relevantes.
- Estados de interacción y retroalimentación.
- Accesibilidad y contraste.
- Permisos y privacidad en la presentación.
- Estados offline/sincronización si aplican.
- Pruebas o comprobaciones disponibles.
- Evidencia visual real cuando el entorno permita capturar la pantalla.

No afirmar que se inspeccionó visualmente una pantalla si no se obtuvo una captura o vista real.

## Informe de cierre

Al terminar, resumir:
1. Pantallas y componentes modificados.
2. Decisiones de UX relevantes.
3. Componentes nuevos y si son locales o compartidos.
4. Pruebas ejecutadas y resultado.
5. Tamaños/dispositivos revisados.
6. Limitaciones, supuestos y asuntos que requieren decisión del usuario.
