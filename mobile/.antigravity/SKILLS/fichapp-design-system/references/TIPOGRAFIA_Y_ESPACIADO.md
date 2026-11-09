# Tipografía, espaciado y geometría

## Tipografía

Familia elegida: **Inter**.

Utilizar una sola familia en la interfaz para mantener consistencia. No incorporar otra
tipografía sin autorización. Verificar qué archivos/pesos están disponibles en el proyecto
y cargar solo los necesarios.

Escala inicial propuesta:

| Token | Tamaño | Peso | Uso |
|---|---:|---:|---|
| `display` | 32 px | 700 | Cifras o encabezados excepcionales |
| `heading-1` | 24 px | 700 | Título de pantalla |
| `heading-2` | 20 px | 600 | Sección |
| `heading-3` | 16 px | 600 | Subsección |
| `body` | 14 px | 400 | Texto habitual |
| `body-small` | 12 px | 400 | Texto secundario |
| `label` | 12 px | 600 | Etiquetas |
| `button` | 14 px | 600 | Acciones |

Son valores iniciales para validar en dispositivos reales. No reducir texto esencial para
hacer caber más contenido.

Para importes y cifras alineadas, utilizar cifras tabulares cuando la fuente y plataforma
lo permitan.

## Espaciado

Escala inicial basada en múltiplos de 4 px:

| Token | Valor |
|---|---:|
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `space-8` | 32 px |
| `space-10` | 40 px |

Usar la escala compartida; evitar valores arbitrarios repetidos.

## Radios

Geometría moderada. Valores iniciales:
- 6 px: elementos pequeños.
- 10 px: botones y campos.
- 12 px: tarjetas y contenedores.
- 16 px: superficies destacadas.

No aplicar radios grandes indiscriminadamente a cada elemento.

## Densidad

La densidad objetivo es equilibrada:
- Mostrar suficiente información para completar tareas.
- Separar visualmente grupos relacionados.
- Evitar espacios vacíos ornamentales que obliguen a desplazarse.
- No comprimir texto, controles o filas hasta afectar lectura y tactilidad.

Los valores son una base inicial y deben comprobarse en iOS y Android.
