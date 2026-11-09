/**
 * FichApp Design System — Tokens Oficiales de Diseño
 * Basado estrictamente en las especificaciones normativas de mobile/.antigravity/SKILLS/fichapp-design-system
 */

export const COLORES = {
  // Marca
  brandPrimary: '#174D50',       // Azul petróleo: estructura, acciones principales y autoridad
  brandPrimaryDark: '#0F3436',   // Tono más oscuro para estados pressed o contrastes fuertes
  brandPrimarySubtle: '#E7EFEF', // Tinte suave de azul petróleo para fondos o selecciones
  brandAccent: '#B9E44A',        // Verde lima: acento deportivo y énfasis moderado
  brandAccentSubtle: '#EDF8D1',  // Fondo tenue de acento para badges o tags destacados
  brandAccentDark: '#5E7D14',    // Verde oliva accesible para texto sobre fondos claros

  // Superficies (Tema Principal: Claro)
  surfaceBackground: '#F3F6F2',  // Fondo general de la aplicación (grisáceo / marfil limpio)
  surfaceDefault: '#FFFFFF',     // Superficie blanca para formularios, listas y tarjetas
  surfaceSubtle: '#EAEFE9',      // Fondo tenue alternativo para agrupaciones y separadores
  surfaceElevated: '#FFFFFF',    // Superficie para modales o tarjetas elevadas

  // Tipografía / Textos
  textPrimary: '#252B27',        // Texto principal de alto contraste (WCAG 2.2 AA)
  textSecondary: '#5E6B64',      // Texto secundario, subtítulos y metadatos
  textMuted: '#8A988F',          // Texto terciario, placeholders y marcas de tiempo
  textDisabled: '#B5C0B9',       // Texto en elementos inactivos
  textOnBrand: '#FFFFFF',        // Texto sobre botones primarios azul petróleo

  // Bordes y Separadores
  borderDefault: '#E1E8DF',      // Borde estándar sutil (1px)
  borderSubtle: '#ECF1EA',       // Borde muy tenue para separadores de listas
  borderFocus: '#174D50',        // Borde activo para inputs y selecciones
  borderError: '#DC2626',        // Borde para campos con error de validación

  // Colores Semánticos
  success: '#166534',            // Verde bosque accesible para éxito
  successBg: '#DCFCE7',          // Fondo de éxito
  warning: '#9A3412',            // Ámbar/naranja accesible para advertencias
  warningBg: '#FFEDD5',          // Fondo de advertencia
  danger: '#B91C1C',             // Rojo accesible para errores y acciones destructivas
  dangerBg: '#FEE2E2',           // Fondo de error
  info: '#1E40AF',               // Azul accesible para notas informativas
  infoBg: '#DBEAFE',             // Fondo de información
};

export const ESPACIADO = {
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space5: 20,
  space6: 24,
  space8: 32,
  space10: 40,
};

export const RADIOS = {
  sm: 6,       // Badges, chips, tags pequeños
  md: 10,      // Botones, inputs y controles estándar
  lg: 12,      // Contenedores, tarjetas y paneles
  xl: 16,      // Superficies destacadas o modales
  full: 9999,  // Círculos y avatares
};

export const TIPOGRAFIA = {
  display: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
};

export const SOMBRAS = {
  ninguna: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  sutil: {
    elevation: 1,
    shadowColor: '#174D50',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tarjeta: {
    elevation: 2,
    shadowColor: '#174D50',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
};
