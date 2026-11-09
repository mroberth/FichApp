# Paleta y tokens de FichApp

## Estado de aprobación

La dirección cromática azul petróleo + verde lima está elegida. Los HEX de esta referencia
son **provisionales** y deben validarse con contraste real antes de considerarse tokens finales.

## Paleta exploratoria seleccionada

| Token propuesto | HEX | Función prevista |
|---|---|---|
| `brand-primary` | `#174D50` | Azul petróleo: acciones principales y estructura de marca |
| `brand-accent` | `#B9E44A` | Verde lima: énfasis moderado y selección |
| `text-primary` | `#252B27` | Texto principal |
| `surface-background` | `#F3F6F2` | Fondo general |
| `surface-default` | `#FFFFFF` | Superficies y campos |

No asignar automáticamente verde lima a todos los botones. El color de acento no reemplaza
los colores semánticos.

## Colores semánticos requeridos

Definir tokens semánticos separados para:
- Éxito.
- Advertencia.
- Error/destructivo.
- Información.
- Texto secundario.
- Texto deshabilitado.
- Borde y separador.
- Superficie elevada o alternativa.
- Fondo de foco/selección.

Los valores concretos de estos tokens aún no están aprobados. Antes de implementarlos,
inspeccionar si el proyecto ya tiene valores o convenciones. Proponer una escala coherente
y verificar contraste; no inventar colores aislados por pantalla.

## Reglas

1. Los componentes consumen tokens semánticos, no HEX arbitrarios.
2. No comunicar estados únicamente mediante color.
3. El verde lima es un acento moderado; no utilizarlo como fondo extenso de grandes áreas
   si perjudica la legibilidad.
4. El azul petróleo es el principal color de marca, pero no debe saturar toda la interfaz.
5. Fondos y superficies deben mantener separación perceptible sin depender de sombras fuertes.
6. Verificar contraste WCAG 2.2 AA: 4.5:1 para texto normal y 3:1 para texto grande y
   componentes/elementos gráficos relevantes.
7. Validar estados normal, pressed, focused, selected, disabled, loading, error y success.

## Pendiente de aprobación

- HEX finales de todos los tokens.
- Escala completa de grises/neutros.
- Colores semánticos.
- Variantes dark mode, si se decide ofrecerlo.
- Contraste de combinaciones reales en componentes.
