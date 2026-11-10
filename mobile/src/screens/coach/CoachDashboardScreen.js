import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  ArrowUpRight,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { asistenciaOfflineRepository } from '../../services/asistenciaOfflineRepository';
import { FichAppModalFeedback } from '../../components';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../../theme';

export default function CoachDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { usuario, token, cerrarSesion } = useAuth();
  const [conexionBackend, setConexionBackend] = useState('verificando');
  const [pendientesSync, setPendientesSync] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({
    visible: false,
    tipo: 'confirmacion',
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Aceptar',
    textoCancelar: 'Cancelar',
    onConfirmar: null,
    onCancelar: null,
  });

  const actualizarContadorPendientes = async () => {
    try {
      const cuenta = await asistenciaOfflineRepository.contarPendientes();
      setPendientesSync(cuenta);
    } catch (e) {
      console.warn('Error contando pendientes:', e);
    }
  };

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
    actualizarContadorPendientes();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      actualizarContadorPendientes();
    }, [])
  );

  const ejecutarSincronizacion = async () => {
    if (sincronizando) return;

    try {
      setSincronizando(true);
      const { sesiones, registros } = await asistenciaOfflineRepository.obtenerPendientesSincronizacion();

      if (sesiones.length === 0) {
        setModalFeedback({
          visible: true,
          tipo: 'info',
          titulo: 'Al Día',
          mensaje: 'No tienes sesiones ni asistencias pendientes de sincronizar.',
          textoConfirmar: 'Entendido',
          onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
        });
        return;
      }

      const payload = {
        sesiones: sesiones.map((s) => ({
          id: s.id,
          equipo_id: s.equipo_id,
          fecha_sesion: s.fecha_sesion,
          lugar: s.lugar,
          observaciones: s.observaciones,
        })),
        registros: registros.map((r) => ({
          id: r.id,
          sesion_id: r.sesion_id,
          jugador_id: r.jugador_id,
          estado_asistencia: r.estado_asistencia,
          observaciones: r.observaciones,
        })),
      };

      const resultado = await apiService.sincronizarAsistencia(token, payload);
      
      // Marcar en SQLite local como sincronizados
      await asistenciaOfflineRepository.marcarComoSincronizados(
        resultado.sesion_ids || [],
        registros.map((r) => r.id)
      );

      await actualizarContadorPendientes();

      setModalFeedback({
        visible: true,
        tipo: 'exito',
        titulo: '¡Sincronización Exitosa!',
        mensaje: `Se subieron al servidor ${resultado.sesiones_procesadas} sesión(es) y ${resultado.registros_procesados} registro(s) de asistencia técnica.`,
        textoConfirmar: 'Excelente',
        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
      });
    } catch (err) {
      setModalFeedback({
        visible: true,
        tipo: 'error',
        titulo: 'Fallo al Sincronizar',
        mensaje: 'No se pudo completar la sincronización con el servidor: ' + (err.message || 'Error de red'),
        textoConfirmar: 'Aceptar',
        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setSincronizando(false);
    }
  };

  const confirmarSalida = () => {
    setModalFeedback({
      visible: true,
      tipo: 'peligro',
      titulo: 'Cerrar Sesión',
      mensaje: '¿Deseas cerrar tu sesión del panel de entrenador?',
      textoConfirmar: 'Cerrar Sesión',
      textoCancelar: 'Cancelar',
      onConfirmar: async () => {
        setModalFeedback((prev) => ({ ...prev, visible: false }));
        await cerrarSesion();
      },
      onCancelar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
    });
  };

  const accionesEntrenador = [
    {
      id: 'asistencia',
      titulo: 'Tomar Asistencia en Cancha',
      descripcion: 'Registro rápido táctil por jugador (Presente / Ausente / Justificado)',
      icono: CheckCircle2,
      sprint: 'Sprint 2 (Activo)',
      destacado: true,
      ruta: 'TakeAttendance',
      activo: true,
    },
    {
      id: 'equipos',
      titulo: 'Directorio de Jugadores y Plantillas',
      descripcion: 'Consulta de atletas, categorías, dorsales y fichas médicas',
      icono: Users,
      sprint: 'Sprint 1',
      destacado: false,
      ruta: 'PlayerDirectory',
      activo: true,
    },
    {
      id: 'sincronizacion',
      titulo: 'Sincronizar Lotes de Cancha',
      descripcion: pendientesSync > 0
        ? `Tienes ${pendientesSync} sesión(es) pendiente(s) por subir`
        : 'Envío de asistencias guardadas localmente al backend',
      icono: RefreshCw,
      sprint: 'Sprint 2 (Activo)',
      destacado: pendientesSync > 0,
      ruta: null,
      activo: true,
      accionCustom: ejecutarSincronizacion,
    },
  ];

  return (
    <View style={styles.contenedorPrincipal}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.brandPrimaryDark} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* =========================================================
            1. HERO BRANDING SUPERIOR (Azul Petróleo Institucional)
           ========================================================= */}
        <View style={[styles.heroSuperior, { paddingTop: Math.max(insets.top, 20) + ESPACIADO.space5 }]}>
          <View style={styles.circuloDecorativo1} />
          <View style={styles.circuloDecorativo2} />

          {/* Barra Superior del Hero: Tenant y Botón Salir */}
          <View style={styles.heroBarraSuperior}>
            <View style={styles.academiaBadge}>
              <Building2 size={14} color={COLORES.brandAccent} />
              <Text style={styles.academiaNombre} numberOfLines={1}>
                {usuario?.academia?.nombre || 'Obelisco FC'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botonSalirHero}
              onPress={confirmarSalida}
              activeOpacity={0.7}
              accessibilityLabel="Cerrar sesión"
            >
              <LogOut size={15} color="#FFFFFF" />
              <Text style={styles.botonSalirTexto}>Salir</Text>
            </TouchableOpacity>
          </View>

          {/* Saludo y Rol de Entrenador */}
          <View style={styles.heroInfoUsuario}>
            <View style={styles.rolPill}>
              <Activity size={12} color={COLORES.brandAccent} strokeWidth={2.5} />
              <Text style={styles.rolPillTexto}>CUERPO TÉCNICO • ENTRENADOR</Text>
            </View>
            <Text style={styles.usuarioSaludo}>Prof. {usuario?.nombre || 'Entrenador'}</Text>
            <Text style={styles.heroSubtitulo}>Gestión deportiva y control en cancha</Text>
          </View>

          {/* Banner de Modo Cancha Offline (Sprint 2) */}
          <View style={styles.bannerCanchaHero}>
            <View style={styles.bannerIconoContenedor}>
              <Zap size={18} color={COLORES.brandAccent} strokeWidth={2.4} />
            </View>
            <View style={styles.bannerTextoContenedor}>
              <Text style={styles.bannerTitulo}>Modo Cancha (Offline-First)</Text>
              <Text style={styles.bannerDescripcion}>
                En el Sprint 2 podrás registrar asistencia directamente en el campo sin requerir señal de internet.
              </Text>
            </View>
          </View>
        </View>

        {/* =========================================================
            2. HOJA INFERIOR CURVADA (Superficie Blanca Táctil)
           ========================================================= */}
        <View style={[styles.hojaInferior, { paddingBottom: Math.max(insets.bottom, 24) + ESPACIADO.space6 }]}>
          {/* Estado de Red / Ping */}
          <View style={styles.cajaEstadoHoja}>
            <View style={styles.estadoIzquierda}>
              {conexionBackend === 'conectado' ? (
                <Wifi size={15} color={COLORES.success} />
              ) : (
                <WifiOff size={15} color={COLORES.warning} />
              )}
              <Text style={styles.textoEstadoHoja}>
                {conexionBackend === 'conectado'
                  ? 'Conexión activa con el servidor'
                  : 'Modo sin conexión • Listo para operar en SQLite local'}
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
            <Text style={styles.seccionSubtitulo}>Acciones rápidas para entrenamientos y convocatorias</Text>
          </View>

          <View style={styles.listaAcciones}>
            {accionesEntrenador.map((a, idx) => {
              const Icono = a.icono;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    styles.accionItem,
                    a.activo && styles.accionItemActivo,
                    idx === accionesEntrenador.length - 1 && styles.accionItemUltimo,
                  ]}
                  activeOpacity={a.activo ? 0.75 : 0.9}
                  onPress={() => {
                    if (a.accionCustom) {
                      a.accionCustom();
                    } else if (a.ruta) {
                      navigation.navigate(a.ruta);
                    } else {
                      setModalFeedback({
                        visible: true,
                        tipo: 'confirmacion',
                        titulo: a.titulo,
                        mensaje: `Esta funcionalidad corresponde al ${a.sprint}. Será implementada inmediatamente en el Sprint 2.`,
                        textoConfirmar: 'Entendido',
                        textoCancelar: null,
                        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
                      });
                    }
                  }}
                >
                  <View
                    style={[
                      styles.accionIconoContenedor,
                      a.activo && styles.accionIconoActivo,
                      a.destacado && !a.activo && styles.accionIconoDestacado,
                    ]}
                  >
                    <Icono
                      size={20}
                      color={
                        a.activo
                          ? COLORES.brandPrimary
                          : a.destacado
                          ? COLORES.brandAccentDark
                          : COLORES.textMuted
                      }
                      strokeWidth={2.2}
                    />
                  </View>

                  <View style={styles.accionContenido}>
                    <View style={styles.accionTituloFila}>
                      <Text style={[styles.accionTitulo, !a.activo && styles.accionTituloInactivo]}>
                        {a.titulo}
                      </Text>
                      <View
                        style={[
                          styles.badgeSprint,
                          a.activo && styles.badgeSprintActivo,
                          a.destacado && !a.activo && styles.badgeSprintDestacado,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeSprintTexto,
                            a.activo && styles.badgeSprintTextoActivo,
                            a.destacado && !a.activo && styles.badgeSprintTextoDestacado,
                          ]}
                        >
                          {a.activo ? 'DISPONIBLE' : a.sprint}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.accionDescripcion}>{a.descripcion}</Text>
                  </View>

                  {a.activo ? (
                    <ArrowUpRight size={18} color={COLORES.brandPrimary} strokeWidth={2.2} />
                  ) : (
                    <ChevronRight size={18} color={COLORES.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Modal Desacoplado para Salida o Avisos */}
      <FichAppModalFeedback
        visible={modalFeedback.visible}
        tipo={modalFeedback.tipo}
        titulo={modalFeedback.titulo}
        mensaje={modalFeedback.mensaje}
        textoConfirmar={modalFeedback.textoConfirmar}
        textoCancelar={modalFeedback.textoCancelar}
        onConfirmar={modalFeedback.onConfirmar}
        onCancelar={modalFeedback.onCancelar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: COLORES.brandPrimaryDark,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSuperior: {
    backgroundColor: COLORES.brandPrimary,
    paddingHorizontal: ESPACIADO.space5,
    paddingBottom: ESPACIADO.space8 + ESPACIADO.space4,
    position: 'relative',
    overflow: 'hidden',
  },
  circuloDecorativo1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  circuloDecorativo2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(185, 228, 74, 0.06)',
  },
  heroBarraSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ESPACIADO.space3,
    zIndex: 2,
  },
  academiaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 5,
    borderRadius: RADIOS.full,
    maxWidth: '75%',
  },
  academiaNombre: {
    ...TIPOGRAFIA.bodySmall,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  botonSalirHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 5,
    borderRadius: RADIOS.full,
  },
  botonSalirTexto: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroInfoUsuario: {
    zIndex: 2,
    marginBottom: ESPACIADO.space3,
  },
  rolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(185, 228, 74, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: ESPACIADO.space2,
    paddingVertical: 3,
    borderRadius: RADIOS.sm,
    marginBottom: ESPACIADO.space1,
  },
  rolPillTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORES.brandAccent,
    letterSpacing: 1,
  },
  usuarioSaludo: {
    ...TIPOGRAFIA.heading1,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroSubtitulo: {
    ...TIPOGRAFIA.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  bannerCanchaHero: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(185, 228, 74, 0.25)',
    borderRadius: RADIOS.md,
    padding: ESPACIADO.space3,
    alignItems: 'flex-start',
    gap: ESPACIADO.space2 + 2,
    zIndex: 2,
  },
  bannerIconoContenedor: {
    width: 32,
    height: 32,
    borderRadius: RADIOS.sm,
    backgroundColor: 'rgba(185, 228, 74, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextoContenedor: {
    flex: 1,
  },
  bannerTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerDescripcion: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 15,
  },
  hojaInferior: {
    flex: 1,
    backgroundColor: COLORES.surfaceDefault,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: ESPACIADO.space5,
    paddingTop: ESPACIADO.space6,
    marginTop: -ESPACIADO.space4,
    ...SOMBRAS.tarjeta,
  },
  cajaEstadoHoja: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORES.surfaceSubtle,
    paddingHorizontal: ESPACIADO.space4,
    paddingVertical: ESPACIADO.space2 + 2,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    marginBottom: ESPACIADO.space4,
  },
  estadoIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
    flex: 1,
  },
  textoEstadoHoja: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '500',
    fontSize: 11,
  },
  puntoConexion: {
    width: 7,
    height: 7,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.textMuted,
  },
  puntoVerde: {
    backgroundColor: COLORES.success,
  },
  puntoNaranja: {
    backgroundColor: COLORES.warning,
  },
  seccionEncabezado: {
    marginBottom: ESPACIADO.space3,
  },
  seccionTitulo: {
    ...TIPOGRAFIA.heading2,
    fontSize: 18,
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
  accionItemActivo: {
    backgroundColor: '#FAFCF8',
  },
  accionItemUltimo: {
    borderBottomWidth: 0,
  },
  accionIconoContenedor: {
    width: 42,
    height: 42,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accionIconoActivo: {
    backgroundColor: COLORES.brandPrimarySubtle,
  },
  accionIconoDestacado: {
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
    fontWeight: '700',
  },
  accionTituloInactivo: {
    color: COLORES.textSecondary,
    fontWeight: '600',
  },
  accionDescripcion: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    lineHeight: 16,
  },
  badgeSprint: {
    backgroundColor: COLORES.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIOS.sm,
  },
  badgeSprintActivo: {
    backgroundColor: COLORES.brandAccentSubtle,
  },
  badgeSprintDestacado: {
    backgroundColor: COLORES.brandAccentSubtle,
  },
  badgeSprintTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORES.textMuted,
  },
  badgeSprintTextoActivo: {
    color: COLORES.brandAccentDark,
  },
  badgeSprintTextoDestacado: {
    color: COLORES.brandAccentDark,
  },
});
