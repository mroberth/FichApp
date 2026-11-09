import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';

export default function CoachDashboardScreen() {
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
      '¿Deseas cerrar tu sesión de entrenador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: cerrarSesion },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#064e3b" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cabecera Deportiva */}
        <View style={styles.cabecera}>
          <View>
            <Text style={styles.academiaNombre}>
              ⚽ {usuario?.academia?.nombre || 'Obelisco FC'}
            </Text>
            <Text style={styles.usuarioNombre}>{usuario?.nombre}</Text>
            <View style={styles.rolBadge}>
              <Text style={styles.rolTexto}>CUERPO TÉCNICO / ENTRENADOR</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.botonSalir} onPress={confirmarSalida}>
            <Text style={styles.botonSalirTexto}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Modo Cancha Offline (Sprint 2) */}
        <View style={styles.bannerCancha}>
          <View style={styles.bannerIcono}>
            <Text style={{ fontSize: 24 }}>⚡</Text>
          </View>
          <View style={styles.bannerContenido}>
            <Text style={styles.bannerTitulo}>Modo Cancha (Offline-First)</Text>
            <Text style={styles.bannerTexto}>
              Tu sesión está almacenada de forma segura. Podrás tomar asistencia sin señal en el Sprint 2.
            </Text>
          </View>
        </View>

        {/* Estado de sincronización */}
        <View style={styles.cajaEstado}>
          <View
            style={[
              styles.puntoConexion,
              conexionBackend === 'conectado' && styles.puntoVerde,
              conexionBackend === 'desconectado' && styles.puntoNaranja,
            ]}
          />
          <Text style={styles.textoEstado}>
            {conexionBackend === 'conectado'
              ? 'Conectado al servidor principal'
              : 'Modo sin conexión o servidor local en espera'}
          </Text>
        </View>

        {/* Funciones del Entrenador */}
        <Text style={styles.seccionTitulo}>Herramientas de Cancha</Text>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.tarjetaAccion} activeOpacity={0.8}>
            <Text style={styles.tarjetaIcono}>📋</Text>
            <Text style={styles.tarjetaTitulo}>Tomar Asistencia Rápida</Text>
            <Text style={styles.tarjetaSubtitulo}>Registro táctil por jugador (Presente / Ausente)</Text>
            <View style={styles.badgeSprint}><Text style={styles.badgeSprintTexto}>Sprint 2</Text></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tarjetaAccion} activeOpacity={0.8}>
            <Text style={styles.tarjetaIcono}>👥</Text>
            <Text style={styles.tarjetaTitulo}>Mis Equipos & Categorías</Text>
            <Text style={styles.tarjetaSubtitulo}>Listado de atletas convocados y fichas médicas</Text>
            <View style={styles.badgeSprint}><Text style={styles.badgeSprintTexto}>Sprint 1</Text></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tarjetaAccion} activeOpacity={0.8}>
            <Text style={styles.tarjetaIcono}>🔄</Text>
            <Text style={styles.tarjetaTitulo}>Sincronizar Lotes Pendientes</Text>
            <Text style={styles.tarjetaSubtitulo}>Envío de asistencias tomadas sin internet</Text>
            <View style={styles.badgeSprint}><Text style={styles.badgeSprintTexto}>Sprint 2</Text></View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#022c22', // Fondo verde oscuro deportivo
  },
  scroll: {
    padding: 20,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#064e3b',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#047857',
    marginBottom: 16,
  },
  academiaNombre: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34d399',
  },
  usuarioNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
  },
  rolBadge: {
    backgroundColor: '#059669',
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
  bannerCancha: {
    flexDirection: 'row',
    backgroundColor: '#065f46',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  bannerIcono: {
    marginRight: 12,
  },
  bannerContenido: {
    flex: 1,
  },
  bannerTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  bannerTexto: {
    fontSize: 12,
    color: '#a7f3d0',
    marginTop: 2,
    lineHeight: 16,
  },
  cajaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#047857',
  },
  puntoConexion: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#eab308',
    marginRight: 10,
  },
  puntoVerde: {
    backgroundColor: '#34d399',
  },
  puntoNaranja: {
    backgroundColor: '#f97316',
  },
  textoEstado: {
    color: '#d1fae5',
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
  },
  tarjetaAccion: {
    backgroundColor: '#064e3b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#047857',
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
    color: '#a7f3d0',
    marginTop: 2,
    marginBottom: 10,
  },
  badgeSprint: {
    backgroundColor: '#047857',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSprintTexto: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
