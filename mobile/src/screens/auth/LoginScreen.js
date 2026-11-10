import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Lock, AlertCircle, ArrowRight, UserCheck, ClipboardList, Shield } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { FichAppInput, FichAppLogoCompleto } from '../../components';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../../theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [erroresValidacion, setErroresValidacion] = useState({});
  const { iniciarSesion, cargando, error, limpiarError } = useAuth();

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!identificador.trim()) {
      nuevosErrores.identificador = 'Ingresa tu usuario o correo electrónico.';
    }
    if (!contrasena) {
      nuevosErrores.contrasena = 'Ingresa tu contraseña.';
    }
    setErroresValidacion(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarLogin = async () => {
    limpiarError();
    if (!validarFormulario()) {
      return;
    }
    await iniciarSesion(identificador.trim(), contrasena);
  };

  const rellenarCredenciales = (usuarioDemo, claveDemo) => {
    limpiarError();
    setErroresValidacion({});
    setIdentificador(usuarioDemo);
    setContrasena(claveDemo);
  };

  return (
    <View style={styles.contenedorPrincipal}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.brandPrimaryDark} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* =========================================================
              1. HERO BRANDING SUPERIOR (Azul Petróleo Profundo)
             ========================================================= */}
          <View style={[styles.heroSuperior, { paddingTop: Math.max(insets.top, 24) + ESPACIADO.space3 }]}>
            {/* Elementos decorativos de fondo (ondas / cancha sutil) */}
            <View style={styles.circuloDecorativo1} />
            <View style={styles.circuloDecorativo2} />

            <View style={styles.heroContenido}>
              {/* Badge Deportivo Superior */}
              <View style={styles.badgePlataforma}>
                <Shield size={12} color={COLORES.brandAccent} strokeWidth={2.5} />
                <Text style={styles.badgePlataformaTexto}>PLATAFORMA DEPORTIVA</Text>
              </View>

              {/* Logotipo Oficial Completo (Isotipo + Tipografía FichApp) */}
              <FichAppLogoCompleto
                width={160}
                height={130}
                colorEscudo="#FFFFFF"
                colorCheck={COLORES.brandAccent}
                colorTextoFich="#FFFFFF"
                colorTextoApp={COLORES.brandAccent}
              />

              <Text style={styles.heroSubtitulo}>Gestión integral y deportiva de academias</Text>
            </View>
          </View>

          {/* =========================================================
              2. HOJA INFERIOR CURVADA (Superficie Blanca Curvada)
             ========================================================= */}
          <View style={[styles.hojaInferior, { paddingBottom: Math.max(insets.bottom, 24) + ESPACIADO.space6 }]}>
            <Text style={styles.formularioTitulo}>Iniciar Sesión</Text>
            <Text style={styles.formularioSubtitulo}>Ingresa tus credenciales para acceder a la gestión</Text>

            {/* Banner de error de sesión o red */}
            {error && (
              <View style={styles.cajaError}>
                <AlertCircle size={18} color={COLORES.danger} strokeWidth={2} style={styles.iconoError} />
                <Text style={styles.cajaErrorTexto}>{error}</Text>
              </View>
            )}

            {/* Input Usuario */}
            <FichAppInput
              label="Identificador de acceso o correo"
              placeholder="Ej: admin o entrenador"
              value={identificador}
              onChangeText={(t) => {
                limpiarError();
                setErroresValidacion((prev) => ({ ...prev, identificador: null }));
                setIdentificador(t);
              }}
              error={erroresValidacion.identificador}
              iconoIzquierdo={User}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            {/* Input Contraseña */}
            <FichAppInput
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={contrasena}
              onChangeText={(t) => {
                limpiarError();
                setErroresValidacion((prev) => ({ ...prev, contrasena: null }));
                setContrasena(t);
              }}
              error={erroresValidacion.contrasena}
              iconoIzquierdo={Lock}
              esContrasena
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={manejarLogin}
            />

            {/* Botón Principal de Acción */}
            <TouchableOpacity
              style={[styles.botonPrincipal, cargando && styles.botonDeshabilitado]}
              onPress={manejarLogin}
              disabled={cargando}
              activeOpacity={0.88}
            >
              {cargando ? (
                <ActivityIndicator color={COLORES.textOnBrand} size="small" />
              ) : (
                <View style={styles.botonPrincipalContenido}>
                  <Text style={styles.botonPrincipalTexto}>Entrar al Sistema</Text>
                  <ArrowRight size={18} color={COLORES.textOnBrand} strokeWidth={2.4} />
                </View>
              )}
            </TouchableOpacity>

            {/* Accesos Rápidos Piloto Obelisco FC */}
            <View style={styles.seccionDemo}>
              <Text style={styles.seccionDemoTitulo}>Accesos Rápidos • Piloto Obelisco FC</Text>
              <View style={styles.demoBotonesFila}>
                <TouchableOpacity
                  style={styles.demoBoton}
                  onPress={() => rellenarCredenciales('admin', 'password123')}
                  activeOpacity={0.7}
                >
                  <UserCheck size={15} color={COLORES.brandPrimary} />
                  <Text style={styles.demoBotonTexto}>Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoBoton}
                  onPress={() => rellenarCredenciales('entrenador', 'password123')}
                  activeOpacity={0.7}
                >
                  <ClipboardList size={15} color={COLORES.brandPrimary} />
                  <Text style={styles.demoBotonTexto}>Entrenador</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pie de pantalla */}
            <Text style={styles.piePagina}>Barquisimeto, VE • © {new Date().getFullYear()} FichApp</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: COLORES.brandPrimaryDark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSuperior: {
    backgroundColor: COLORES.brandPrimary,
    paddingHorizontal: ESPACIADO.space6,
    paddingBottom: ESPACIADO.space8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 260,
  },
  circuloDecorativo1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  circuloDecorativo2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(185, 228, 74, 0.06)', // Tinte verde lima sutil
  },
  heroContenido: {
    alignItems: 'center',
    zIndex: 2,
  },
  emblemaHero: {
    width: 76,
    height: 76,
    borderRadius: RADIOS.xl + 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ESPACIADO.space3,
    ...SOMBRAS.tarjeta,
  },
  badgePlataforma: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 3,
    borderRadius: RADIOS.full,
    marginBottom: ESPACIADO.space2,
  },
  badgePlataformaTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORES.brandAccent,
    letterSpacing: 1.2,
  },
  heroTitulo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  heroSubtitulo: {
    ...TIPOGRAFIA.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  hojaInferior: {
    flex: 1,
    backgroundColor: COLORES.surfaceDefault,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: ESPACIADO.space6,
    paddingTop: ESPACIADO.space6,
    marginTop: -ESPACIADO.space6, // Superposición sutil con la cabecera hero
    ...SOMBRAS.tarjeta,
  },
  formularioTitulo: {
    ...TIPOGRAFIA.heading2,
    color: COLORES.textPrimary,
    fontWeight: '700',
  },
  formularioSubtitulo: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    marginBottom: ESPACIADO.space5,
    marginTop: 2,
  },
  cajaError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.dangerBg,
    borderColor: COLORES.danger,
    borderWidth: 1,
    borderRadius: RADIOS.md,
    padding: ESPACIADO.space3,
    marginBottom: ESPACIADO.space4,
  },
  iconoError: {
    marginRight: ESPACIADO.space2,
  },
  cajaErrorTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.danger,
    flex: 1,
    fontWeight: '500',
  },
  botonPrincipal: {
    backgroundColor: COLORES.brandPrimary,
    borderRadius: RADIOS.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ESPACIADO.space3,
    ...SOMBRAS.sutil,
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
  botonPrincipalContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
  },
  botonPrincipalTexto: {
    ...TIPOGRAFIA.button,
    color: COLORES.textOnBrand,
    fontSize: 15,
    fontWeight: '700',
  },
  seccionDemo: {
    marginTop: ESPACIADO.space5,
    paddingTop: ESPACIADO.space4,
    borderTopWidth: 1,
    borderTopColor: COLORES.borderSubtle,
  },
  seccionDemoTitulo: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORES.textMuted,
    marginBottom: ESPACIADO.space3,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoBotonesFila: {
    flexDirection: 'row',
    gap: ESPACIADO.space3,
  },
  demoBoton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.space2,
    backgroundColor: COLORES.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    borderRadius: RADIOS.md,
    paddingVertical: ESPACIADO.space2 + 2,
  },
  demoBotonTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.brandPrimary,
    fontWeight: '700',
  },
  piePagina: {
    fontSize: 11,
    color: COLORES.textMuted,
    textAlign: 'center',
    marginTop: ESPACIADO.space5,
  },
});
