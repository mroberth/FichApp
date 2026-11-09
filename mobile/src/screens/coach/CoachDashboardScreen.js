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
import {
  CheckCircle2,
  Users,
  RefreshCw,
  LogOut,
  Wifi,
  WifiOff,
  Building2,
  ChevronRight,
  Zap,
  Activity,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../../theme';

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

  const accionesEntrenador = [
    {
      id: 'asistencia',
      titulo: 'Tomar Asistencia en Cancha',
      descripcion: 'Registro rápido táctil por jugador (Presente / Ausente)',
      icono: CheckCircle2,
      sprint: 'Sprint 2',
      destacado: true,
    },
    {
      id: 'equipos',
      titulo: 'Mis Equipos y Categorías',
      descripcion: 'Plantilla de atletas convocados y fichas médicas',
      icono: Users,
      sprint: 'Sprint 1',
      destacado: false,
    },
    {
      id: 'sincronizacion',
      titulo: 'Sincronizar Lotes de Cancha',
      descripcion: 'Envío seguro de asistencias registradas sin conexión',
      icono: RefreshCw,
      sprint: 'Sprint 2',
      destacado: false,
    },
  ];

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORES.surfaceBackground} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera del Entrenador */}
        <View style={styles.cabecera}>
          <View style={styles.cabeceraInfo}>
            <View style={styles.organizacionFila}>
              <Building2 size={16} color={COLORES.brandPrimary} />
              <Text style={styles.academiaNombre}>
                {usuario?.academia?.nombre || 'Obelisco FC'}
              </Text>
            </View>
            <Text style={styles.usuarioNombre}>{usuario?.nombre}</Text>
            <View style={styles.rolBadge}>
              <Activity size={12} color={COLORES.brandPrimary} />
              <Text style={styles.rolTexto}>CUERPO TÉCNICO / ENTRENADOR</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.botonSalir}
            onPress={confirmarSalida}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar sesión"
          >
            <LogOut size={16} color={COLORES.danger} />
            <Text style={styles.botonSalirTexto}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Modo Cancha Offline (Sprint 2) */}
        <View style={styles.bannerCancha}>
          <View style={styles.bannerIconoContenedor}>
            <Zap size={20} color={COLORES.brandPrimary} strokeWidth={2.4} />
          </View>
          <View style={styles.bannerTextoContenedor}>
            <Text style={styles.bannerTitulo}>Modo Cancha (Offline-First)</Text>
            <Text style={styles.bannerDescripcion}>
              Sesión guardada en almacenamiento seguro. En el Sprint 2 podrás registrar asistencia directamente en el campo sin requerir señal de internet.
            </Text>
          </View>
        </View>

        {/* Estado de Red */}
        <View style={styles.cajaEstado}>
          <View style={styles.estadoIzquierda}>
            {conexionBackend === 'conectado' ? (
              <Wifi size={16} color={COLORES.success} />
            ) : (
              <WifiOff size={16} color={COLORES.warning} />
            )}
            <Text style={styles.textoEstado}>
              {conexionBackend === 'conectado'
                ? 'Conectado al servidor de FichApp'
                : 'Modo sin conexión • Listo para operar localmente'}
            </Text>
          </View>
          <View
            style={[
              styles.puntoConexion,
              conexionBackend === 'conectado' && styles.puntoVerde,
              conexionBackend === 'desconectado' && styles.puntoNaranja,
            ]}
          />
        </View>

        {/* Herramientas de Cancha */}
        <View style={styles.seccionEncabezado}>
          <Text style={styles.seccionTitulo}>Herramientas de Cancha</Text>
          <Text style={styles.seccionSubtitulo}>Acciones rápidas para entrenamientos y partidos</Text>
        </View>

        <View style={styles.listaAcciones}>
          {accionesEntrenador.map((a, idx) => {
            const Icono = a.icono;
            return (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.accionItem,
                  idx === accionesEntrenador.length - 1 && styles.accionItemUltimo,
                  a.destacado && styles.accionItemDestacado,
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.accionIconoContenedor,
                    a.destacado && styles.accionIconoContenedorDestacado,
                  ]}
                >
                  <Icono
                    size={20}
                    color={a.destacado ? COLORES.brandPrimaryDark : COLORES.brandPrimary}
                    strokeWidth={2.2}
                  />
                </View>

                <View style={styles.accionContenido}>
                  <View style={styles.accionTituloFila}>
                    <Text style={styles.accionTitulo}>{a.titulo}</Text>
                    <View
                      style={[
                        styles.badgeSprint,
                        a.destacado && styles.badgeSprintDestacado,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeSprintTexto,
                          a.destacado && styles.badgeSprintTextoDestacado,
                        ]}
                      >
                        {a.sprint}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.accionDescripcion}>{a.descripcion}</Text>
                </View>

                <ChevronRight size={18} color={COLORES.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.surfaceBackground,
  },
  scroll: {
    paddingHorizontal: ESPACIADO.space5,
    paddingVertical: ESPACIADO.space4,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: COLORES.surfaceDefault,
    padding: ESPACIADO.space4,
    borderRadius: RADIOS.lg,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    marginBottom: ESPACIADO.space3,
    ...SOMBRAS.sutil,
  },
  cabeceraInfo: {
    flex: 1,
  },
  organizacionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
    marginBottom: ESPACIADO.space1,
  },
  academiaNombre: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.brandPrimary,
  },
  usuarioNombre: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textPrimary,
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORES.brandPrimarySubtle,
    alignSelf: 'flex-start',
    paddingHorizontal: ESPACIADO.space2,
    paddingVertical: 3,
    borderRadius: RADIOS.sm,
    marginTop: ESPACIADO.space2,
  },
  rolTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORES.brandPrimary,
    letterSpacing: 0.5,
  },
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: ESPACIADO.space2,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.dangerBg,
    backgroundColor: COLORES.dangerBg,
  },
  botonSalirTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.danger,
    fontWeight: '600',
  },
  bannerCancha: {
    flexDirection: 'row',
    backgroundColor: COLORES.surfaceDefault,
    borderRadius: RADIOS.lg,
    borderWidth: 1,
    borderColor: COLORES.brandAccent,
    padding: ESPACIADO.space4,
    marginBottom: ESPACIADO.space3,
    alignItems: 'flex-start',
    gap: ESPACIADO.space3,
    ...SOMBRAS.sutil,
  },
  bannerIconoContenedor: {
    width: 36,
    height: 36,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.brandAccentSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  bannerTextoContenedor: {
    flex: 1,
  },
  bannerTitulo: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.brandPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerDescripcion: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    lineHeight: 18,
  },
  cajaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORES.surfaceDefault,
    paddingHorizontal: ESPACIADO.space4,
    paddingVertical: ESPACIADO.space3,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    marginBottom: ESPACIADO.space5,
  },
  estadoIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
    flex: 1,
  },
  puntoConexion: {
    width: 8,
    height: 8,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.textMuted,
  },
  puntoVerde: {
    backgroundColor: COLORES.success,
  },
  puntoNaranja: {
    backgroundColor: COLORES.warning,
  },
  textoEstado: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '500',
  },
  seccionEncabezado: {
    marginBottom: ESPACIADO.space3,
  },
  seccionTitulo: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.textPrimary,
  },
  seccionSubtitulo: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    marginTop: 2,
  },
  listaAcciones: {
    backgroundColor: COLORES.surfaceDefault,
    borderRadius: RADIOS.lg,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    marginBottom: ESPACIADO.space5,
    overflow: 'hidden',
    ...SOMBRAS.sutil,
  },
  accionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ESPACIADO.space4,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borderSubtle,
    gap: ESPACIADO.space3,
  },
  accionItemUltimo: {
    borderBottomWidth: 0,
  },
  accionItemDestacado: {
    backgroundColor: '#FAFCF8',
  },
  accionIconoContenedor: {
    width: 40,
    height: 40,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accionIconoContenedorDestacado: {
    backgroundColor: COLORES.brandAccentSubtle,
  },
  accionContenido: {
    flex: 1,
  },
  accionTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  accionTitulo: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textPrimary,
    fontWeight: '600',
  },
  accionDescripcion: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
  },
  badgeSprint: {
    backgroundColor: COLORES.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIOS.sm,
  },
  badgeSprintDestacado: {
    backgroundColor: COLORES.brandAccentSubtle,
  },
  badgeSprintTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORES.textSecondary,
  },
  badgeSprintTextoDestacado: {
    color: COLORES.brandAccentDark,
  },
});
