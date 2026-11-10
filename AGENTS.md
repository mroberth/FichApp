# AGENTS.md — Reglas de Comportamiento y Autonomía para FichApp

Define los límites de autonomía del agente de IA, comandos oficiales y reglas inquebrantables del proyecto.

---

## 1. Puede Hacer Sin Preguntar
- Crear y editar archivos de código fuente (DTOs, Repositorios, Servicios, Controladores, Rutas, Tests).
- Crear y componer pantallas y componentes de React Native en `mobile/src/` siguiendo estrictamente los tokens del sistema de diseño (`fichapp-design-system`).
- Actualizar comentarios en código, documentación técnica y el archivo `Memory.md` al completar tareas.
- Preparar y estructurar comandos de consola para que el desarrollador los ejecute.

## 2. Debe Validar Antes de Actuar (Requiere Aprobación Humana)
- Cualquier alteración en el esquema de base de datos (`/backend/migrations`).
- Cambios en las firmas, métodos o códigos de respuesta de los endpoints de la API pública `/api/v1/`.
- Adición, actualización o eliminación de dependencias en `composer.json` o `package.json`.
- Modificación en las reglas de cálculo financiero (pronto-pago, conversión de tasa BCV o imputaciones).
- Cambios en la paleta oficial de colores, familia tipográfica o tokens estructurales del sistema de diseño (`fichapp-design-system`).
- Introducir una nueva librería de iconos o componentes visuales fuera del estándar aprobado (`lucide-react-native`).
- Iniciar una nueva tarea de ClickUp sin haber cerrado y validado la anterior.

## 3. Comandos Oficiales del Proyecto (Para Ejecución Manual por el Desarrollador)
- **Servidor local Backend:** `php -S 0.0.0.0:8000 -t backend/public` (0.0.0.0 permite acceso desde celulares físicos en la LAN/Wi-Fi).
- **Tests Backend:** `vendor/bin/phpunit` (o `composer test`)
- **Migraciones Backend:** `composer migrate`
- **Seeder Base de Datos:** `composer seed`
- **Análisis estático:** `vendor/bin/phpstan analyse`
- **Verificación sintaxis PHP:** `php -l <archivo.php>`
- **App Móvil Expo:** `cd mobile && npx expo start`
- **Diagnóstico Móvil:** `cd mobile && npx expo-doctor`
- **Sincronización ClickUp:** 
  - Ver tareas: `python3 scripts/clickup_sync.py status`
  - Actualizar tarea: `python3 scripts/clickup_sync.py update <CODIGO_O_ID> <STATUS>`
  - Comentar tarea: `python3 scripts/clickup_sync.py comment <CODIGO_O_ID> <TEXTO>`

## 4. Reglas Técnicas Inquebrantables
0. **Cero Ejecución de Comandos en Terminal:** Para ahorrar tokens y acelerar las respuestas, el agente NO debe ejecutar comandos en la terminal. Todo comando de verificación, linter, pruebas, migraciones, sincronización de ClickUp o git debe ser listado con claridad al final de la intervención para que el desarrollador lo ejecute manualmente en su consola.
1. **PHP 8.5 Puro (Arquitectura DTO-Controller-Service-Repository):**
   - Namespace raíz: `App\` mapeado a `app/`.
   - Controladores en `app/Controllers/`: Funciones directas y limpias sin lógica pesada (estilo DIRPOLES-4).
   - Objetos de entrada en `app/DTOs/`: Clases readonly tipadas (`public static function desdePeticion()`).
   - Lógica y validaciones en `app/Services/`: El cerebro del negocio. Toda validación fallida LANZA `ExcepcionApi::validacion()`, `ExcepcionApi::noEncontrado()`, etc.
   - Acceso a datos en `app/Repositories/`: Consultas SQL preparadas con PDO filtrando obligatoriamente por `academia_id`. Cero validaciones en el repositorio.
   - Respuestas HTTP exclusivamente mediante `App\Core\Respuesta::exito($datos, $estado)` y `App\Core\Respuesta::error($e)`. Contrato JSON: `{"exito": true, "datos": ...}`.
2. **Tipado Estricto Obligatorio:** Todos los archivos PHP deben iniciar con `declare(strict_types=1);` sin excepción.
3. **Aritmética Decimal Exacta:** Prohibido el uso de tipos de coma flotante (`float`) para dinero o tasas. Todos los cálculos financieros se realizan con `App\Core\DecimalMath` (`bcmath`).
4. **Inmutabilidad Financiera:** Los registros de la tabla `pagos` confirmados **NUNCA se borran** físicamente (`DELETE` prohibido). Todo error se solventa mediante reversos auditados.
5. **Aislamiento Multi-Tenant Estricto:** Toda consulta o mutación SQL DEBE filtrar explícitamente por `academia_id`.
6. **Seguridad y Secretos:** Jamás imprimir en logs contraseñas, tokens JWT/Bearer, credenciales ni la API Key de ClickUp.
7. **Frontend Móvil y FichApp Design System:**
   - Todo el código en `mobile/` debe ser JavaScript puro (`.js` / `.jsx`), sin TypeScript.
   - Apego estricto a la skill `mobile/.antigravity/SKILLS/fichapp-design-system/`: Tema Claro (Light Theme) por defecto estilo Notion/Figma, paleta `#F3F6F2` (fondo), `#FFFFFF` (superficie), `#174D50` (azul petróleo), `#B9E44A` (verde lima), `#252B27` (texto).
   - **Patrón Visual Aprobado «Hero Branding Split»:** Para otorgar presencia deportiva sólida, las pantallas clave implementan cabecera hero superior en azul petróleo institucional (`#174D50`) y hoja inferior blanca curvada (`borderTopLeftRadius: 32`) con controles táctiles ergonómicos (altura 48-50px).
   - **Componentes Base Obligatorios:** Prohibido el uso de `Alert.alert` nativo; utilizar exclusivamente `FichAppModalFeedback` o validaciones inline con `FichAppInput`. Utilizar `FichAppLogoCompleto` para el branding oficial.
   - **Formularios en Teléfonos:** Uso obligatorio de `KeyboardAvoidingView` y `ScrollView` con `keyboardShouldPersistTaps="handled"` para garantizar visibilidad al desplegar el teclado virtual.
   - Prohibido el uso de emojis como iconos de interfaz. Usar exclusivamente `lucide-react-native` y `react-native-svg`.
   - Usar siempre `react-native-safe-area-context` (`SafeAreaView` / `useSafeAreaInsets`). Prohibido usar el componente `SafeAreaView` deprecado de React Native.
   - Centralizar estilos en `mobile/src/theme/tokens.js`. Prohibido inventar colores o valores hexadecimales sueltos en las pantallas.
   - Manejo obligatorio de estados de interacción en componentes y pantallas: normal, carga (con feedback visual), vacío y error.
8. **Formato de Commits:** Seguir estrictamente *Conventional Commits*:
   - `feat: [T0.X] descripción de la funcionalidad`
   - `fix: descripción de la corrección`
   - `test: pruebas añadidas o modificadas`
   - `docs: cambios en documentación o memoria`
   - `refactor: optimización de código sin alterar comportamiento`
