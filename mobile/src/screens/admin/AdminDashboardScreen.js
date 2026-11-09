import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';

export default function AdminDashboardScreen() {
  const { usuario, cerrarSesion } = useAuth();
  const [conexionBackend, setConexionBackend] = useState('verificando');

  useEffect(() => {
    const verificarSalud = async () => {
      try {
        await apiService.ping();
        setConexionBackend('conectado');
      } catch {
        setConexionBackend('desconectado');
      }
    };
    verificarSalud();
  }, []);

  const confirmarSalida = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir del sistema?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: cerrarSesion },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cabecera del Administrador */}
        <View style={styles.cabecera}>
          <View>
            <Text style={styles.academiaNombre}>
              ⚽ {usuario?.academia?.nombre || 'Obelisco FC'}
            </Text>
            <Text style={styles.usuarioNombre}>{usuario?.nombre}</Text>
            <View style={styles.rolBadge}>
              <Text style={styles.rolTexto}>DIRECTOR / ADMINISTRADOR</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.botonSalir} onPress={confirmarSalida}>
            <Text style={styles.botonSalirTexto}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Estado de conexión con el Backend */}
        <View style={styles.cajaEstado}>
          <View
            style={[
              styles.puntoConexion,
              conexionBackend === 'conectado' && styles.puntoVerde,
              conexionBackend === 'desconectado' && styles.puntoRojo,
            ]}
          />
          <Text style={styles.textoEstado}>
            {conexionBackend === 'conectado'
              ? 'API Backend conectada y operativa'
              : conexionBackend === 'desconectado'
              ? 'Sin conexión con el backend (127.0.0.1:8000)'
              : 'Verificando enlace con API...'}
          </Text>
        </View>

        {/* Resumen Operativo */}
        <Text style={styles.seccionTitulo}>Módulos Administrativos (Sprint 1 a 5)</Text>

        <View style={styles.grid}>
          <View style={styles.tarjeta}>
            <Text style={styles.tarjetaIcono}>👥</Text>
            <Text style={styles.tarjetaTitulo}>Jugadores & Familias</Text>
            <Text style={styles.tarjetaSubtitulo}>Directorio, fichas y categorías</Text>
            <View style={styles.badgeSprint}><Text style={styles.badgeSprintTexto}>Sprint 1</Text></View>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.tarjetaIcono}>💵</Text>
            <Text style={styles.tarjetaTitulo}>Cobranzas & Pagos</Text>
            <Text style={styles.tarjetaSubtitulo}>Pagos familiares y tasa BCV</Text>
            <View style={styles.badgeSprint}><Text style={styles.badgeSprintTexto}>Sprint 4</Text></View>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.tarjetaIcono}>📊</Text>
            <Text style={styles.tarjetaTitulo}>Obligaciones & Cuotas</Text>
            <Text style={styles.tarjetaSubtitulo}>Generación masiva y pronto-pago</Text>
            <View style={styles.badgeSprint}><Text style={styles.badgeSprintTexto}>Sprint 3</Text></View>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.tarjetaIcono}>📑</Text>
            <Text style={styles.tarjetaTitulo}>Cuadre Diario & Caja</Text>
            <Text style={styles.tarjetaSubtitulo}>Reportes de ingresos en USD y VES</Text>
            <View style={styles.badgeSprint}><Text style={styles.badgeSprintTexto}>Sprint 5</Text></View>
          </View>
        </View>

        {/* Información Técnica del Usuario */}
        <View style={styles.cajaInfo}>
          <Text style={styles.cajaInfoTitulo}>Información de la Cuenta</Text>
          <Text style={styles.cajaInfoItem}>• ID Usuario: {usuario?.id}</Text>
          <Text style={styles.cajaInfoItem}>• Acceso: {usuario?.identificador_acceso}</Text>
          <Text style={styles.cajaInfoItem}>• Correo: {usuario?.correo || 'No registrado'}</Text>
          <Text style={styles.cajaInfoItem}>• ID Academia: {usuario?.academia_id}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scroll: {
    padding: 20,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  academiaNombre: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38bdf8',
  },
  usuarioNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
  },
  rolBadge: {
    backgroundColor: '#3b82f6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  rolTexto: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  botonSalir: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonSalirTexto: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  cajaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  puntoConexion: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#eab308',
    marginRight: 10,
  },
  puntoVerde: {
    backgroundColor: '#22c55e',
  },
  puntoRojo: {
    backgroundColor: '#ef4444',
  },
  textoEstado: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 14,
  },
  grid: {
    gap: 12,
    marginBottom: 24,
  },
  tarjeta: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tarjetaIcono: {
    fontSize: 26,
    marginBottom: 6,
  },
  tarjetaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  tarjetaSubtitulo: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 10,
  },
  badgeSprint: {
    backgroundColor: '#334155',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSprintTexto: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  cajaInfo: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cajaInfoTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cajaInfoItem: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
