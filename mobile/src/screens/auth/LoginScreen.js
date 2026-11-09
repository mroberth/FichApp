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
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
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
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Cabecera / Identidad */}
        <View style={styles.encabezado}>
          <View style={styles.insigniaContenedor}>
            <Text style={styles.insigniaTexto}>⚽ FICHAPP</Text>
          </View>
          <Text style={styles.titulo}>Bienvenido</Text>
          <Text style={styles.subtitulo}>Gestión integral de academias deportivas</Text>
        </View>

        {/* Tarjeta del Formulario */}
        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaTitulo}>Iniciar Sesión</Text>

          {error && (
            <View style={styles.cajaError}>
              <Text style={styles.cajaErrorTexto}>⚠️ {error}</Text>
            </View>
          )}

          <View style={styles.campoGrupo}>
            <Text style={styles.etiqueta}>Usuario o Correo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: admin o entrenador"
              placeholderTextColor="#94a3b8"
              value={identificador}
              onChangeText={(t) => {
                limpiarError();
                setIdentificador(t);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.campoGrupo}>
            <Text style={styles.etiqueta}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={contrasena}
              onChangeText={(t) => {
                limpiarError();
                setContrasena(t);
              }}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.botonPrincipal, cargando && styles.botonDeshabilitado]}
            onPress={manejarLogin}
            disabled={cargando}
            activeOpacity={0.8}
          >
            {cargando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.botonPrincipalTexto}>Ingresar al Sistema</Text>
            )}
          </TouchableOpacity>

          {/* Accesos Rápidos para Pruebas / Piloto Obelisco FC */}
          <View style={styles.seccionDemo}>
            <Text style={styles.seccionDemoTitulo}>Cuentas Piloto (Obelisco FC):</Text>
            <View style={styles.demoBotonesFila}>
              <TouchableOpacity
                style={styles.demoBoton}
                onPress={() => rellenarCredenciales('admin', 'password123')}
              >
                <Text style={styles.demoBotonTexto}>👑 Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBoton}
                onPress={() => rellenarCredenciales('entrenador', 'password123')}
              >
                <Text style={styles.demoBotonTexto}>📋 Entrenador</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pie de página */}
        <Text style={styles.piePagina}>FichApp v0.3 • Piloto Obelisco FC (Barquisimeto)</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 28,
  },
  insigniaContenedor: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginBottom: 12,
  },
  insigniaTexto: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  tarjeta: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tarjetaTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 20,
  },
  cajaError: {
    backgroundColor: '#451a1a',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  cajaErrorTexto: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 18,
  },
  campoGrupo: {
    marginBottom: 18,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 15,
  },
  botonPrincipal: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonPrincipalTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  seccionDemo: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  seccionDemoTitulo: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10,
    textAlign: 'center',
  },
  demoBotonesFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  demoBoton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoBotonTexto: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  piePagina: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
