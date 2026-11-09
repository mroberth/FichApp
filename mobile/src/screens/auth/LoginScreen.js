import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, User, Lock, AlertCircle, ArrowRight, UserCheck, ClipboardList } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../../theme';

export default function LoginScreen() {
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [focoCampo, setFocoCampo] = useState(null);
  const { iniciarSesion, cargando, error, limpiarError } = useAuth();

  const manejarLogin = async () => {
    if (!identificador.trim() || !contrasena) {
      return;
    }
    await iniciarSesion(identificador.trim(), contrasena);
  };

  const rellenarCredenciales = (usuarioDemo, claveDemo) => {
    limpiarError();
    setIdentificador(usuarioDemo);
    setContrasena(claveDemo);
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORES.surfaceBackground} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera / Identidad de Marca */}
          <View style={styles.encabezado}>
            <View style={styles.emblema}>
              <Shield size={28} color={COLORES.brandPrimary} strokeWidth={2.2} />
              <View style={styles.puntoAcento} />
            </View>
            <Text style={styles.marcaTexto}>FICHAPP</Text>
            <Text style={styles.titulo}>Acceso al Sistema</Text>
            <Text style={styles.subtitulo}>Gestión operativa y deportiva de academias</Text>
          </View>

          {/* Formulario */}
          <View style={styles.tarjeta}>
            {error && (
              <View style={styles.cajaError}>
                <AlertCircle size={18} color={COLORES.danger} strokeWidth={2} style={styles.iconoError} />
                <Text style={styles.cajaErrorTexto}>{error}</Text>
              </View>
            )}

            {/* Campo Usuario */}
            <View style={styles.campoGrupo}>
              <Text style={styles.etiqueta}>Identificador de acceso o correo</Text>
              <View
                style={[
                  styles.inputContenedor,
                  focoCampo === 'usuario' && styles.inputContenedorEnfocado,
                ]}
              >
                <User size={18} color={focoCampo === 'usuario' ? COLORES.brandPrimary : COLORES.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: admin o entrenador"
                  placeholderTextColor={COLORES.textMuted}
                  value={identificador}
                  onChangeText={(t) => {
                    limpiarError();
                    setIdentificador(t);
                  }}
                  onFocus={() => setFocoCampo('usuario')}
                  onBlur={() => setFocoCampo(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Campo Contraseña */}
            <View style={styles.campoGrupo}>
              <Text style={styles.etiqueta}>Contraseña</Text>
              <View
                style={[
                  styles.inputContenedor,
                  focoCampo === 'clave' && styles.inputContenedorEnfocado,
                ]}
              >
                <Lock size={18} color={focoCampo === 'clave' ? COLORES.brandPrimary : COLORES.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor={COLORES.textMuted}
                  value={contrasena}
                  onChangeText={(t) => {
                    limpiarError();
                    setContrasena(t);
                  }}
                  onFocus={() => setFocoCampo('clave')}
                  onBlur={() => setFocoCampo(null)}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Botón Principal de Acción */}
            <TouchableOpacity
              style={[styles.botonPrincipal, cargando && styles.botonDeshabilitado]}
              onPress={manejarLogin}
              disabled={cargando}
              activeOpacity={0.85}
            >
              {cargando ? (
                <ActivityIndicator color={COLORES.textOnBrand} />
              ) : (
                <View style={styles.botonPrincipalContenido}>
                  <Text style={styles.botonPrincipalTexto}>Iniciar Sesión</Text>
                  <ArrowRight size={18} color={COLORES.textOnBrand} strokeWidth={2.2} />
                </View>
              )}
            </TouchableOpacity>

            {/* Accesos de Prueba Piloto */}
            <View style={styles.seccionDemo}>
              <Text style={styles.seccionDemoTitulo}>Cuentas del Piloto Obelisco FC</Text>
              <View style={styles.demoBotonesFila}>
                <TouchableOpacity
                  style={styles.demoBoton}
                  onPress={() => rellenarCredenciales('admin', 'password123')}
                  activeOpacity={0.7}
                >
                  <UserCheck size={16} color={COLORES.brandPrimary} />
                  <Text style={styles.demoBotonTexto}>Admin Obelisco</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoBoton}
                  onPress={() => rellenarCredenciales('entrenador', 'password123')}
                  activeOpacity={0.7}
                >
                  <ClipboardList size={16} color={COLORES.brandPrimary} />
                  <Text style={styles.demoBotonTexto}>Entrenador</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Pie de página */}
          <Text style={styles.piePagina}>FichApp • Piloto Obelisco FC (Barquisimeto, VE)</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.surfaceBackground,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: ESPACIADO.space5,
    paddingVertical: ESPACIADO.space6,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: ESPACIADO.space6,
  },
  emblema: {
    width: 56,
    height: 56,
    borderRadius: RADIOS.xl,
    backgroundColor: COLORES.surfaceDefault,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ESPACIADO.space3,
    position: 'relative',
    ...SOMBRAS.sutil,
  },
  puntoAcento: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.brandAccent,
  },
  marcaTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORES.brandPrimary,
    letterSpacing: 2,
    marginBottom: ESPACIADO.space1,
  },
  titulo: {
    ...TIPOGRAFIA.heading1,
    color: COLORES.textPrimary,
    textAlign: 'center',
  },
  subtitulo: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    textAlign: 'center',
    marginTop: ESPACIADO.space1,
  },
  tarjeta: {
    backgroundColor: COLORES.surfaceDefault,
    borderRadius: RADIOS.lg,
    padding: ESPACIADO.space6,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    ...SOMBRAS.tarjeta,
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
  campoGrupo: {
    marginBottom: ESPACIADO.space4,
  },
  etiqueta: {
    ...TIPOGRAFIA.label,
    color: COLORES.textPrimary,
    marginBottom: ESPACIADO.space2,
  },
  inputContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.surfaceDefault,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    borderRadius: RADIOS.md,
    paddingHorizontal: ESPACIADO.space3,
    height: 46,
    gap: ESPACIADO.space2,
  },
  inputContenedorEnfocado: {
    borderColor: COLORES.borderFocus,
    backgroundColor: COLORES.surfaceDefault,
  },
  input: {
    flex: 1,
    ...TIPOGRAFIA.body,
    color: COLORES.textPrimary,
    height: '100%',
  },
  botonPrincipal: {
    backgroundColor: COLORES.brandPrimary,
    borderRadius: RADIOS.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ESPACIADO.space2,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonPrincipalContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
  },
  botonPrincipalTexto: {
    ...TIPOGRAFIA.button,
    color: COLORES.textOnBrand,
  },
  seccionDemo: {
    marginTop: ESPACIADO.space6,
    paddingTop: ESPACIADO.space4,
    borderTopWidth: 1,
    borderTopColor: COLORES.borderSubtle,
  },
  seccionDemoTitulo: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    marginBottom: ESPACIADO.space3,
    textAlign: 'center',
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
    fontWeight: '600',
  },
  piePagina: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textMuted,
    textAlign: 'center',
    marginTop: ESPACIADO.space6,
  },
});
